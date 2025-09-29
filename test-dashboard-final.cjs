// Test final du dashboard avec la structure corrigée
const http = require('http');

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

async function testDashboardFinal() {
  console.log('🎯 Test Final Dashboard - Structure des Données');
  console.log('===============================================');
  
  try {
    // Connexion
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
    const token = loginResponse.data.data?.token;
    
    if (!token) {
      console.error('❌ Pas de token');
      return;
    }
    
    console.log('✅ Token obtenu');
    
    // Test avec paramètres period=all
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    console.log('\n🧪 Test Projects Stats avec period=all');
    const projectsOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/projects/stats?period=all',
      method: 'GET',
      headers: authHeaders
    };
    
    const projectsResponse = await makeRequest(projectsOptions);
    console.log('📊 Projects Response:', JSON.stringify(projectsResponse.data, null, 2));
    
    // Simulation de l'accès frontend
    console.log('\n🔍 Simulation Frontend:');
    console.log('response.data.data?.totalProjects =', projectsResponse.data.data?.totalProjects);
    console.log('response.data?.totalProjects =', projectsResponse.data?.totalProjects);
    
    console.log('\n🧪 Test Sales Stats');
    const salesOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/sales/stats?period=all',
      method: 'GET',
      headers: authHeaders
    };
    
    const salesResponse = await makeRequest(salesOptions);
    console.log('📊 Sales Response:', JSON.stringify(salesResponse.data, null, 2));
    console.log('🔍 Frontend Access:');
    console.log('response.data.data?.chiffreAffairesTotal =', salesResponse.data.data?.chiffreAffairesTotal);
    console.log('response.data?.chiffreAffairesTotal =', salesResponse.data?.chiffreAffairesTotal);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testDashboardFinal();
