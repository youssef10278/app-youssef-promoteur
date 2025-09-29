const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // IMPORTANT: Replace with a valid token

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function testSalesPage() {
  console.log('🧪 Test de la page des ventes');
  console.log('============================');

  try {
    // --- Test 1: Récupérer les projets ---
    console.log('\n--- Test 1: Récupération des projets ---');
    const projectsResponse = await fetch(`${API_BASE_URL}/projects`, { headers });
    const projectsData = await projectsResponse.json();

    if (projectsData.success) {
      console.log('✅ Projets récupérés avec succès');
      console.log(`   Nombre de projets: ${projectsData.data.length}`);
      if (projectsData.data.length > 0) {
        console.log(`   Premier projet: "${projectsData.data[0].nom}" (ID: ${projectsData.data[0].id})`);
      }
    } else {
      console.log('❌ Erreur lors de la récupération des projets');
      return;
    }

    // --- Test 2: Récupérer les ventes d'un projet ---
    if (projectsData.data.length > 0) {
      const projectId = projectsData.data[0].id;
      console.log(`\n--- Test 2: Récupération des ventes du projet "${projectsData.data[0].nom}" ---`);
      
      const salesResponse = await fetch(`${API_BASE_URL}/sales/project/${projectId}`, { headers });
      const salesData = await salesResponse.json();

      if (salesData.success) {
        console.log('✅ Ventes du projet récupérées avec succès');
        console.log(`   Nombre de ventes: ${salesData.data.length}`);
        
        if (salesData.data.length > 0) {
          const firstSale = salesData.data[0];
          console.log('   Première vente:');
          console.log(`     - ID: ${firstSale.id}`);
          console.log(`     - Client: ${firstSale.client_nom || 'N/A'}`);
          console.log(`     - Prix: ${firstSale.prix_total} DH`);
          console.log(`     - Statut: ${firstSale.statut}`);
        }
      } else {
        console.log('❌ Erreur lors de la récupération des ventes du projet');
        console.log('   Détails:', salesData);
      }
    }

    // --- Test 3: Récupérer toutes les ventes ---
    console.log('\n--- Test 3: Récupération de toutes les ventes ---');
    const allSalesResponse = await fetch(`${API_BASE_URL}/sales`, { headers });
    const allSalesData = await allSalesResponse.json();

    if (allSalesData.success) {
      console.log('✅ Toutes les ventes récupérées avec succès');
      console.log(`   Nombre total de ventes: ${allSalesData.data.length}`);
    } else {
      console.log('❌ Erreur lors de la récupération de toutes les ventes');
      console.log('   Détails:', allSalesData);
    }

    // --- Test 4: Tester les filtres de ventes ---
    console.log('\n--- Test 4: Test des filtres de ventes ---');
    
    // Test filtre par statut
    const enCoursResponse = await fetch(`${API_BASE_URL}/sales?statut=en_cours`, { headers });
    const enCoursData = await enCoursResponse.json();
    
    if (enCoursData.success) {
      console.log(`✅ Filtre par statut "en_cours": ${enCoursData.data.length} ventes`);
    } else {
      console.log('❌ Erreur avec le filtre par statut "en_cours"');
    }

    // Test filtre par type de propriété
    const appartementsResponse = await fetch(`${API_BASE_URL}/sales?type_propriete=appartement`, { headers });
    const appartementsData = await appartementsResponse.json();
    
    if (appartementsData.success) {
      console.log(`✅ Filtre par type "appartement": ${appartementsData.data.length} ventes`);
    } else {
      console.log('❌ Erreur avec le filtre par type "appartement"');
    }

    // --- Test 5: Tester les routes de paiements ---
    console.log('\n--- Test 5: Test des routes de paiements ---');
    
    // Test récupération des plans de paiement (si des ventes existent)
    if (allSalesData.data.length > 0) {
      const saleId = allSalesData.data[0].id;
      const paymentPlansResponse = await fetch(`${API_BASE_URL}/payments/plans/sale/${saleId}`, { headers });
      const paymentPlansData = await paymentPlansResponse.json();
      
      if (paymentPlansData.success) {
        console.log(`✅ Plans de paiement pour la vente ${saleId}: ${paymentPlansData.data.length} plans`);
      } else {
        console.log('❌ Erreur lors de la récupération des plans de paiement');
        console.log('   Détails:', paymentPlansData);
      }
    } else {
      console.log('⚠️ Aucune vente trouvée pour tester les plans de paiement');
    }

    // --- Test 6: Tester les statistiques ---
    console.log('\n--- Test 6: Test des statistiques ---');
    
    if (projectsData.data.length > 0) {
      const projectId = projectsData.data[0].id;
      const statsResponse = await fetch(`${API_BASE_URL}/projects/${projectId}/stats`, { headers });
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        console.log('✅ Statistiques du projet récupérées avec succès');
        console.log('   Détails:', statsData.data);
      } else {
        console.log('❌ Erreur lors de la récupération des statistiques');
        console.log('   Détails:', statsData);
      }
    }

    console.log('\n🎉 Tests de la page des ventes terminés !');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Assurez-vous que le backend est démarré sur le port 3001');
console.log('2. Remplacez YOUR_JWT_TOKEN_HERE par un token valide');
console.log('3. Exécutez: node test-sales-page.js --run');
console.log('');

if (process.argv.includes('--run')) {
  testSalesPage();
} else {
  console.log('Pour exécuter les tests, utilisez: node test-sales-page.js --run');
}
