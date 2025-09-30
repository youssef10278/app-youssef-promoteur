// Test de validation des modifications de projet via l'API
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour faire une requête API
async function apiRequest(endpoint, method = 'GET', data = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token' // Token de test
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    return { status: response.status, data: result };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function testProjectValidation() {
  console.log('🧪 Test de validation des modifications de projet via API\n');

  try {
    // 1. Créer un projet de test avec 20 appartements
    console.log('1️⃣ Création d\'un projet de test avec 20 appartements...');
    const createProjectResponse = await apiRequest('/projects', 'POST', {
      nom: 'Projet Test Validation',
      localisation: 'Casablanca',
      societe: 'Test SARL',
      surface_totale: 5000,
      nombre_lots: 50,
      nombre_appartements: 20,
      nombre_garages: 10,
      description: 'Projet pour tester la validation'
    });

    if (createProjectResponse.status !== 201) {
      console.log('❌ Erreur lors de la création du projet:', createProjectResponse.data);
      return;
    }

    const projectId = createProjectResponse.data.data.id;
    console.log(`✅ Projet créé: ID ${projectId}, 20 appartements`);

    // 2. Créer des ventes pour 15 appartements
    console.log('\n2️⃣ Création de 15 ventes d\'appartements...');
    const sales = [];
    for (let i = 1; i <= 15; i++) {
      const saleResponse = await apiRequest('/sales', 'POST', {
        project_id: projectId,
        client_nom: `Client ${i}`,
        client_telephone: `012345678${i}`,
        client_email: `client${i}@test.com`,
        type_unite: 'appartement',
        prix_total: 500000 + (i * 10000),
        avance_total: 100000 + (i * 5000),
        statut: 'en_cours',
        date_vente: new Date().toISOString()
      });

      if (saleResponse.status === 201) {
        sales.push(saleResponse.data.data.id);
      }
    }
    console.log(`✅ ${sales.length} ventes créées`);

    // 3. Tester la modification qui devrait échouer (réduire à 2 appartements)
    console.log('\n3️⃣ Test de modification qui devrait échouer (réduire à 2 appartements)...');
    const updateResponse1 = await apiRequest(`/projects/${projectId}`, 'PUT', {
      nombre_appartements: 2
    });

    if (updateResponse1.status === 400) {
      console.log('✅ Validation fonctionne: Modification bloquée');
      console.log(`   Message d'erreur: ${updateResponse1.data.message}`);
    } else {
      console.log('❌ ERREUR: La modification aurait dû échouer !');
      console.log(`   Status: ${updateResponse1.status}, Response:`, updateResponse1.data);
    }

    // 4. Tester la modification qui devrait réussir (augmenter à 25 appartements)
    console.log('\n4️⃣ Test de modification qui devrait réussir (augmenter à 25 appartements)...');
    const updateResponse2 = await apiRequest(`/projects/${projectId}`, 'PUT', {
      nombre_appartements: 25
    });

    if (updateResponse2.status === 200) {
      console.log('✅ Modification réussie: Augmentation autorisée');
    } else {
      console.log('❌ ERREUR: L\'augmentation aurait dû réussir !');
      console.log(`   Status: ${updateResponse2.status}, Response:`, updateResponse2.data);
    }

    // 5. Tester la modification qui devrait échouer (réduire à 10 appartements)
    console.log('\n5️⃣ Test de modification qui devrait échouer (réduire à 10 appartements)...');
    const updateResponse3 = await apiRequest(`/projects/${projectId}`, 'PUT', {
      nombre_appartements: 10
    });

    if (updateResponse3.status === 400) {
      console.log('✅ Validation fonctionne: Modification bloquée');
      console.log(`   Message d'erreur: ${updateResponse3.data.message}`);
    } else {
      console.log('❌ ERREUR: La modification aurait dû échouer !');
      console.log(`   Status: ${updateResponse3.status}, Response:`, updateResponse3.data);
    }

    // 6. Nettoyer les données de test
    console.log('\n6️⃣ Nettoyage des données de test...');
    for (const saleId of sales) {
      await apiRequest(`/sales/${saleId}`, 'DELETE');
    }
    await apiRequest(`/projects/${projectId}`, 'DELETE');
    console.log('✅ Données de test supprimées');

    console.log('\n🎉 Test de validation terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  }
}

// Exécuter le test
testProjectValidation();
