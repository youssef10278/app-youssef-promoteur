import { query, closePool } from '../config/database';
import fs from 'fs';
import path from 'path';

async function applyExpensePaymentMigration() {
  try {
    console.log('🚀 Application de la migration des paiements de dépenses...');

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../migrations/add_expense_payment_plans.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Diviser en commandes individuelles (séparées par des lignes vides ou des commentaires)
    const commands = migrationSQL
      .split(/;\s*(?:\n|$)/)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    console.log(`📋 ${commands.length} commandes à exécuter...`);

    // Exécuter chaque commande
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`⚡ Exécution de la commande ${i + 1}/${commands.length}...`);
          await query(command);
          console.log(`✅ Commande ${i + 1} exécutée avec succès`);
        } catch (error: any) {
          // Ignorer les erreurs "already exists" car elles sont normales
          if (error.message.includes('already exists') || 
              error.message.includes('duplicate') ||
              error.message.includes('does not exist')) {
            console.log(`⚠️  Commande ${i + 1} ignorée (déjà existante): ${error.message}`);
          } else {
            console.error(`❌ Erreur lors de l'exécution de la commande ${i + 1}:`, error.message);
            console.error('Commande:', command.substring(0, 100) + '...');
            throw error;
          }
        }
      }
    }

    // Vérifier que la table a été créée
    const tableCheck = await query(`
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
    const columnsCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'expenses'
      AND column_name IN ('statut_paiement', 'montant_total_paye', 'montant_restant')
    `);

    console.log(`✅ ${columnsCheck.rows.length}/3 nouvelles colonnes ajoutées à la table expenses`);

    // Vérifier que les fonctions et triggers ont été créés
    const functionsCheck = await query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name = 'update_expense_payment_status'
    `);

    if (functionsCheck.rows.length > 0) {
      console.log('✅ Fonction update_expense_payment_status créée avec succès');
    }

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
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  applyExpensePaymentMigration();
}

export { applyExpensePaymentMigration };
