// Test rapide du déploiement Railway
const fetch = require('node-fetch');

// REMPLACEZ CES URLs PAR VOS URLs RAILWAY RÉELLES
const BACKEND_URL = 'https://votre-backend.railway.app';
const FRONTEND_URL = 'https://votre-frontend.railway.app';

console.log('🧪 TEST RAPIDE RAILWAY');
console.log('====================');

async function testQuick() {
  console.log('🔧 Test Backend...');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend OK:', data.status);
    } else {
      console.log('❌ Backend Error:', response.status);
    }
  } catch (error) {
    console.log('❌ Backend inaccessible:', error.message);
  }

  console.log('🌐 Test Frontend...');
  try {
    const response = await fetch(FRONTEND_URL);
    if (response.ok) {
      console.log('✅ Frontend OK');
    } else {
      console.log('❌ Frontend Error:', response.status);
    }
  } catch (error) {
    console.log('❌ Frontend inaccessible:', error.message);
  }
}

testQuick();
