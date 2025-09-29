// Test complet de l'application avec base de données
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (data && method !== 'GET') config.body = JSON.stringify(data);

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json();

    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testFullApplication() {
  log('\n🚀 TEST COMPLET DE L\'APPLICATION', 'blue');
  log('=====================================\n', 'blue');

  let testsPassed = 0;
  let totalTests = 0;
  let authToken = null;

  // Test 1: Santé du backend
  totalTests++;
  log('1. Test de santé du backend...', 'yellow');
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    if (response.ok) {
      log('✅ Backend accessible', 'green');
      testsPassed++;
    } else {
      log('❌ Backend non accessible', 'red');
    }
  } catch (error) {
    log('❌ Backend non accessible: ' + error.message, 'red');
  }

  // Test 2: Frontend accessible
  totalTests++;
  log('\n2. Test d\'accessibilité du frontend...', 'yellow');
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      log('✅ Frontend accessible', 'green');
      testsPassed++;
    } else {
      log('❌ Frontend non accessible', 'red');
    }
  } catch (error) {
    log('❌ Frontend non accessible: ' + error.message, 'red');
  }

  // Test 3: Inscription utilisateur
  totalTests++;
  log('\n3. Test d\'inscription...', 'yellow');
  const userData = {
    email: `test${Date.now()}@example.com`,
    password: 'Test123!',
    nom: 'Utilisateur Test'
  };

  const registerResult = await testEndpoint('/auth/register', 'POST', userData);
  if (registerResult.success) {
    log('✅ Inscription réussie', 'green');
    authToken = registerResult.data.token;
    testsPassed++;
  } else {
    log(`❌ Inscription échouée: ${registerResult.error || registerResult.data?.error}`, 'red');
  }

  // Test 4: Connexion
  totalTests++;
  log('\n4. Test de connexion...', 'yellow');
  const loginResult = await testEndpoint('/auth/login', 'POST', {
    email: userData.email,
    password: userData.password
  });

  if (loginResult.success) {
    log('✅ Connexion réussie', 'green');
    if (!authToken) authToken = loginResult.data.token;
    testsPassed++;
  } else {
    log(`❌ Connexion échouée: ${loginResult.error || loginResult.data?.error}`, 'red');
  }

  if (!authToken) {
    log('\n❌ Impossible de continuer sans token d\'authentification', 'red');
    return;
  }

  // Test 5: Création d'un projet
  totalTests++;
  log('\n5. Test de création de projet...', 'yellow');
  const projectData = {
    nom: 'Projet Test',
    localisation: 'Casablanca, Maroc',
    societe: 'Test SARL',
    surface_totale: 1000,
    nombre_lots: 20,
    nombre_appartements: 15,
    nombre_garages: 5,
    description: 'Projet de test automatique'
  };

  const projectResult = await testEndpoint('/projects', 'POST', projectData, authToken);
  let projectId = null;

  if (projectResult.success) {
    log('✅ Projet créé avec succès', 'green');
    projectId = projectResult.data.id;
    testsPassed++;
  } else {
    log(`❌ Création de projet échouée: ${projectResult.error || projectResult.data?.error}`, 'red');
  }

  // Test 6: Récupération des projets
  totalTests++;
  log('\n6. Test de récupération des projets...', 'yellow');
  const getProjectsResult = await testEndpoint('/projects', 'GET', null, authToken);

  if (getProjectsResult.success && Array.isArray(getProjectsResult.data)) {
    log(`✅ Projets récupérés (${getProjectsResult.data.length} projet(s))`, 'green');
    testsPassed++;
  } else {
    log(`❌ Récupération des projets échouée`, 'red');
  }

  // Test 7: Création d'une vente (si projet créé)
  if (projectId) {
    totalTests++;
    log('\n7. Test de création de vente...', 'yellow');
    const saleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'A101',
      client_nom: 'Client Test',
      client_telephone: '+212600000000',
      client_email: 'client@test.com',
      surface: 85.5,
      prix_total: 850000,
      description: 'Appartement 3 pièces avec balcon',
      mode_paiement: 'cheque_espece',
      avance_declare: 100000,
      avance_non_declare: 50000
    };

    const saleResult = await testEndpoint('/sales', 'POST', saleData, authToken);

    if (saleResult.success) {
      log('✅ Vente créée avec succès', 'green');
      testsPassed++;
    } else {
      log(`❌ Création de vente échouée: ${saleResult.error || saleResult.data?.error}`, 'red');
    }
  }

  // Test 8: Statistiques
  totalTests++;
  log('\n8. Test des statistiques...', 'yellow');
  const statsResult = await testEndpoint('/projects/stats', 'GET', null, authToken);

  if (statsResult.success) {
    log('✅ Statistiques récupérées', 'green');
    testsPassed++;
  } else {
    log(`❌ Récupération des statistiques échouée`, 'red');
  }

  // Résumé final
  log('\n=====================================', 'blue');
  log('📊 RÉSUMÉ DES TESTS', 'blue');
  log('=====================================', 'blue');
  log(`✅ Tests réussis: ${testsPassed}/${totalTests}`, testsPassed === totalTests ? 'green' : 'yellow');
  
  if (testsPassed === totalTests) {
    log('\n🎉 FÉLICITATIONS ! Votre application est 100% fonctionnelle !', 'green');
    log('\n📍 Accédez à votre application :', 'blue');
    log(`   Frontend: ${FRONTEND_URL}`, 'blue');
    log(`   Backend API: http://localhost:3001`, 'blue');
    log('\n💡 Vous pouvez maintenant utiliser toutes les fonctionnalités !', 'green');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration.', 'yellow');
  }

  log('\n=====================================\n', 'blue');
}

// Exécution
testFullApplication().catch(console.error);
