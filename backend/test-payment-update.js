/**
 * Script de test pour vérifier que la modification des paiements fonctionne
 * 
 * Ce script teste directement la base de données pour confirmer que:
 * 1. Les colonnes montant_declare et montant_non_declare existent
 * 2. On peut faire un UPDATE avec ces colonnes
 * 3. Les données persistent correctement
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'promoteur_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function testPaymentUpdate() {
  console.log('\n🧪 TEST DE MODIFICATION DES PAIEMENTS\n');
  console.log('='.repeat(60));
  console.log('');

  try {
    // 1. Vérifier la connexion
    console.log('📡 Connexion à la base de données...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connexion établie\n');

    // 2. Vérifier que les colonnes existent
    console.log('🔍 Vérification des colonnes...');
    const columnsCheck = await pool.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'payment_plans' 
      AND column_name IN ('montant_declare', 'montant_non_declare')
      ORDER BY column_name
    `);

    if (columnsCheck.rows.length === 2) {
      console.log('✅ Les colonnes existent:');
      columnsCheck.rows.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (default: ${col.column_default})`);
      });
      console.log('');
    } else {
      console.log('❌ Les colonnes sont manquantes!');
      console.log('   Exécutez: npm run migrate:declared-amounts\n');
      process.exit(1);
    }

    // 3. Récupérer un payment_plan existant pour le test
    console.log('🔍 Recherche d\'un paiement à tester...');
    const existingPlan = await pool.query(`
      SELECT id, montant_paye, montant_declare, montant_non_declare, mode_paiement
      FROM payment_plans
      LIMIT 1
    `);

    if (existingPlan.rows.length === 0) {
      console.log('⚠️  Aucun paiement trouvé dans la base de données');
      console.log('   Créez d\'abord une vente avec des paiements\n');
      process.exit(0);
    }

    const plan = existingPlan.rows[0];
    console.log('✅ Paiement trouvé:');
    console.log(`   ID: ${plan.id}`);
    console.log(`   Montant payé: ${plan.montant_paye}`);
    console.log(`   Montant déclaré: ${plan.montant_declare}`);
    console.log(`   Montant non déclaré: ${plan.montant_non_declare}`);
    console.log(`   Mode de paiement: ${plan.mode_paiement}`);
    console.log('');

    // 4. Tester une modification
    console.log('🔧 Test de modification...');
    const newMontantPaye = 9999.99;
    const newMontantDeclare = 6999.99;
    const newMontantNonDeclare = 3000.00;

    const updateResult = await pool.query(`
      UPDATE payment_plans
      SET montant_paye = $1,
          montant_declare = $2,
          montant_non_declare = $3,
          updated_at = NOW()
      WHERE id = $4
      RETURNING id, montant_paye, montant_declare, montant_non_declare
    `, [newMontantPaye, newMontantDeclare, newMontantNonDeclare, plan.id]);

    if (updateResult.rowCount === 1) {
      console.log('✅ Modification réussie!');
      const updated = updateResult.rows[0];
      console.log(`   Montant payé: ${plan.montant_paye} → ${updated.montant_paye}`);
      console.log(`   Montant déclaré: ${plan.montant_declare} → ${updated.montant_declare}`);
      console.log(`   Montant non déclaré: ${plan.montant_non_declare} → ${updated.montant_non_declare}`);
      console.log('');
    } else {
      console.log('❌ Aucune ligne modifiée!');
      process.exit(1);
    }

    // 5. Vérifier que les données persistent
    console.log('🔍 Vérification de la persistance...');
    const verifyResult = await pool.query(`
      SELECT montant_paye, montant_declare, montant_non_declare
      FROM payment_plans
      WHERE id = $1
    `, [plan.id]);

    const verified = verifyResult.rows[0];
    if (
      parseFloat(verified.montant_paye) === newMontantPaye &&
      parseFloat(verified.montant_declare) === newMontantDeclare &&
      parseFloat(verified.montant_non_declare) === newMontantNonDeclare
    ) {
      console.log('✅ Les données persistent correctement!');
      console.log('');
    } else {
      console.log('❌ Les données ne persistent pas!');
      console.log(`   Attendu: ${newMontantPaye}, ${newMontantDeclare}, ${newMontantNonDeclare}`);
      console.log(`   Obtenu: ${verified.montant_paye}, ${verified.montant_declare}, ${verified.montant_non_declare}`);
      console.log('');
      process.exit(1);
    }

    // 6. Restaurer les valeurs originales
    console.log('🔄 Restauration des valeurs originales...');
    await pool.query(`
      UPDATE payment_plans
      SET montant_paye = $1,
          montant_declare = $2,
          montant_non_declare = $3,
          updated_at = NOW()
      WHERE id = $4
    `, [plan.montant_paye, plan.montant_declare, plan.montant_non_declare, plan.id]);
    console.log('✅ Valeurs restaurées\n');

    // 7. Résumé
    console.log('='.repeat(60));
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS!\n');
    console.log('✅ Les colonnes montant_declare et montant_non_declare existent');
    console.log('✅ Les modifications fonctionnent correctement');
    console.log('✅ Les données persistent dans la base de données');
    console.log('');
    console.log('🚀 Vous pouvez maintenant utiliser la modification des paiements');
    console.log('   dans l\'application sans problème!\n');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST:', error.message);
    console.error('\nDétails:', error);
    console.log('');
    process.exit(1);
  } finally {
    await pool.end();
    console.log('👋 Connexion fermée\n');
  }
}

// Exécuter le test
testPaymentUpdate()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });

