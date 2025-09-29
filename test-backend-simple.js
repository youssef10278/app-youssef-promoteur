const fetch = require('node-fetch');

async function testBackend() {
  console.log('🧪 Test du backend...');
  
  try {
    // Test de santé
    console.log('📡 Test de l\'endpoint de santé...');
    const healthResponse = await fetch('http://localhost:3001/health');
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend en ligne:', healthData);
    } else {
      console.log('❌ Backend hors ligne - Status:', healthResponse.status);
      return;
    }
    
    // Test de l'API auth
    console.log('🔐 Test de l\'endpoint auth...');
    const authResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'wrongpassword'
      })
    });
    
    console.log('📊 Réponse auth status:', authResponse.status);
    const authData = await authResponse.text();
    console.log('📊 Réponse auth:', authData);
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('💡 Le backend n\'est probablement pas démarré');
    console.log('💡 Démarrez-le avec: cd backend && npm run dev');
  }
}

testBackend();
