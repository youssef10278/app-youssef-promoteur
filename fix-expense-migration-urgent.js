// Script de correction urgente pour la migration des dépenses
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

// Configuration de la base de données
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

// Pour Railway en production
if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
  config.connectionString = process.env.DATABASE_URL;
  config.ssl = { rejectUnauthorized: false };
}

const pool = new Pool(config);

async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text: text.substring(0, 100), duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text: text.substring(0, 100), error: error.message });
    throw error;
  }
}

async function fixExpenseMigration() {
  console.log('🚨 CORRECTION URGENTE - Migration du système de dépenses');
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier la connexion
    console.log('🔍 Vérification de la connexion...');
    const connectionTest = await query('SELECT NOW() as current_time');
    console.log('✅ Connexion établie:', connectionTest.rows[0].current_time);

    // 2. Vérifier si la table expenses existe
    console.log('\n🔍 Vérification de la table expenses...');
    const expensesCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expenses'
      ) as table_exists
    `);

    if (!expensesCheck.rows[0].table_exists) {
      throw new Error('❌ Table expenses non trouvée');
    }
    console.log('✅ Table expenses trouvée');

    // 3. Vérifier si la colonne statut existe
    console.log('\n🔍 Vérification de la colonne statut...');
    const statutCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'expenses' AND column_name = 'statut'
      ) as column_exists
    `);

    if (!statutCheck.rows[0].column_exists) {
      console.log('⚠️  Colonne statut manquante, ajout...');
      await query(`
        ALTER TABLE expenses 
        ADD COLUMN statut VARCHAR(20) DEFAULT 'actif' 
        CHECK (statut IN ('actif', 'termine', 'annule'))
      `);
      console.log('✅ Colonne statut ajoutée');
    } else {
      console.log('✅ Colonne statut existe');
    }

    // 4. Vérifier si la table expense_payments existe
    console.log('\n🔍 Vérification de la table expense_payments...');
    const paymentsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expense_payments'
      ) as table_exists
    `);

    if (!paymentsTableCheck.rows[0].table_exists) {
      console.log('⚠️  Table expense_payments manquante, création...');
      
      // Créer la table expense_payments
      await query(`
        CREATE TABLE expense_payments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          
          -- Informations du paiement
          montant_paye DECIMAL NOT NULL CHECK (montant_paye > 0),
          montant_declare DECIMAL DEFAULT 0 CHECK (montant_declare >= 0),
          montant_non_declare DECIMAL DEFAULT 0 CHECK (montant_non_declare >= 0),
          
          -- Détails du paiement
          date_paiement DATE NOT NULL,
          mode_paiement VARCHAR(20) NOT NULL CHECK (mode_paiement IN ('espece', 'cheque', 'cheque_espece', 'virement')),
          description TEXT,
          reference_paiement VARCHAR(100),
          
          -- Métadonnées
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          
          -- Contrainte : montant_paye = montant_declare + montant_non_declare
          CONSTRAINT check_montant_coherence 
            CHECK (montant_paye = montant_declare + montant_non_declare)
        )
      `);

      // Créer les index
      await query('CREATE INDEX idx_expense_payments_expense_id ON expense_payments(expense_id)');
      await query('CREATE INDEX idx_expense_payments_user_id ON expense_payments(user_id)');
      await query('CREATE INDEX idx_expense_payments_date ON expense_payments(date_paiement)');

      console.log('✅ Table expense_payments créée');
    } else {
      console.log('✅ Table expense_payments existe');
    }

    // 5. Vérifier si la vue expenses_with_totals existe
    console.log('\n🔍 Vérification de la vue expenses_with_totals...');
    const viewCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'expenses_with_totals'
      ) as view_exists
    `);

    if (!viewCheck.rows[0].view_exists) {
      console.log('⚠️  Vue expenses_with_totals manquante, création...');
      
      await query(`
        CREATE OR REPLACE VIEW expenses_with_totals AS
        SELECT 
          e.*,
          COALESCE(ep.total_paye, 0) as total_paye_calcule,
          COALESCE(ep.total_declare, 0) as total_declare_calcule,
          COALESCE(ep.total_non_declare, 0) as total_non_declare_calcule,
          COALESCE(ep.nombre_paiements, 0) as nombre_paiements
        FROM expenses e
        LEFT JOIN (
          SELECT 
            expense_id,
            SUM(montant_paye) as total_paye,
            SUM(montant_declare) as total_declare,
            SUM(montant_non_declare) as total_non_declare,
            COUNT(*) as nombre_paiements
          FROM expense_payments
          GROUP BY expense_id
        ) ep ON e.id = ep.expense_id
      `);

      console.log('✅ Vue expenses_with_totals créée');
    } else {
      console.log('✅ Vue expenses_with_totals existe');
    }

    // 6. Créer la fonction de mise à jour des totaux
    console.log('\n🔍 Création de la fonction de mise à jour...');
    await query(`
      CREATE OR REPLACE FUNCTION update_expense_totals()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Mettre à jour les totaux de la dépense concernée
        UPDATE expenses 
        SET 
          montant_total = (
            SELECT COALESCE(SUM(montant_paye), 0) 
            FROM expense_payments 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
          ),
          montant_declare = (
            SELECT COALESCE(SUM(montant_declare), 0) 
            FROM expense_payments 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
          ),
          montant_non_declare = (
            SELECT COALESCE(SUM(montant_non_declare), 0) 
            FROM expense_payments 
            WHERE expense_id = COALESCE(NEW.expense_id, OLD.expense_id)
          ),
          updated_at = NOW()
        WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql
    `);

    // 7. Créer le trigger
    console.log('\n🔍 Création du trigger...');
    await query('DROP TRIGGER IF EXISTS trigger_update_expense_totals ON expense_payments');
    await query(`
      CREATE TRIGGER trigger_update_expense_totals
        AFTER INSERT OR UPDATE OR DELETE ON expense_payments
        FOR EACH ROW
        EXECUTE FUNCTION update_expense_totals()
    `);

    console.log('✅ Trigger créé');

    // 8. Migrer les données existantes
    console.log('\n🔄 Migration des données existantes...');
    const existingExpenses = await query(`
      SELECT id, user_id, montant_total, montant_declare, montant_non_declare, 
             methode_paiement, created_at
      FROM expenses 
      WHERE montant_total > 0 
      AND NOT EXISTS (
        SELECT 1 FROM expense_payments WHERE expense_id = expenses.id
      )
    `);

    console.log(`📊 ${existingExpenses.rows.length} dépenses à migrer`);

    for (const expense of existingExpenses.rows) {
      await query(`
        INSERT INTO expense_payments (
          expense_id, user_id, montant_paye, montant_declare, 
          montant_non_declare, date_paiement, mode_paiement, 
          description, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        expense.id,
        expense.user_id,
        expense.montant_total,
        expense.montant_declare,
        expense.montant_non_declare,
        expense.created_at.toISOString().split('T')[0],
        expense.methode_paiement,
        'Paiement initial (migration automatique)',
        expense.created_at
      ]);
    }

    console.log('✅ Données migrées');

    // 9. Test final
    console.log('\n🧪 Test final...');
    const finalTest = await query('SELECT COUNT(*) as count FROM expenses_with_totals');
    console.log(`✅ Vue accessible, ${finalTest.rows[0].count} dépenses trouvées`);

    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
    console.log('✅ Système de dépenses progressives opérationnel');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter la correction
fixExpenseMigration()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec du script:', error);
    process.exit(1);
  });
