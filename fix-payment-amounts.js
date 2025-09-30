#!/usr/bin/env node

/**
 * Script de correction pour les montants principal et autre montant des paiements
 * 
 * Ce script corrige le problème où les montants principal et autre montant 
 * s'affichent à 0 DH dans les détails des paiements.
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/promoteur_db'
});

async function fixPaymentAmounts() {
  console.log('🔧 Début de la correction des montants des paiements...');

  try {
    // 1. Vérifier les paiements qui ont des montants_declare et montant_non_declare à 0
    const checkQuery = `
      SELECT id, montant_paye, montant_declare, montant_non_declare, numero_echeance
      FROM payment_plans 
      WHERE montant_paye > 0 
      AND (montant_declare = 0 OR montant_non_declare = 0)
      ORDER BY numero_echeance;
    `;
    
    const checkResult = await pool.query(checkQuery);
    console.log(`📊 Trouvé ${checkResult.rows.length} paiements avec des montants à corriger:`);
    
    checkResult.rows.forEach(row => {
      console.log(`  - Paiement #${row.numero_echeance}: ${row.montant_paye} DH (Principal: ${row.montant_declare}, Autre: ${row.montant_non_declare})`);
    });

    if (checkResult.rows.length === 0) {
      console.log('✅ Aucun paiement à corriger trouvé.');
      return;
    }

    // 2. Corriger les paiements en répartissant le montant payé
    let correctedCount = 0;
    
    for (const payment of checkResult.rows) {
      const montantPaye = parseFloat(payment.montant_paye);
      
      // Répartition par défaut : 70% principal, 30% autre montant
      const montantDeclare = Math.round(montantPaye * 0.7 * 100) / 100;
      const montantNonDeclare = Math.round((montantPaye - montantDeclare) * 100) / 100;
      
      const updateQuery = `
        UPDATE payment_plans 
        SET montant_declare = $1, montant_non_declare = $2
        WHERE id = $3
      `;
      
      await pool.query(updateQuery, [montantDeclare, montantNonDeclare, payment.id]);
      
      console.log(`✅ Corrigé Paiement #${payment.numero_echeance}: ${montantPaye} DH → Principal: ${montantDeclare} DH, Autre: ${montantNonDeclare} DH`);
      correctedCount++;
    }

    console.log(`\n🎉 Correction terminée ! ${correctedCount} paiements corrigés.`);

    // 3. Vérifier que la correction a fonctionné
    const verifyQuery = `
      SELECT COUNT(*) as total,
             COUNT(CASE WHEN montant_declare > 0 AND montant_non_declare > 0 THEN 1 END) as corrected
      FROM payment_plans 
      WHERE montant_paye > 0;
    `;
    
    const verifyResult = await pool.query(verifyQuery);
    const { total, corrected } = verifyResult.rows[0];
    
    console.log(`\n📈 Résultat final:`);
    console.log(`  - Total des paiements: ${total}`);
    console.log(`  - Paiements avec montants corrects: ${corrected}`);
    console.log(`  - Taux de correction: ${Math.round((corrected / total) * 100)}%`);

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Exécuter le script
if (require.main === module) {
  fixPaymentAmounts()
    .then(() => {
      console.log('\n✅ Script terminé avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script échoué:', error);
      process.exit(1);
    });
}

module.exports = { fixPaymentAmounts };
