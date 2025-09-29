// Test pour vérifier les utilisateurs
const API_BASE_URL = 'http://localhost:3001/api';

async function testUsers() {
  try {
    console.log('🧪 Test de connexion...');
    
    // Test de connexion avec différents emails
    const testEmails = [
      'abranto.shop@gmail.com',
      'test@example.com',
      'admin@test.com'
    ];
    
    for (const email of testEmails) {
      try {
        console.log(`\n🔍 Test avec ${email}...`);
        
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            password: 'password123'
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          console.log(`✅ Connexion réussie avec ${email}`);
          console.log(`   Token: ${loginData.data.token.substring(0, 20)}...`);
          return loginData.data.token;
        } else {
          const errorText = await loginResponse.text();
          console.log(`❌ Échec avec ${email}: ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Erreur avec ${email}: ${error.message}`);
      }
    }
    
    // Test d'inscription si aucune connexion ne fonctionne
    console.log('\n🔍 Test d\'inscription...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        nom: 'Test User'
      })
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Inscription réussie');
      return registerData.data.token;
    } else {
      const errorText = await registerResponse.text();
      console.log(`❌ Échec inscription: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testUsers();

