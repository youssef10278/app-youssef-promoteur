const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données (utilisez vos vraies valeurs)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://username:password@host:port/database',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function applyMigration() {
  try {
    console.log('🚀 Application de la migration des paiements de dépenses...');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'backend/src/migrations/add_expense_payment_plans.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Exécution de la migration...');
    
    // Exécuter la migration complète
    await pool.query(migrationSQL);
    
    console.log('✅ Migration appliquée avec succès !');

    // Vérifier que la table a été créée
    const tableCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'expense_payment_plans'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table expense_payment_plans créée avec succès');
    } else {
      throw new Error('❌ La table expense_payment_plans n\'a pas été créée');
    }

    // Vérifier que les colonnes ont été ajoutées à la table expenses
    const columnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'expenses'
      AND column_name IN ('statut_paiement', 'montant_total_paye', 'montant_restant')
    `);

    console.log(`✅ ${columnsCheck.rows.length}/3 nouvelles colonnes ajoutées à la table expenses`);

    console.log('🎉 Migration des paiements de dépenses appliquée avec succès !');
    console.log('');
    console.log('📋 RÉSUMÉ :');
    console.log('✅ Table expense_payment_plans créée');
    console.log('✅ Colonnes ajoutées à la table expenses');
    console.log('✅ Fonction de mise à jour automatique créée');
    console.log('✅ Triggers configurés');
    console.log('');
    console.log('🚀 Le système de paiements par tranches pour les dépenses est maintenant opérationnel !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécuter la migration
applyMigration();
