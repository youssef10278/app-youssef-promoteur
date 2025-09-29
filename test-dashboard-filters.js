// Test des filtres de date du dashboard
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

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

async function testDashboardFilters() {
  log('\n🚀 TEST DES FILTRES DE DATE DU DASHBOARD', 'blue');
  log('==============================================\n', 'blue');

  let testsPassed = 0;
  let totalTests = 0;
  let authToken = null;

  // Test 1: Connexion pour obtenir un token
  totalTests++;
  log('1. Test de connexion...', 'yellow');
  try {
    const loginResult = await testEndpoint('/auth/login', 'POST', {
      email: 'test@example.com',
      password: 'password123'
    });

    if (loginResult.success && loginResult.data.data?.token) {
      authToken = loginResult.data.data.token;
      testsPassed++;
      log('✅ Connexion réussie', 'green');
    } else {
      log('❌ Échec de la connexion', 'red');
      log('Tentative de création d\'un compte de test...', 'yellow');
      
      const registerResult = await testEndpoint('/auth/register', 'POST', {
        email: 'test@example.com',
        password: 'password123',
        nom: 'Test User',
        telephone: '0123456789',
        societe: 'Test Company'
      });

      if (registerResult.success && registerResult.data.data?.token) {
        authToken = registerResult.data.data.token;
        testsPassed++;
        log('✅ Compte créé et connexion réussie', 'green');
      } else {
        log('❌ Impossible de créer un compte de test', 'red');
        return;
      }
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.message}`, 'red');
    return;
  }

  // Test 2: Statistiques des projets avec filtres
  totalTests++;
  log('\n2. Test des statistiques des projets avec filtres...', 'yellow');
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const result = await testEndpoint(
      `/projects/stats?period=this_month&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`,
      'GET',
      null,
      authToken
    );

    if (result.success) {
      testsPassed++;
      log('✅ Statistiques des projets récupérées avec filtres', 'green');
      log(`   Projets trouvés: ${result.data.data.totalProjects}`, 'blue');
    } else {
      log('❌ Échec de récupération des statistiques des projets', 'red');
      log(`   Erreur: ${result.data.error || 'Erreur inconnue'}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
  }

  // Test 3: Statistiques des ventes avec filtres
  totalTests++;
  log('\n3. Test des statistiques des ventes avec filtres...', 'yellow');
  try {
    const result = await testEndpoint(
      '/sales/stats?period=this_month',
      'GET',
      null,
      authToken
    );

    if (result.success) {
      testsPassed++;
      log('✅ Statistiques des ventes récupérées avec filtres', 'green');
      log(`   Ventes finalisées: ${result.data.data.ventesFinalisees}`, 'blue');
      log(`   Chiffre d'affaires: ${result.data.data.chiffreAffairesTotal} DH`, 'blue');
      log(`   Croissance: ${result.data.data.monthlyGrowth}%`, 'blue');
    } else {
      log('❌ Échec de récupération des statistiques des ventes', 'red');
      log(`   Erreur: ${result.data.error || 'Erreur inconnue'}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
  }

  // Test 4: Statistiques des dépenses avec filtres
  totalTests++;
  log('\n4. Test des statistiques des dépenses avec filtres...', 'yellow');
  try {
    const result = await testEndpoint(
      '/expenses/stats?period=this_month',
      'GET',
      null,
      authToken
    );

    if (result.success) {
      testsPassed++;
      log('✅ Statistiques des dépenses récupérées avec filtres', 'green');
      log(`   Total dépenses: ${result.data.data.totalExpenses}`, 'blue');
      log(`   Montant total: ${result.data.data.totalAmount} DH`, 'blue');
    } else {
      log('❌ Échec de récupération des statistiques des dépenses', 'red');
      log(`   Erreur: ${result.data.error || 'Erreur inconnue'}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
  }

  // Test 5: Statistiques des chèques avec filtres
  totalTests++;
  log('\n5. Test des statistiques des chèques avec filtres...', 'yellow');
  try {
    const result = await testEndpoint(
      '/checks/stats?period=this_month',
      'GET',
      null,
      authToken
    );

    if (result.success) {
      testsPassed++;
      log('✅ Statistiques des chèques récupérées avec filtres', 'green');
      log(`   Total chèques: ${result.data.data.totalChecks}`, 'blue');
      log(`   Chèques reçus: ${result.data.data.receivedChecks}`, 'blue');
    } else {
      log('❌ Échec de récupération des statistiques des chèques', 'red');
      log(`   Erreur: ${result.data.error || 'Erreur inconnue'}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
  }

  // Test 6: Statistiques des paiements avec filtres
  totalTests++;
  log('\n6. Test des statistiques des paiements avec filtres...', 'yellow');
  try {
    const result = await testEndpoint(
      '/payments/stats?period=this_month',
      'GET',
      null,
      authToken
    );

    if (result.success) {
      testsPassed++;
      log('✅ Statistiques des paiements récupérées avec filtres', 'green');
      log(`   Plans de paiement: ${result.data.data.totalPlans}`, 'blue');
      log(`   Échéances à venir: ${result.data.data.upcomingDeadlines}`, 'blue');
    } else {
      log('❌ Échec de récupération des statistiques des paiements', 'red');
      log(`   Erreur: ${result.data.error || 'Erreur inconnue'}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
  }

  // Résumé
  log('\n📊 RÉSUMÉ DES TESTS', 'blue');
  log('==================', 'blue');
  log(`Tests réussis: ${testsPassed}/${totalTests}`, testsPassed === totalTests ? 'green' : 'yellow');
  
  if (testsPassed === totalTests) {
    log('\n🎉 Tous les tests sont passés ! Les filtres de date du dashboard fonctionnent correctement.', 'green');
  } else {
    log('\n⚠️  Certains tests ont échoué. Vérifiez la configuration du backend.', 'yellow');
  }
}

// Vérifier que le backend est démarré
async function checkBackend() {
  try {
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      log('✅ Backend détecté et fonctionnel', 'green');
      return true;
    }
  } catch (error) {
    log('❌ Backend non accessible sur http://localhost:3001', 'red');
    log('💡 Assurez-vous que le backend est démarré avec: cd backend && npm run dev', 'yellow');
    return false;
  }
}

// Exécuter les tests
async function main() {
  const backendOk = await checkBackend();
  if (backendOk) {
    await testDashboardFilters();
  }
}

main().catch(console.error);
