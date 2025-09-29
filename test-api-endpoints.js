// Test des endpoints API avec authentification
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
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

    return { 
      success: response.ok, 
      data: result, 
      status: response.status,
      statusText: response.statusText 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testDashboardEndpoints() {
  log('\n🚀 TEST DES ENDPOINTS DU DASHBOARD', 'blue');
  log('=====================================\n', 'blue');

  let authToken = null;

  // Test 1: Connexion
  log('1. 🔐 Test de connexion...', 'yellow');
  try {
    const loginResult = await testEndpoint('/auth/login', 'POST', {
      email: 'abranto.shop@gmail.com',
      password: 'password123'
    });

    if (loginResult.success && loginResult.data.data?.token) {
      authToken = loginResult.data.data.token;
      log('✅ Connexion réussie', 'green');
      log(`   Token: ${authToken.substring(0, 20)}...`, 'cyan');
    } else {
      log('❌ Échec de la connexion', 'red');
      log(`   Erreur: ${loginResult.data?.error || 'Erreur inconnue'}`, 'red');
      
      // Essayer avec un autre utilisateur
      log('   Tentative avec test@example.com...', 'yellow');
      const loginResult2 = await testEndpoint('/auth/login', 'POST', {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResult2.success && loginResult2.data.data?.token) {
        authToken = loginResult2.data.data.token;
        log('✅ Connexion réussie avec test@example.com', 'green');
      } else {
        log('❌ Impossible de se connecter', 'red');
        return;
      }
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.message}`, 'red');
    return;
  }

  // Test 2: Statistiques des projets
  log('\n2. 🏗️ Test des statistiques des projets...', 'yellow');
  const projectsTests = [
    { name: 'Sans filtre', params: {} },
    { name: 'Ce mois-ci', params: { period: 'this_month' } },
    { name: 'Aujourd\'hui', params: { period: 'today' } },
    { name: 'Cette semaine', params: { period: 'this_week' } }
  ];

  for (const test of projectsTests) {
    const params = new URLSearchParams(test.params).toString();
    const endpoint = `/projects/stats${params ? `?${params}` : ''}`;
    
    const result = await testEndpoint(endpoint, 'GET', null, authToken);
    
    if (result.success) {
      log(`   ✅ ${test.name}: ${JSON.stringify(result.data.data)}`, 'green');
    } else {
      log(`   ❌ ${test.name}: ${result.data?.error || result.error}`, 'red');
    }
  }

  // Test 3: Statistiques des ventes
  log('\n3. 💰 Test des statistiques des ventes...', 'yellow');
  const salesTests = [
    { name: 'Sans filtre', params: {} },
    { name: 'Ce mois-ci', params: { period: 'this_month' } },
    { name: 'Aujourd\'hui', params: { period: 'today' } }
  ];

  for (const test of salesTests) {
    const params = new URLSearchParams(test.params).toString();
    const endpoint = `/sales/stats${params ? `?${params}` : ''}`;
    
    const result = await testEndpoint(endpoint, 'GET', null, authToken);
    
    if (result.success) {
      log(`   ✅ ${test.name}: CA=${result.data.data.chiffreAffairesTotal}, Ventes=${result.data.data.ventesFinalisees}`, 'green');
    } else {
      log(`   ❌ ${test.name}: ${result.data?.error || result.error}`, 'red');
    }
  }

  // Test 4: Statistiques des dépenses
  log('\n4. 💸 Test des statistiques des dépenses...', 'yellow');
  const expensesTests = [
    { name: 'Sans filtre', params: {} },
    { name: 'Ce mois-ci', params: { period: 'this_month' } }
  ];

  for (const test of expensesTests) {
    const params = new URLSearchParams(test.params).toString();
    const endpoint = `/expenses/stats${params ? `?${params}` : ''}`;
    
    const result = await testEndpoint(endpoint, 'GET', null, authToken);
    
    if (result.success) {
      log(`   ✅ ${test.name}: Total=${result.data.data.totalExpenses}, Montant=${result.data.data.totalAmount}`, 'green');
    } else {
      log(`   ❌ ${test.name}: ${result.data?.error || result.error}`, 'red');
    }
  }

  // Test 5: Statistiques des chèques
  log('\n5. 📄 Test des statistiques des chèques...', 'yellow');
  const checksTests = [
    { name: 'Stats générales', endpoint: '/checks/stats', params: { period: 'this_month' } },
    { name: 'Chèques en attente', endpoint: '/checks/stats/pending', params: { period: 'this_month' } }
  ];

  for (const test of checksTests) {
    const params = new URLSearchParams(test.params).toString();
    const endpoint = `${test.endpoint}${params ? `?${params}` : ''}`;
    
    const result = await testEndpoint(endpoint, 'GET', null, authToken);
    
    if (result.success) {
      log(`   ✅ ${test.name}: ${JSON.stringify(result.data.data)}`, 'green');
    } else {
      log(`   ❌ ${test.name}: ${result.data?.error || result.error}`, 'red');
    }
  }

  // Test 6: Statistiques des paiements
  log('\n6. 💳 Test des statistiques des paiements...', 'yellow');
  const paymentsTests = [
    { name: 'Stats générales', params: { period: 'this_month' } }
  ];

  for (const test of paymentsTests) {
    const params = new URLSearchParams(test.params).toString();
    const endpoint = `/payments/stats${params ? `?${params}` : ''}`;
    
    const result = await testEndpoint(endpoint, 'GET', null, authToken);
    
    if (result.success) {
      log(`   ✅ ${test.name}: Plans=${result.data.data.totalPlans}, Échéances=${result.data.data.upcomingDeadlines}`, 'green');
    } else {
      log(`   ❌ ${test.name}: ${result.data?.error || result.error}`, 'red');
    }
  }

  // Test 7: Listes de données
  log('\n7. 📋 Test des listes de données...', 'yellow');
  const listTests = [
    { name: 'Projets', endpoint: '/projects' },
    { name: 'Ventes', endpoint: '/sales' },
    { name: 'Dépenses', endpoint: '/expenses' },
    { name: 'Chèques', endpoint: '/checks' }
  ];

  for (const test of listTests) {
    const result = await testEndpoint(test.endpoint, 'GET', null, authToken);
    
    if (result.success) {
      const count = Array.isArray(result.data.data) ? result.data.data.length : 'N/A';
      log(`   ✅ ${test.name}: ${count} éléments`, 'green');
    } else {
      log(`   ❌ ${test.name}: ${result.data?.error || result.error}`, 'red');
    }
  }

  log('\n🎉 Tests terminés !', 'blue');
}

// Exécuter les tests
testDashboardEndpoints().catch(console.error);
