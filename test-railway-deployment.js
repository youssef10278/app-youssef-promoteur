// Test de déploiement Railway
const fetch = require('node-fetch');

// Configuration (à modifier avec vos URLs Railway)
const BACKEND_URL = process.env.RAILWAY_BACKEND_URL || 'https://votre-backend.railway.app';
const FRONTEND_URL = process.env.RAILWAY_FRONTEND_URL || 'https://votre-frontend.railway.app';

console.log('🧪 TEST DE DÉPLOIEMENT RAILWAY');
console.log('==============================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Frontend URL: ${FRONTEND_URL}`);
console.log('');

async function testBackend() {
  console.log('🔧 Test du Backend...');
  
  try {
    // Test de santé
    console.log('  📊 Test de santé...');
    const healthResponse = await fetch(`${BACKEND_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('  ✅ Backend accessible:', healthData.status);
    } else {
      console.log('  ❌ Backend inaccessible:', healthResponse.status);
      return false;
    }

    // Test de l'API
    console.log('  📡 Test de l\'API...');
    const apiResponse = await fetch(`${BACKEND_URL}/api`);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('  ✅ API accessible:', apiData.message);
    } else {
      console.log('  ❌ API inaccessible:', apiResponse.status);
      return false;
    }

    // Test d'authentification
    console.log('  🔐 Test d\'authentification...');
    const authResponse = await fetch(`${BACKEND_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `test-${Date.now()}@railway.test`,
        password: 'test123456',
        nom: 'Test Railway User'
      })
    });

    if (authResponse.ok) {
      console.log('  ✅ Authentification fonctionnelle');
    } else {
      const errorData = await authResponse.json();
      console.log('  ⚠️ Authentification:', authResponse.status, errorData.error);
    }

    return true;
  } catch (error) {
    console.log('  ❌ Erreur backend:', error.message);
    return false;
  }
}

async function testFrontend() {
  console.log('🌐 Test du Frontend...');
  
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      const html = await response.text();
      if (html.includes('Promoteur') || html.includes('<!DOCTYPE html>')) {
        console.log('  ✅ Frontend accessible');
        return true;
      } else {
        console.log('  ⚠️ Frontend accessible mais contenu inattendu');
        return false;
      }
    } else {
      console.log('  ❌ Frontend inaccessible:', response.status);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Erreur frontend:', error.message);
    return false;
  }
}

async function testCORS() {
  console.log('🔗 Test CORS...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
      method: 'GET',
      headers: {
        'Origin': FRONTEND_URL,
        'Content-Type': 'application/json'
      }
    });

    const corsHeader = response.headers.get('access-control-allow-origin');
    if (corsHeader === FRONTEND_URL || corsHeader === '*') {
      console.log('  ✅ CORS configuré correctement');
      return true;
    } else {
      console.log('  ⚠️ CORS peut nécessiter une configuration:', corsHeader);
      return false;
    }
  } catch (error) {
    console.log('  ❌ Erreur CORS:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Début des tests...\n');
  
  const backendOk = await testBackend();
  console.log('');
  
  const frontendOk = await testFrontend();
  console.log('');
  
  const corsOk = await testCORS();
  console.log('');
  
  console.log('📊 RÉSULTATS:');
  console.log('=============');
  console.log(`Backend:  ${backendOk ? '✅' : '❌'}`);
  console.log(`Frontend: ${frontendOk ? '✅' : '❌'}`);
  console.log(`CORS:     ${corsOk ? '✅' : '⚠️'}`);
  
  if (backendOk && frontendOk) {
    console.log('\n🎉 DÉPLOIEMENT RÉUSSI !');
    console.log('Votre application est prête à être utilisée.');
  } else {
    console.log('\n⚠️ PROBLÈMES DÉTECTÉS');
    console.log('Vérifiez la configuration et les logs Railway.');
  }
  
  console.log('\n🔗 URLs:');
  console.log(`Frontend: ${FRONTEND_URL}`);
  console.log(`Backend:  ${BACKEND_URL}`);
  console.log(`API:      ${BACKEND_URL}/api`);
}

// Exécuter les tests
runTests().catch(console.error);
