// Test des endpoints de statistiques du dashboard
import fetch from 'node-fetch';

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

const BASE_URL = 'http://localhost:3001/api';

// Token de test (vous devrez le remplacer par un vrai token)
const TEST_TOKEN = 'your-test-token-here';

async function testEndpoint(endpoint, description) {
  try {
    log(`🔍 Test: ${description}`, 'blue');
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      log(`✅ ${description} - Succès`, 'green');
      log(`   Données: ${JSON.stringify(data.data, null, 2)}`, 'reset');
      return data.data;
    } else {
      log(`❌ ${description} - Échec: ${data.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ ${description} - Erreur: ${error.message}`, 'red');
    return null;
  }
}

async function testDashboardEndpoints() {
  log('🧪 TEST DES ENDPOINTS DE STATISTIQUES DU DASHBOARD', 'blue');
  log('==================================================\n', 'blue');

  // Test des endpoints
  const projectsStats = await testEndpoint('/projects/stats', 'Statistiques des projets');
  const salesStats = await testEndpoint('/sales/stats', 'Statistiques des ventes');
  const checksStats = await testEndpoint('/checks/stats/pending', 'Chèques en attente');

  log('\n📊 RÉSUMÉ DES STATISTIQUES', 'blue');
  log('==========================', 'blue');

  if (projectsStats) {
    log(`📁 Projets actifs: ${projectsStats.totalProjects}`, 'green');
  }

  if (salesStats) {
    log(`💰 Chiffre d'affaires: ${salesStats.chiffreAffairesTotal} DH`, 'green');
    log(`✅ Ventes finalisées: ${salesStats.ventesFinalisees}`, 'green');
    log(`🔄 Ventes en cours: ${salesStats.ventesEnCours}`, 'green');
  }

  if (checksStats) {
    log(`📋 Chèques en attente: ${checksStats.cheques_en_attente}`, 'green');
    log(`💸 Montant en attente: ${checksStats.montant_en_attente} DH`, 'green');
  }

  // Vérifier si tous les endpoints fonctionnent
  const allWorking = projectsStats && salesStats && checksStats;
  
  if (allWorking) {
    log('\n🎉 TOUS LES ENDPOINTS FONCTIONNENT !', 'green');
    log('✅ Le dashboard devrait maintenant afficher les bonnes données', 'green');
  } else {
    log('\n⚠️  CERTAINS ENDPOINTS NE FONCTIONNENT PAS', 'yellow');
    log('🔧 Vérifiez que le backend est démarré et que la base de données est accessible', 'yellow');
  }
}

async function testWithoutAuth() {
  log('🧪 TEST SANS AUTHENTIFICATION (POUR VÉRIFIER LES ROUTES)', 'blue');
  log('========================================================\n', 'blue');

  try {
    const response = await fetch(`${BASE_URL}/projects/stats`);
    
    if (response.status === 401) {
      log('✅ Authentification requise - Sécurité OK', 'green');
    } else {
      log('⚠️  Endpoint accessible sans authentification', 'yellow');
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.message}`, 'red');
    log('🔧 Vérifiez que le backend est démarré sur le port 3001', 'yellow');
  }
}

async function main() {
  // Test sans authentification d'abord
  await testWithoutAuth();
  
  log('\n' + '='.repeat(60) + '\n', 'blue');
  
  // Test avec authentification (nécessite un token valide)
  if (TEST_TOKEN === 'your-test-token-here') {
    log('⚠️  TOKEN DE TEST NON CONFIGURÉ', 'yellow');
    log('Pour tester avec authentification:', 'yellow');
    log('1. Connectez-vous à l\'application', 'yellow');
    log('2. Récupérez le token JWT du localStorage', 'yellow');
    log('3. Remplacez TEST_TOKEN dans ce script', 'yellow');
    log('4. Relancez le test', 'yellow');
  } else {
    await testDashboardEndpoints();
  }
  
  log('\n🚀 PROCHAINES ÉTAPES:', 'blue');
  log('1. Démarrer le backend: cd backend && npm run dev', 'blue');
  log('2. Démarrer le frontend: npm run dev', 'blue');
  log('3. Se connecter à l\'application', 'blue');
  log('4. Vérifier que les statistiques s\'affichent correctement', 'blue');
}

main().catch(console.error);
