#!/usr/bin/env node

/**
 * Script de test pour vérifier la correction des montants des paiements
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/promoteur_db'
});

async function testPaymentAmounts() {
  console.log('🧪 Test de la correction des montants des paiements...');

  try {
    // 1. Vérifier les paiements avec des montants détaillés
    const testQuery = `
      SELECT 
        pp.id,
        pp.numero_echeance,
        pp.montant_paye,
        pp.montant_declare,
        pp.montant_non_declare,
        s.client_nom,
        s.unite_numero
      FROM payment_plans pp
      JOIN sales s ON pp.sale_id = s.id
      WHERE pp.montant_paye > 0
      ORDER BY pp.numero_echeance
      LIMIT 10;
    `;
    
    const result = await pool.query(testQuery);
    
    console.log(`\n📊 Résultats du test (${result.rows.length} paiements):`);
    console.log('=' .repeat(80));
    
    result.rows.forEach((row, index) => {
      const montantPaye = parseFloat(row.montant_paye);
      const montantDeclare = parseFloat(row.montant_declare || 0);
      const montantNonDeclare = parseFloat(row.montant_non_declare || 0);
      
      // Calculer la répartition automatique si nécessaire
      let calculatedDeclare = montantDeclare;
      let calculatedNonDeclare = montantNonDeclare;
      
      if (montantDeclare === 0 && montantNonDeclare === 0 && montantPaye > 0) {
        calculatedDeclare = Math.round(montantPaye * 0.7 * 100) / 100;
        calculatedNonDeclare = Math.round((montantPaye - calculatedDeclare) * 100) / 100;
      }
      
      const status = (montantDeclare > 0 || montantNonDeclare > 0) ? '✅ OK' : '⚠️  Calculé';
      
      console.log(`${index + 1}. Paiement #${row.numero_echeance} - ${row.client_nom} (${row.unite_numero})`);
      console.log(`   Montant total: ${montantPaye} DH`);
      console.log(`   Principal: ${montantDeclare} DH → ${calculatedDeclare} DH ${status}`);
      console.log(`   Autre: ${montantNonDeclare} DH → ${calculatedNonDeclare} DH ${status}`);
      console.log(`   Somme: ${(montantDeclare + montantNonDeclare)} DH → ${(calculatedDeclare + calculatedNonDeclare)} DH`);
      console.log('');
    });

    // 2. Statistiques globales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN montant_declare > 0 AND montant_non_declare > 0 THEN 1 END) as with_details,
        COUNT(CASE WHEN montant_declare = 0 AND montant_non_declare = 0 AND montant_paye > 0 THEN 1 END) as without_details,
        SUM(montant_paye) as total_amount
      FROM payment_plans 
      WHERE montant_paye > 0;
    `;
    
    const statsResult = await pool.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('📈 Statistiques globales:');
    console.log('=' .repeat(40));
    console.log(`Total des paiements: ${stats.total_payments}`);
    console.log(`Avec montants détaillés: ${stats.with_details}`);
    console.log(`Sans montants détaillés: ${stats.without_details}`);
    console.log(`Montant total: ${parseFloat(stats.total_amount).toLocaleString()} DH`);
    console.log(`Taux de complétude: ${Math.round((stats.with_details / stats.total_payments) * 100)}%`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter le test
if (require.main === module) {
  testPaymentAmounts()
    .then(() => {
      console.log('\n✅ Test terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test échoué:', error);
      process.exit(1);
    });
}

module.exports = { testPaymentAmounts };
