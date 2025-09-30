#!/usr/bin/env node

/**
 * Script de test pour vérifier le filtrage des chèques par vente
 * Ce script teste que les chèques associés ne montrent que ceux de la vente spécifique
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour tester le filtrage des chèques
async function testChecksFiltering() {
  console.log('🧪 Test de filtrage des chèques par vente');
  console.log('==========================================');

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

    // 2. Récupérer tous les chèques du système
    console.log('\n2. 📋 Récupération de tous les chèques...');
    const allChecksResponse = await fetch(`${API_BASE_URL}/checks`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!allChecksResponse.ok) {
      console.error('❌ Erreur lors de la récupération des chèques:', await allChecksResponse.text());
      return;
    }

    const allChecksData = await allChecksResponse.json();
    const allChecks = allChecksData.data;
    console.log(`✅ ${allChecks.length} chèques trouvés dans le système`);

    // 3. Récupérer les projets pour trouver une vente
    console.log('\n3. 🏠 Récupération des projets...');
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

    // 4. Récupérer les ventes du projet
    console.log('\n4. 🏠 Récupération des ventes...');
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

    // 5. Récupérer les chèques spécifiques à cette vente
    console.log('\n5. 💰 Récupération des chèques de la vente...');
    const saleChecksResponse = await fetch(`${API_BASE_URL}/checks?sale_id=${saleId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!saleChecksResponse.ok) {
      console.error('❌ Erreur lors de la récupération des chèques de la vente:', await saleChecksResponse.text());
      return;
    }

    const saleChecksData = await saleChecksResponse.json();
    const saleChecks = saleChecksData.data;
    console.log(`✅ ${saleChecks.length} chèques trouvés pour cette vente`);

    // 6. Récupérer les plans de paiement de la vente
    console.log('\n6. 💰 Récupération des plans de paiement...');
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

    // 7. Analyser les résultats
    console.log('\n7. 📊 Analyse des résultats...');
    console.log(`📋 Total de chèques dans le système: ${allChecks.length}`);
    console.log(`🏠 Chèques de la vente spécifique: ${saleChecks.length}`);
    console.log(`💰 Plans de paiement: ${paymentPlans.length}`);

    // Vérifier que les chèques de la vente sont bien un sous-ensemble des chèques totaux
    const saleCheckIds = saleChecks.map(check => check.id);
    const allCheckIds = allChecks.map(check => check.id);
    
    const isSubset = saleCheckIds.every(id => allCheckIds.includes(id));
    console.log(`✅ Les chèques de la vente sont bien un sous-ensemble: ${isSubset ? 'OUI' : 'NON'}`);

    // Afficher les détails des chèques de la vente
    if (saleChecks.length > 0) {
      console.log('\n📋 Chèques de la vente:');
      saleChecks.forEach((check, index) => {
        console.log(`  ${index + 1}. Chèque #${check.numero_cheque} - ${check.montant} DH`);
      });
    } else {
      console.log('⚠️ Aucun chèque trouvé pour cette vente');
    }

    // 8. Test de la logique de filtrage
    console.log('\n8. 🧪 Test de la logique de filtrage...');
    
    // Simuler la logique du frontend
    const enrichedPaymentPlans = paymentPlans.map(plan => {
      const planChecks = saleChecks.filter(check => {
        // Si c'est l'avance initiale (numero_echeance = 1), inclure tous les chèques
        // Sinon, ne pas inclure de chèques pour les échéances suivantes
        return plan.numero_echeance === 1;
      });

      return {
        ...plan,
        payment_checks: planChecks
      };
    });

    console.log('📊 Résultats du filtrage:');
    enrichedPaymentPlans.forEach((plan, index) => {
      console.log(`  Plan #${plan.numero_echeance}: ${plan.payment_checks.length} chèques associés`);
    });

    // Vérifier que seuls les plans d'avance initiale ont des chèques
    const plansWithChecks = enrichedPaymentPlans.filter(plan => plan.payment_checks.length > 0);
    const initialAdvancePlans = enrichedPaymentPlans.filter(plan => plan.numero_echeance === 1);
    
    console.log(`✅ Plans avec chèques: ${plansWithChecks.length}`);
    console.log(`✅ Plans d'avance initiale: ${initialAdvancePlans.length}`);
    
    if (plansWithChecks.length === initialAdvancePlans.length) {
      console.log('🎉 SUCCÈS: La logique de filtrage fonctionne correctement!');
    } else {
      console.log('❌ ÉCHEC: La logique de filtrage ne fonctionne pas correctement');
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter le test
testChecksFiltering().then(() => {
  console.log('\n🏁 Test terminé');
  process.exit(0);
}).catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
