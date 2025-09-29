// Test simple pour vérifier si le backend fonctionne
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

async function testBackend() {
  try {
    console.log('🔍 Test de connexion au backend...');
    
    const response = await fetch(`http://localhost:3001/health`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend accessible !');
      console.log('📊 Réponse:', data);
      return true;
    } else {
      console.log('❌ Backend non accessible - Status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
    console.log('💡 Assurez-vous que le backend est démarré sur le port 3001');
    return false;
  }
}

testBackend();
