const fetch = require('node-fetch');

async function testExport() {
  try {
    console.log('🧪 Test de l\'endpoint d\'export...');
    
    // Test avec un token d'authentification (vous devrez le remplacer par un vrai token)
    const response = await fetch('http://localhost:3001/api/data-export/export-all', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN_HERE', // Remplacez par un vrai token
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    console.log('📄 Response text (first 500 chars):', text.substring(0, 500));
    console.log('📄 Response length:', text.length);
    
    if (text === 'undefined' || text === 'null') {
      console.error('🚨 PROBLÈME DÉTECTÉ: Le backend renvoie undefined/null');
    } else {
      try {
        const json = JSON.parse(text);
        console.log('✅ JSON valide:', Object.keys(json));
      } catch (e) {
        console.error('❌ JSON invalide:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur de test:', error.message);
  }
}

testExport();
