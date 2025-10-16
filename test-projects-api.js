// Test pour vérifier l'API /projects
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testProjectsAPI() {
  try {
    log('🧪 Test de l\'API /projects', 'cyan');
    
    // 1. Test de l'API /projects
    log('\n1. Test GET /projects...', 'blue');
    const response = await fetch(`${API_BASE}/projects`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      log('✅ API /projects fonctionne', 'green');
      log(`📊 Structure de la réponse:`, 'cyan');
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data) {
        log(`📊 Nombre de projets: ${data.data.length}`, 'cyan');
        if (data.data.length > 0) {
          log(`📊 Premier projet:`, 'cyan');
          console.log(JSON.stringify(data.data[0], null, 2));
        }
      } else {
        log('⚠️  Structure de réponse inattendue', 'yellow');
      }
    } else {
      const error = await response.text();
      log(`❌ API /projects échoue: ${response.status} - ${error}`, 'red');
    }
    
    // 2. Test de comparaison avec d'autres pages
    log('\n2. Comparaison avec d\'autres endpoints...', 'blue');
    
    // Test /expenses pour voir la différence
    const expensesResponse = await fetch(`${API_BASE}/expenses`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (expensesResponse.ok) {
      const expensesData = await expensesResponse.json();
      log('✅ API /expenses fonctionne aussi', 'green');
      log(`📊 Structure /expenses:`, 'cyan');
      console.log('Success:', expensesData.success);
      console.log('Data type:', Array.isArray(expensesData.data) ? 'Array' : typeof expensesData.data);
      console.log('Data length:', expensesData.data?.length || 'N/A');
    }
    
  } catch (error) {
    log(`❌ Erreur lors du test: ${error.message}`, 'red');
  }
}

// Instructions pour l'utilisateur
log('📋 INSTRUCTIONS:', 'yellow');
log('1. Remplacez YOUR_TOKEN_HERE par un vrai token JWT', 'yellow');
log('2. Assurez-vous que le backend tourne sur localhost:3001', 'yellow');
log('3. Exécutez: node test-projects-api.js', 'yellow');
log('', 'reset');

testProjectsAPI();
