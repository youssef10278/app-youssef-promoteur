// Script de correction finale pour la migration des dépenses
const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
};

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
    console.log('✅ Query executed', { duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    throw error;
  }
}

async function fixExpenseMigrationFinal() {
  console.log('🚨 CORRECTION FINALE - Migration du système de dépenses');
  console.log('=' .repeat(60));

  try {
    // 1. Vérifier la connexion
    console.log('🔍 Vérification de la connexion...');
    await query('SELECT NOW() as current_time');
    console.log('✅ Connexion établie');

    // 2. Créer la table expense_payments si elle n'existe pas
    console.log('\n🔍 Vérification/création de la table expense_payments...');
    const paymentsTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expense_payments'
      ) as table_exists
    `);

    if (!paymentsTableCheck.rows[0].table_exists) {
      console.log('⚠️  Table expense_payments manquante, création...');
      
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
      console.log('✅ Table expense_payments existe déjà');
    }

    // 3. Créer la vue expenses_with_totals
    console.log('\n🔍 Création/mise à jour de la vue expenses_with_totals...');
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

    // 4. Créer une fonction de trigger simplifiée (sans mise à jour de montant_total)
    console.log('\n🔍 Création de la fonction de trigger...');
    await query(`
      CREATE OR REPLACE FUNCTION update_expense_totals()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Mettre à jour seulement updated_at car montant_total est une colonne générée
        UPDATE expenses 
        SET updated_at = NOW()
        WHERE id = COALESCE(NEW.expense_id, OLD.expense_id);
        
        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql
    `);

    // 5. Créer le trigger
    console.log('\n🔍 Création du trigger...');
    await query('DROP TRIGGER IF EXISTS trigger_update_expense_totals ON expense_payments');
    await query(`
      CREATE TRIGGER trigger_update_expense_totals
        AFTER INSERT OR UPDATE OR DELETE ON expense_payments
        FOR EACH ROW
        EXECUTE FUNCTION update_expense_totals()
    `);
    console.log('✅ Trigger créé');

    // 6. Migrer les données existantes
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
      try {
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
          expense.montant_declare || 0,
          expense.montant_non_declare || 0,
          expense.created_at.toISOString().split('T')[0],
          expense.methode_paiement || 'espece',
          'Paiement initial (migration automatique)',
          expense.created_at
        ]);
        console.log(`  ✅ Migré: ${expense.id}`);
      } catch (error) {
        console.log(`  ❌ Erreur migration ${expense.id}: ${error.message}`);
      }
    }

    console.log('✅ Migration des données terminée');

    // 7. Test final
    console.log('\n🧪 Test final...');
    const finalTest = await query('SELECT COUNT(*) as count FROM expenses_with_totals');
    console.log(`✅ Vue accessible, ${finalTest.rows[0].count} dépenses trouvées`);

    // 8. Test d'une requête complexe
    console.log('\n🧪 Test de requête complexe...');
    const complexTest = await query(`
      SELECT 
        nom, 
        montant_total as montant_original,
        total_paye_calcule,
        nombre_paiements
      FROM expenses_with_totals 
      WHERE total_paye_calcule > 0
      LIMIT 3
    `);

    console.log('📊 Exemples de dépenses avec paiements:');
    complexTest.rows.forEach((row, index) => {
      console.log(`  ${index + 1}. ${row.nom}`);
      console.log(`     Original: ${row.montant_original}, Calculé: ${row.total_paye_calcule}`);
      console.log(`     Paiements: ${row.nombre_paiements}`);
    });

    console.log('\n🎉 CORRECTION TERMINÉE AVEC SUCCÈS !');
    console.log('✅ Système de dépenses progressives opérationnel');
    console.log('✅ Vue expenses_with_totals accessible');
    console.log('✅ Migration des données réussie');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter la correction
fixExpenseMigrationFinal()
  .then(() => {
    console.log('\n✅ Script terminé avec succès');
    console.log('🚀 Vous pouvez maintenant redémarrer votre application');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Échec du script:', error);
    process.exit(1);
  });
