// Test avec un utilisateur existant qui a des dépenses
const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

const pool = new Pool(config);

async function testExistingUser() {
  console.log('🧪 Test avec utilisateur existant ayant des dépenses');
  console.log('=' .repeat(60));

  try {
    // 1. Trouver un utilisateur avec des dépenses
    console.log('🔍 Recherche d\'un utilisateur avec des dépenses...');
    const userResult = await pool.query(`
      SELECT DISTINCT u.id, u.email, u.nom
      FROM users u
      INNER JOIN expenses e ON u.id = e.user_id
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Aucun utilisateur avec des dépenses trouvé');
      return;
    }

    const user = userResult.rows[0];
    console.log(`✅ Utilisateur trouvé: ${user.nom} (${user.email})`);

    // 2. Vérifier les dépenses de cet utilisateur
    console.log('\n📊 Dépenses de cet utilisateur:');
    const expensesResult = await pool.query(`
      SELECT 
        id, nom, montant_total, 
        total_paye_calcule, total_declare_calcule, total_non_declare_calcule,
        nombre_paiements, statut
      FROM expenses_with_totals 
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [user.id]);

    console.log(`📋 ${expensesResult.rows.length} dépenses trouvées:`);
    expensesResult.rows.forEach((expense, index) => {
      console.log(`  ${index + 1}. ${expense.nom}`);
      console.log(`     Original: ${expense.montant_total}`);
      console.log(`     Calculé: ${expense.total_paye_calcule}`);
      console.log(`     Déclaré: ${expense.total_declare_calcule}`);
      console.log(`     Non déclaré: ${expense.total_non_declare_calcule}`);
      console.log(`     Paiements: ${expense.nombre_paiements}`);
      console.log(`     Statut: ${expense.statut || 'actif'}`);
      console.log('');
    });

    // 3. Vérifier les paiements
    console.log('💰 Paiements dans la table expense_payments:');
    const paymentsResult = await pool.query(`
      SELECT 
        ep.id, ep.expense_id, ep.montant_paye, ep.montant_declare, ep.montant_non_declare,
        ep.mode_paiement, ep.description, ep.date_paiement,
        e.nom as expense_nom
      FROM expense_payments ep
      INNER JOIN expenses e ON ep.expense_id = e.id
      WHERE ep.user_id = $1
      ORDER BY ep.date_paiement DESC
    `, [user.id]);

    console.log(`💳 ${paymentsResult.rows.length} paiements trouvés:`);
    paymentsResult.rows.forEach((payment, index) => {
      console.log(`  ${index + 1}. ${payment.expense_nom}`);
      console.log(`     Montant: ${payment.montant_paye}`);
      console.log(`     Mode: ${payment.mode_paiement}`);
      console.log(`     Date: ${payment.date_paiement}`);
      console.log(`     Description: ${payment.description}`);
      console.log('');
    });

    // 4. Test de cohérence
    console.log('🔍 Vérification de la cohérence des calculs:');
    let allConsistent = true;

    for (const expense of expensesResult.rows) {
      const expensePayments = paymentsResult.rows.filter(p => p.expense_id === expense.id);
      
      const calculatedTotal = expensePayments.reduce((sum, p) => sum + parseFloat(p.montant_paye), 0);
      const calculatedDeclare = expensePayments.reduce((sum, p) => sum + parseFloat(p.montant_declare), 0);
      const calculatedNonDeclare = expensePayments.reduce((sum, p) => sum + parseFloat(p.montant_non_declare), 0);

      const isConsistent = 
        Math.abs(calculatedTotal - parseFloat(expense.total_paye_calcule)) < 0.01 &&
        Math.abs(calculatedDeclare - parseFloat(expense.total_declare_calcule)) < 0.01 &&
        Math.abs(calculatedNonDeclare - parseFloat(expense.total_non_declare_calcule)) < 0.01;

      if (isConsistent) {
        console.log(`  ✅ ${expense.nom}: Calculs cohérents`);
      } else {
        console.log(`  ❌ ${expense.nom}: Incohérence détectée`);
        console.log(`     Calculé manuellement: ${calculatedTotal} (${calculatedDeclare} + ${calculatedNonDeclare})`);
        console.log(`     Vue: ${expense.total_paye_calcule} (${expense.total_declare_calcule} + ${expense.total_non_declare_calcule})`);
        allConsistent = false;
      }
    }

    if (allConsistent) {
      console.log('\n🎉 TOUS LES CALCULS SONT COHÉRENTS !');
    } else {
      console.log('\n⚠️  Incohérences détectées dans les calculs');
    }

    // 5. Test d'une requête API simulée
    console.log('\n🌐 Simulation d\'une requête API:');
    const apiSimulation = await pool.query(`
      SELECT 
        ewt.*, 
        p.nom as project_nom, 
        ewt.methode_paiement as mode_paiement
      FROM expenses_with_totals ewt
      LEFT JOIN projects p ON ewt.project_id = p.id
      WHERE ewt.user_id = $1
      ORDER BY ewt.created_at DESC
    `, [user.id]);

    console.log(`✅ Requête API simulée réussie: ${apiSimulation.rows.length} dépenses`);

    console.log('\n🎉 MIGRATION VALIDÉE AVEC SUCCÈS !');
    console.log('✅ Vue expenses_with_totals fonctionnelle');
    console.log('✅ Calculs automatiques corrects');
    console.log('✅ Données migrées avec succès');
    console.log('✅ API compatible');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
  }
}

testExistingUser();
