// Test pour vérifier que la correction des chèques fonctionne
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

async function testChecksAPI() {
  try {
    log('🧪 Test de l\'API des chèques après correction', 'cyan');
    
    // 1. Test avec statut=all (devrait maintenant fonctionner)
    log('\n1. Test avec statut=all...', 'blue');
    const response1 = await fetch(`${API_BASE}/checks?statut=all`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response1.ok) {
      log('✅ statut=all fonctionne', 'green');
    } else {
      const error = await response1.text();
      log(`❌ statut=all échoue: ${error}`, 'red');
    }
    
    // 2. Test avec type_cheque=all
    log('\n2. Test avec type_cheque=all...', 'blue');
    const response2 = await fetch(`${API_BASE}/checks?type_cheque=all`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response2.ok) {
      log('✅ type_cheque=all fonctionne', 'green');
    } else {
      const error = await response2.text();
      log(`❌ type_cheque=all échoue: ${error}`, 'red');
    }
    
    // 3. Test avec les deux paramètres (comme dans l'erreur originale)
    log('\n3. Test avec type_cheque=all&statut=all...', 'blue');
    const response3 = await fetch(`${API_BASE}/checks?type_cheque=all&statut=all`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response3.ok) {
      log('✅ Combinaison type_cheque=all&statut=all fonctionne', 'green');
      const data = await response3.json();
      log(`📊 Nombre de chèques retournés: ${data.data?.length || 0}`, 'cyan');
    } else {
      const error = await response3.text();
      log(`❌ Combinaison échoue: ${error}`, 'red');
    }
    
    // 4. Test avec valeurs spécifiques
    log('\n4. Test avec valeurs spécifiques...', 'blue');
    const response4 = await fetch(`${API_BASE}/checks?type=recu&statut=emis`, {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    if (response4.ok) {
      log('✅ Valeurs spécifiques fonctionnent', 'green');
      const data = await response4.json();
      log(`📊 Chèques reçus émis: ${data.data?.length || 0}`, 'cyan');
    } else {
      const error = await response4.text();
      log(`❌ Valeurs spécifiques échouent: ${error}`, 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur lors du test: ${error.message}`, 'red');
  }
}

// Instructions pour l'utilisateur
log('📋 INSTRUCTIONS:', 'yellow');
log('1. Remplacez YOUR_TOKEN_HERE par un vrai token JWT', 'yellow');
log('2. Assurez-vous que le backend tourne sur localhost:3001', 'yellow');
log('3. Exécutez: node test-checks-fix.js', 'yellow');
log('', 'reset');

testChecksAPI();
