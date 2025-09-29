const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE'; // IMPORTANT: Replace with a valid token

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function testChecksPage() {
  console.log('🧪 Test de la page des chèques');
  console.log('=============================');

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

    // --- Test 2: Récupérer les chèques ---
    console.log('\n--- Test 2: Récupération des chèques ---');
    const checksResponse = await fetch(`${API_BASE_URL}/checks`, { headers });
    const checksData = await checksResponse.json();

    if (checksData.success) {
      console.log('✅ Chèques récupérés avec succès');
      console.log(`   Nombre de chèques: ${checksData.data.length}`);
      
      if (checksData.data.length > 0) {
        const firstCheck = checksData.data[0];
        console.log('   Premier chèque:');
        console.log(`     - ID: ${firstCheck.id}`);
        console.log(`     - Type: ${firstCheck.type_cheque}`);
        console.log(`     - Montant: ${firstCheck.montant} DH`);
        console.log(`     - Projet: ${firstCheck.project_nom || 'Aucun'}`);
        console.log(`     - Statut: ${firstCheck.statut}`);
      }
    } else {
      console.log('❌ Erreur lors de la récupération des chèques');
      console.log('   Détails:', checksData);
    }

    // --- Test 3: Récupérer les chèques d'un projet spécifique ---
    if (projectsData.data.length > 0) {
      const projectId = projectsData.data[0].id;
      console.log(`\n--- Test 3: Récupération des chèques du projet "${projectsData.data[0].nom}" ---`);
      
      const projectChecksResponse = await fetch(`${API_BASE_URL}/checks?project_id=${projectId}`, { headers });
      const projectChecksData = await projectChecksResponse.json();

      if (projectChecksData.success) {
        console.log('✅ Chèques du projet récupérés avec succès');
        console.log(`   Nombre de chèques pour ce projet: ${projectChecksData.data.length}`);
      } else {
        console.log('❌ Erreur lors de la récupération des chèques du projet');
        console.log('   Détails:', projectChecksData);
      }
    }

    // --- Test 4: Tester les filtres ---
    console.log('\n--- Test 4: Test des filtres ---');
    
    // Test filtre par type
    const recuChecksResponse = await fetch(`${API_BASE_URL}/checks?type=recu`, { headers });
    const recuChecksData = await recuChecksResponse.json();
    
    if (recuChecksData.success) {
      console.log(`✅ Filtre par type "reçu": ${recuChecksData.data.length} chèques`);
    } else {
      console.log('❌ Erreur avec le filtre par type "reçu"');
    }

    // Test filtre par statut
    const emisChecksResponse = await fetch(`${API_BASE_URL}/checks?statut=emis`, { headers });
    const emisChecksData = await emisChecksResponse.json();
    
    if (emisChecksData.success) {
      console.log(`✅ Filtre par statut "émis": ${emisChecksData.data.length} chèques`);
    } else {
      console.log('❌ Erreur avec le filtre par statut "émis"');
    }

    // --- Test 5: Créer un chèque de test ---
    console.log('\n--- Test 5: Création d\'un chèque de test ---');
    
    const testCheckData = {
      type_cheque: 'donne',
      montant: 1000,
      numero_cheque: 'TEST-' + Date.now(),
      nom_beneficiaire: 'Test Bénéficiaire',
      nom_emetteur: 'Test Émetteur',
      date_emission: new Date().toISOString().split('T')[0],
      description: 'Chèque de test automatique',
      statut: 'emis',
      facture_recue: false
    };

    const createCheckResponse = await fetch(`${API_BASE_URL}/checks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testCheckData)
    });

    const createCheckData = await createCheckResponse.json();

    if (createCheckData.success) {
      console.log('✅ Chèque de test créé avec succès');
      console.log(`   ID du chèque: ${createCheckData.data.id}`);
      
      // Supprimer le chèque de test
      const deleteResponse = await fetch(`${API_BASE_URL}/checks/${createCheckData.data.id}`, {
        method: 'DELETE',
        headers
      });
      
      if (deleteResponse.ok) {
        console.log('✅ Chèque de test supprimé avec succès');
      } else {
        console.log('⚠️ Impossible de supprimer le chèque de test');
      }
    } else {
      console.log('❌ Erreur lors de la création du chèque de test');
      console.log('   Détails:', createCheckData);
    }

    console.log('\n🎉 Tests de la page des chèques terminés !');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error.message);
  }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Assurez-vous que le backend est démarré sur le port 3001');
console.log('2. Remplacez YOUR_JWT_TOKEN_HERE par un token valide');
console.log('3. Exécutez: node test-checks-page.js');
console.log('');

if (process.argv.includes('--run')) {
  testChecksPage();
} else {
  console.log('Pour exécuter les tests, utilisez: node test-checks-page.js --run');
}
