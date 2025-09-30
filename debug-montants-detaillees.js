#!/usr/bin/env node

/**
 * Script de débogage pour analyser pourquoi les montants détaillés affichent 0
 */

import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function debugMontantsDetaillees() {
  console.log('🔍 Débogage des montants détaillés');
  console.log('==================================');

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
    const authToken = loginData.token;
    console.log('✅ Connexion réussie');

    // 2. Récupérer toutes les ventes
    console.log('\n2. 📋 Récupération des ventes...');
    const salesResponse = await fetch(`${API_BASE_URL}/sales`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const sales = await salesResponse.json();
    console.log(`✅ ${sales.length} vente(s) trouvée(s)`);

    if (sales.length === 0) {
      console.log('⚠️ Aucune vente trouvée');
      return;
    }

    // 3. Analyser chaque vente et ses plans de paiement
    for (let i = 0; i < Math.min(sales.length, 3); i++) {
      const sale = sales[i];
      console.log(`\n3.${i + 1} 🔍 Analyse de la vente ${sale.id} (${sale.client_nom})`);
      
      // Récupérer les plans de paiement
      const plansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${sale.id}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (!plansResponse.ok) {
        console.log(`❌ Erreur récupération plans pour vente ${sale.id}`);
        continue;
      }
      
      const plans = await plansResponse.json();
      console.log(`   📊 ${plans.length} plan(s) de paiement trouvé(s)`);
      
      plans.forEach((plan, index) => {
        console.log(`   Plan ${index + 1}:`, {
          id: plan.id,
          numero_echeance: plan.numero_echeance,
          montant_prevu: plan.montant_prevu,
          montant_paye: plan.montant_paye,
          montant_declare: plan.montant_declare,
          montant_non_declare: plan.montant_non_declare,
          mode_paiement: plan.mode_paiement,
          statut: plan.statut
        });
        
        // Vérifier si les montants détaillés sont présents
        if (plan.montant_declare === undefined) {
          console.log(`   ⚠️ montant_declare est undefined`);
        }
        if (plan.montant_non_declare === undefined) {
          console.log(`   ⚠️ montant_non_declare est undefined`);
        }
        if (plan.montant_declare === null) {
          console.log(`   ⚠️ montant_declare est null`);
        }
        if (plan.montant_non_declare === null) {
          console.log(`   ⚠️ montant_non_declare est null`);
        }
      });
    }

    // 4. Tester la création d'un paiement avec montants détaillés
    console.log('\n4. 🧪 Test de création d\'un paiement avec montants détaillés...');
    
    // Récupérer le premier projet
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const projects = await projectsResponse.json();
    
    if (projects.length === 0) {
      console.log('❌ Aucun projet disponible pour le test');
      return;
    }
    
    const projectId = projects[0].id;
    console.log(`📋 Utilisation du projet: ${projects[0].nom}`);
    
    // Créer une vente de test
    const testSaleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'DEBUG-001',
      client_nom: 'Client Debug',
      client_telephone: '0612345678',
      client_email: 'debug@test.com',
      client_adresse: 'Adresse Debug',
      surface: 80,
      prix_total: 100000,
      description: 'Vente de test pour debug',
      premier_paiement: {
        montant: 50000,
        montant_declare: 40000,
        montant_non_declare: 10000,
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'espece',
        notes: 'Paiement de test avec montants détaillés'
      }
    };
    
    console.log('📤 Envoi des données de vente:', JSON.stringify(testSaleData, null, 2));
    
    const createSaleResponse = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(testSaleData)
    });
    
    if (!createSaleResponse.ok) {
      console.error('❌ Erreur création vente:', await createSaleResponse.text());
      return;
    }
    
    const createdSale = await createSaleResponse.json();
    console.log('✅ Vente créée:', createdSale);
    
    // Vérifier immédiatement les plans de paiement
    const debugPlansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${createdSale.data.id}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (debugPlansResponse.ok) {
      const debugPlans = await debugPlansResponse.json();
      console.log('🔍 Plans de paiement après création:', debugPlans);
      
      if (debugPlans.length > 0) {
        const firstPlan = debugPlans[0];
        console.log('📊 Premier plan détaillé:', {
          montant_paye: firstPlan.montant_paye,
          montant_declare: firstPlan.montant_declare,
          montant_non_declare: firstPlan.montant_non_declare,
          type_montant_declare: typeof firstPlan.montant_declare,
          type_montant_non_declare: typeof firstPlan.montant_non_declare
        });
      }
    }
    
    // Nettoyage
    console.log('\n5. 🗑️ Nettoyage...');
    await fetch(`${API_BASE_URL}/sales/${createdSale.data.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    console.log('✅ Vente de test supprimée');

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error.message);
  }
}

debugMontantsDetaillees();
