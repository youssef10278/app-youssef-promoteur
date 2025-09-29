// Test des fonctions d'authentification frontend
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

async function testAuthFrontend() {
  console.log('🧪 Test des Fonctions d'Authentification Frontend\n');

  // Test 1: Inscription
  console.log('1. Test d\'inscription...');
  try {
    const userData = {
      email: `test${Date.now()}@example.com`,
      password: 'Test123!',
      nom: 'Utilisateur Test'
    };

    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Inscription réussie');
      console.log('📧 Email:', userData.email);
      console.log('🔑 Token reçu:', data.token ? 'Oui' : 'Non');
      
      // Test 2: Connexion avec les mêmes identifiants
      console.log('\n2. Test de connexion...');
      const loginResponse = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password
        })
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        console.log('✅ Connexion réussie');
        console.log('👤 Utilisateur:', loginData.user.nom);
        
        // Test 3: Vérification du profil
        console.log('\n3. Test de récupération du profil...');
        const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
          headers: { 
            'Authorization': `Bearer ${loginData.token}`,
            'Content-Type': 'application/json'
          }
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          console.log('✅ Profil récupéré');
          console.log('📋 Données:', profileData);
        } else {
          console.log('❌ Erreur profil:', await profileResponse.text());
        }

      } else {
        console.log('❌ Connexion échouée:', loginData.error);
      }

    } else {
      console.log('❌ Inscription échouée:', data.error);
    }

  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
  }

  console.log('\n🎯 Test terminé !');
  console.log('\n💡 Si tous les tests passent, l\'authentification frontend devrait fonctionner.');
}

testAuthFrontend();
