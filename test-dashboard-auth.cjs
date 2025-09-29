// Test des APIs du dashboard avec authentification
const http = require('http');

// Fonction pour faire un appel API
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testDashboardWithAuth() {
  console.log('🔍 Test des APIs Dashboard avec authentification');
  console.log('================================================');
  
  try {
    // Étape 1: Se connecter pour obtenir un token
    console.log('\n🔐 Étape 1: Connexion...');
    const loginData = JSON.stringify({
      email: 'abranto.shop@gmail.com',
      password: 'Test123@'
    });
    
    const loginOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
      }
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    console.log('📊 Login Status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      console.error('❌ Échec de connexion:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.data?.token;
    if (!token) {
      console.error('❌ Pas de token reçu:', loginResponse.data);
      return;
    }
    
    console.log('✅ Connexion réussie, token obtenu');
    
    // Étape 2: Tester les APIs stats avec le token
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    const apis = [
      { path: '/api/projects/stats', name: 'Projects Stats' },
      { path: '/api/sales/stats', name: 'Sales Stats' },
      { path: '/api/checks/stats/summary', name: 'Checks Stats' },
      { path: '/api/expenses/stats', name: 'Expenses Stats' },
      { path: '/api/payments/stats', name: 'Payments Stats' }
    ];
    
    for (const api of apis) {
      console.log(`\n🧪 Test: ${api.name}`);
      console.log(`📡 URL: http://localhost:3001${api.path}`);
      
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: api.path,
        method: 'GET',
        headers: authHeaders
      };
      
      try {
        const response = await makeRequest(options);
        console.log(`📊 Status: ${response.status}`);
        
        if (response.status === 200) {
          console.log('✅ Données reçues:', JSON.stringify(response.data, null, 2));
        } else {
          console.log('❌ Erreur:', response.data);
        }
      } catch (error) {
        console.error(`❌ Erreur réseau:`, error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
  
  console.log('\n🎯 Test terminé !');
}

testDashboardWithAuth();
