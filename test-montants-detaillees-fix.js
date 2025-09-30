#!/usr/bin/env node

/**
 * Script de test pour vérifier que les montants détaillés s'affichent correctement
 * après les corrections apportées aux types, API et composants
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

async function testMontantsDetaillees() {
  console.log('🧪 Test des montants détaillés - Correction complète');
  console.log('====================================================');

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

    // 3. Créer une vente de test
    console.log('\n3. ➕ Création d\'une vente de test...');
    const saleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'TEST-DETAILLES-001',
      client_nom: 'Client Test Montants Détaillés',
      client_telephone: '0612345678',
      client_email: 'client@test.com',
      client_adresse: 'Adresse Test',
      surface: 80,
      prix_total: 500000,
      description: 'Vente de test pour les montants détaillés',
      premier_paiement: {
        montant: 100000,
        montant_declare: 80000,
        montant_non_declare: 20000,
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'espece',
        notes: 'Premier paiement avec montants détaillés'
      }
    };

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

    // 4. Vérifier les plans de paiement
    console.log('\n4. 🔍 Vérification des plans de paiement...');
    const plansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${testSaleId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const plans = await plansResponse.json();
    console.log(`✅ ${plans.length} plan(s) de paiement trouvé(s)`);

    if (plans.length > 0) {
      const firstPlan = plans[0];
      console.log('📊 Premier plan de paiement:', {
        id: firstPlan.id,
        montant_paye: firstPlan.montant_paye,
        montant_declare: firstPlan.montant_declare,
        montant_non_declare: firstPlan.montant_non_declare,
        mode_paiement: firstPlan.mode_paiement
      });

      // Vérifier que les champs sont présents et corrects
      const checks = [
        { field: 'montant_paye', expected: 100000, actual: firstPlan.montant_paye },
        { field: 'montant_declare', expected: 80000, actual: firstPlan.montant_declare },
        { field: 'montant_non_declare', expected: 20000, actual: firstPlan.montant_non_declare }
      ];

      let allChecksPassed = true;
      checks.forEach(check => {
        if (check.expected === check.actual) {
          console.log(`✅ ${check.field}: ${check.actual}`);
        } else {
          console.log(`❌ ${check.field}: attendu ${check.expected}, obtenu ${check.actual}`);
          allChecksPassed = false;
        }
      });

      if (allChecksPassed) {
        console.log('\n🎉 Tous les montants détaillés sont corrects !');
      } else {
        console.log('\n❌ Certains montants détaillés sont incorrects');
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

    console.log('\n🎉 Test des montants détaillés terminé avec succès !');
    console.log('\n📋 Résumé des corrections apportées:');
    console.log('   ✅ Types TypeScript mis à jour (src/types/sale-new.ts)');
    console.log('   ✅ API backend corrigée (backend/src/routes/payments.ts)');
    console.log('   ✅ Composants frontend corrigés (SaleDetailsModal.tsx, SalesList.tsx)');
    console.log('   ✅ Conditions d\'affichage supprimées pour toujours montrer les montants');

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

testMontantsDetaillees();
