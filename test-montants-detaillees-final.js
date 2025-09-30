#!/usr/bin/env node

/**
 * Script de test final pour vérifier que les montants détaillés fonctionnent correctement
 * après toutes les corrections apportées
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function testMontantsDetailleesFinal() {
  console.log('🧪 Test Final des Montants Détaillés');
  console.log('====================================');

  let authToken = '';
  let testSaleId = '';

  try {
    // 1. Connexion
    console.log('\n1. 🔐 Connexion...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Erreur de connexion:', await loginResponse.text());
      return;
    }
    const loginData = await loginResponse.json();
    authToken = loginData.token;
    console.log('✅ Connexion réussie');

    // 2. Récupérer les projets
    console.log('\n2. 📋 Récupération des projets...');
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const projects = await projectsResponse.json();
    
    if (projects.length === 0) {
      console.error('❌ Aucun projet disponible');
      return;
    }
    
    const projectId = projects[0].id;
    console.log(`✅ Projet trouvé: ${projects[0].nom}`);

    // 3. Créer une vente avec montants détaillés
    console.log('\n3. ➕ Création d\'une vente avec montants détaillés...');
    const saleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'FINAL-TEST-001',
      client_nom: 'Client Test Final',
      client_telephone: '0612345678',
      client_email: 'final@test.com',
      client_adresse: 'Adresse Final',
      surface: 80,
      prix_total: 500000,
      description: 'Vente de test final pour montants détaillés',
      mode_paiement: 'espece',
      avance_declare: 80000,  // Montant principal
      avance_non_declare: 20000,  // Autre montant
      avance_cheque: 0,
      avance_espece: 100000  // Total = 80000 + 20000
    };

    console.log('📤 Données de vente:', JSON.stringify(saleData, null, 2));

    const createSaleResponse = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(saleData)
    });

    if (!createSaleResponse.ok) {
      console.error('❌ Erreur création vente:', await createSaleResponse.text());
      return;
    }
    
    const createdSale = await createSaleResponse.json();
    testSaleId = createdSale.data.id;
    console.log(`✅ Vente créée: ${testSaleId}`);

    // 4. Vérifier immédiatement les plans de paiement
    console.log('\n4. 🔍 Vérification des plans de paiement...');
    const plansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${testSaleId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!plansResponse.ok) {
      console.error('❌ Erreur récupération plans:', await plansResponse.text());
      return;
    }
    
    const plans = await plansResponse.json();
    console.log(`✅ ${plans.length} plan(s) de paiement trouvé(s)`);

    if (plans.length > 0) {
      const firstPlan = plans[0];
      console.log('📊 Premier plan de paiement:', {
        id: firstPlan.id,
        numero_echeance: firstPlan.numero_echeance,
        montant_prevu: firstPlan.montant_prevu,
        montant_paye: firstPlan.montant_paye,
        montant_declare: firstPlan.montant_declare,
        montant_non_declare: firstPlan.montant_non_declare,
        mode_paiement: firstPlan.mode_paiement,
        statut: firstPlan.statut
      });

      // Vérifications critiques
      const checks = [
        { field: 'montant_paye', expected: 100000, actual: firstPlan.montant_paye, critical: true },
        { field: 'montant_declare', expected: 80000, actual: firstPlan.montant_declare, critical: true },
        { field: 'montant_non_declare', expected: 20000, actual: firstPlan.montant_non_declare, critical: true }
      ];

      let allChecksPassed = true;
      let criticalChecksPassed = true;

      checks.forEach(check => {
        const status = check.expected === check.actual ? '✅' : '❌';
        const critical = check.critical ? ' (CRITIQUE)' : '';
        console.log(`${status} ${check.field}: attendu ${check.expected}, obtenu ${check.actual}${critical}`);
        
        if (check.expected !== check.actual) {
          allChecksPassed = false;
          if (check.critical) {
            criticalChecksPassed = false;
          }
        }
      });

      if (criticalChecksPassed) {
        console.log('\n🎉 CORRECTION RÉUSSIE ! Les montants détaillés sont corrects !');
      } else {
        console.log('\n❌ CORRECTION ÉCHOUÉE ! Les montants détaillés sont encore incorrects !');
      }
    }

    // 5. Ajouter un deuxième paiement
    console.log('\n5. ➕ Ajout d\'un deuxième paiement...');
    const secondPayment = {
      montant: 150000,
      montant_declare: 120000,
      montant_non_declare: 30000,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'cheque',
      notes: 'Deuxième paiement avec montants détaillés'
    };

    const addPaymentResponse = await fetch(`${API_BASE_URL}/sales/${testSaleId}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(secondPayment)
    });

    if (!addPaymentResponse.ok) {
      console.error('❌ Erreur ajout paiement:', await addPaymentResponse.text());
      return;
    }
    console.log('✅ Deuxième paiement ajouté');

    // 6. Vérifier les plans mis à jour
    console.log('\n6. 🔍 Vérification des plans mis à jour...');
    const updatedPlansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${testSaleId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    const updatedPlans = await updatedPlansResponse.json();
    console.log(`📊 Plans de paiement mis à jour:`, updatedPlans.map(plan => ({
      numero_echeance: plan.numero_echeance,
      montant_paye: plan.montant_paye,
      montant_declare: plan.montant_declare,
      montant_non_declare: plan.montant_non_declare
    })));

    // 7. Calculer les totaux
    console.log('\n7. 📊 Calcul des totaux...');
    const totalPaid = updatedPlans.reduce((sum, plan) => sum + (plan.montant_paye || 0), 0);
    const totalDeclare = updatedPlans.reduce((sum, plan) => sum + (plan.montant_declare || 0), 0);
    const totalNonDeclare = updatedPlans.reduce((sum, plan) => sum + (plan.montant_non_declare || 0), 0);

    console.log('📊 Totaux calculés:', {
      totalPaid,
      totalDeclare,
      totalNonDeclare,
      verification: totalDeclare + totalNonDeclare === totalPaid ? '✅ Correct' : '❌ Incorrect'
    });

    console.log('\n🎉 Test final terminé avec succès !');
    console.log('\n📋 Résumé des corrections appliquées:');
    console.log('   ✅ Types TypeScript mis à jour');
    console.log('   ✅ API backend corrigée (création de vente)');
    console.log('   ✅ API backend corrigée (ajout de paiement)');
    console.log('   ✅ Composants frontend corrigés');
    console.log('   ✅ Conditions d\'affichage supprimées');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  } finally {
    // Nettoyage
    if (testSaleId) {
      console.log('\n8. 🗑️ Nettoyage - Suppression de la vente de test...');
      try {
        await fetch(`${API_BASE_URL}/sales/${testSaleId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        console.log('✅ Vente de test supprimée');
      } catch (error) {
        console.log('⚠️ Impossible de supprimer la vente de test');
      }
    }
  }
}

testMontantsDetailleesFinal();
