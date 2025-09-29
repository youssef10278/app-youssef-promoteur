#!/usr/bin/env node

/**
 * Script de test pour vérifier la modification des paiements
 * Ce script teste l'endpoint PUT /api/payments/plans/:id
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour tester la modification d'un paiement
async function testPaymentModification() {
  console.log('🧪 Test de modification des paiements');
  console.log('=====================================');

  try {
    // 1. Se connecter pour obtenir un token
    console.log('\n1. 🔐 Connexion...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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
    const token = loginData.data.token;
    console.log('✅ Connexion réussie');

    // 2. Récupérer les projets pour trouver une vente
    console.log('\n2. 📋 Récupération des projets...');
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!projectsResponse.ok) {
      console.error('❌ Erreur lors de la récupération des projets:', await projectsResponse.text());
      return;
    }

    const projectsData = await projectsResponse.json();
    const projects = projectsData.data;
    console.log(`✅ ${projects.length} projets trouvés`);

    if (projects.length === 0) {
      console.log('⚠️ Aucun projet trouvé, impossible de tester');
      return;
    }

    const projectId = projects[0].id;
    console.log(`📁 Utilisation du projet: ${projects[0].nom} (${projectId})`);

    // 3. Récupérer les ventes du projet
    console.log('\n3. 🏠 Récupération des ventes...');
    const salesResponse = await fetch(`${API_BASE_URL}/sales/project/${projectId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!salesResponse.ok) {
      console.error('❌ Erreur lors de la récupération des ventes:', await salesResponse.text());
      return;
    }

    const salesData = await salesResponse.json();
    const sales = salesData.data;
    console.log(`✅ ${sales.length} ventes trouvées`);

    if (sales.length === 0) {
      console.log('⚠️ Aucune vente trouvée, impossible de tester');
      return;
    }

    const saleId = sales[0].id;
    console.log(`🏠 Utilisation de la vente: ${sales[0].client_nom} - ${sales[0].unite_numero} (${saleId})`);

    // 4. Récupérer les plans de paiement de la vente
    console.log('\n4. 💰 Récupération des plans de paiement...');
    const paymentPlansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${saleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!paymentPlansResponse.ok) {
      console.error('❌ Erreur lors de la récupération des plans de paiement:', await paymentPlansResponse.text());
      return;
    }

    const paymentPlansData = await paymentPlansResponse.json();
    const paymentPlans = paymentPlansData.data;
    console.log(`✅ ${paymentPlans.length} plans de paiement trouvés`);

    if (paymentPlans.length === 0) {
      console.log('⚠️ Aucun plan de paiement trouvé, impossible de tester');
      return;
    }

    const paymentPlan = paymentPlans[0];
    console.log(`💰 Utilisation du plan: #${paymentPlan.numero_echeance} - ${paymentPlan.montant_paye || 0} DH (${paymentPlan.id})`);

    // 5. Tester la modification du paiement
    console.log('\n5. ✏️ Test de modification du paiement...');
    
    const originalAmount = paymentPlan.montant_paye || 0;
    const newAmount = originalAmount + 100; // Ajouter 100 DH pour le test
    
    const updateData = {
      montant_paye: newAmount,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'cheque',
      montant_espece: 0,
      montant_cheque: newAmount,
      notes: `Test de modification - ${new Date().toLocaleString()}`
    };

    console.log('📤 Données de modification:', updateData);

    const updateResponse = await fetch(`${API_BASE_URL}/payments/plans/${paymentPlan.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(updateData)
    });

    console.log('📊 Statut de la réponse:', updateResponse.status);

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('❌ Erreur lors de la modification:', errorText);
      return;
    }

    const updateResult = await updateResponse.json();
    console.log('✅ Modification réussie!');
    console.log('📊 Résultat:', updateResult.data);

    // 6. Vérifier que la modification a bien été appliquée
    console.log('\n6. 🔍 Vérification de la modification...');
    
    const verifyResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${saleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!verifyResponse.ok) {
      console.error('❌ Erreur lors de la vérification:', await verifyResponse.text());
      return;
    }

    const verifyData = await verifyResponse.json();
    const updatedPlans = verifyData.data;
    const updatedPlan = updatedPlans.find(p => p.id === paymentPlan.id);

    if (updatedPlan) {
      console.log('✅ Plan trouvé après modification');
      console.log(`💰 Montant original: ${originalAmount} DH`);
      console.log(`💰 Montant modifié: ${updatedPlan.montant_paye} DH`);
      console.log(`📅 Date: ${updatedPlan.date_paiement}`);
      console.log(`💳 Mode: ${updatedPlan.mode_paiement}`);
      console.log(`📝 Notes: ${updatedPlan.notes}`);

      if (updatedPlan.montant_paye === newAmount) {
        console.log('🎉 SUCCÈS: La modification a été correctement appliquée!');
      } else {
        console.log('❌ ÉCHEC: Le montant n\'a pas été mis à jour correctement');
      }
    } else {
      console.log('❌ ÉCHEC: Le plan modifié n\'a pas été trouvé');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testPaymentModification().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
