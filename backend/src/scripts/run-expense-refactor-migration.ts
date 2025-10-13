import { query, closePool } from '../config/database';
import fs from 'fs';
import path from 'path';

/**
 * Script pour exécuter la migration de refactorisation du système de dépenses
 * Compatible avec Railway et environnements locaux
 */

const runExpenseRefactorMigration = async () => {
  console.log('🚀 Début de la migration de refactorisation des dépenses...');
  console.log('📍 Environnement:', process.env.NODE_ENV || 'development');
  
  try {
    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, '../migrations/refactor_expense_payments.sql');
    
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Fichier de migration non trouvé: ${migrationPath}`);
    }
    
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('📄 Fichier de migration chargé');
    
    // Vérifier la connexion à la base de données
    console.log('🔍 Vérification de la connexion à la base de données...');
    const connectionTest = await query('SELECT NOW() as current_time');
    console.log('✅ Connexion à la base de données établie:', connectionTest.rows[0].current_time);
    
    // Vérifier l'état actuel de la base de données
    console.log('🔍 Vérification de l\'état actuel des tables...');
    
    // Vérifier si la table expenses existe
    const expensesTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expenses'
      ) as table_exists
    `);
    
    if (!expensesTableCheck.rows[0].table_exists) {
      throw new Error('❌ Table expenses non trouvée. Veuillez d\'abord exécuter la migration principale.');
    }
    
    console.log('✅ Table expenses trouvée');
    
    // Vérifier si la migration a déjà été exécutée
    const expensePaymentsCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expense_payments'
      ) as table_exists
    `);
    
    if (expensePaymentsCheck.rows[0].table_exists) {
      console.log('⚠️  La table expense_payments existe déjà. Vérification de la structure...');
      
      // Vérifier si des données existent déjà
      const dataCheck = await query('SELECT COUNT(*) as count FROM expense_payments');
      console.log(`📊 Nombre de paiements existants: ${dataCheck.rows[0].count}`);
    }
    
    // Compter les dépenses existantes
    const expensesCount = await query('SELECT COUNT(*) as count FROM expenses');
    console.log(`📊 Nombre de dépenses existantes: ${expensesCount.rows[0].count}`);
    
    // Exécuter la migration
    console.log('🔄 Exécution de la migration...');
    await query(migrationSQL);
    
    // Vérifier le résultat de la migration
    console.log('🔍 Vérification post-migration...');
    
    // Vérifier la nouvelle table
    const newTableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'expense_payments'
      ) as table_exists
    `);
    
    if (!newTableCheck.rows[0].table_exists) {
      throw new Error('❌ Échec de la création de la table expense_payments');
    }
    
    // Vérifier la vue
    const viewCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_name = 'expenses_with_totals'
      ) as view_exists
    `);
    
    if (!viewCheck.rows[0].view_exists) {
      throw new Error('❌ Échec de la création de la vue expenses_with_totals');
    }
    
    // Vérifier les données migrées
    const migratedPaymentsCount = await query('SELECT COUNT(*) as count FROM expense_payments');
    console.log(`📊 Nombre de paiements après migration: ${migratedPaymentsCount.rows[0].count}`);
    
    // Tester la vue
    const viewTest = await query(`
      SELECT COUNT(*) as count 
      FROM expenses_with_totals 
      WHERE total_paye_calcule > 0
    `);
    console.log(`📊 Dépenses avec paiements calculés: ${viewTest.rows[0].count}`);
    
    // Vérifier les triggers
    const triggerCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.triggers 
        WHERE trigger_name = 'trigger_update_expense_totals'
      ) as trigger_exists
    `);
    
    if (!triggerCheck.rows[0].trigger_exists) {
      console.log('⚠️  Trigger de mise à jour automatique non trouvé');
    } else {
      console.log('✅ Trigger de mise à jour automatique créé');
    }
    
    console.log('');
    console.log('🎉 Migration de refactorisation des dépenses terminée avec succès !');
    console.log('');
    console.log('📋 Résumé des modifications :');
    console.log('   ✅ Table expense_payments créée');
    console.log('   ✅ Vue expenses_with_totals créée');
    console.log('   ✅ Triggers de mise à jour automatique installés');
    console.log('   ✅ Données existantes migrées');
    console.log('   ✅ Statut ajouté aux dépenses');
    console.log('');
    console.log('🚀 Le système est maintenant prêt pour :');
    console.log('   - Création de dépenses sans montant initial');
    console.log('   - Ajout progressif de paiements');
    console.log('   - Calcul automatique des totaux');
    console.log('   - Historique complet des paiements');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    
    if (error instanceof Error) {
      console.error('Détails:', error.message);
      if (error.stack) {
        console.error('Stack trace:', error.stack);
      }
    }
    
    process.exit(1);
  } finally {
    // Fermer la connexion à la base de données
    await closePool();
    console.log('🔌 Connexion à la base de données fermée');
  }
};

// Exécuter la migration si ce script est appelé directement
if (require.main === module) {
  runExpenseRefactorMigration()
    .then(() => {
      console.log('✅ Script de migration terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Échec du script de migration:', error);
      process.exit(1);
    });
}

export { runExpenseRefactorMigration };
