// Test des APIs du dashboard
const http = require('http');

async function testAPI(path, description) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Test: ${description}`);
    console.log(`📡 URL: http://localhost:3001${path}`);
    
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Status: ${res.statusCode}`);
        try {
          const jsonData = JSON.parse(data);
          console.log(`✅ Response:`, JSON.stringify(jsonData, null, 2));
        } catch (e) {
          console.log(`❌ Invalid JSON:`, data);
        }
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ Error:`, error.message);
      resolve();
    });
    
    req.end();
  });
}

async function testDashboardAPIs() {
  console.log('🔍 Test des APIs du Dashboard');
  console.log('=====================================');
  
  // Test de santé
  await testAPI('/health', 'Health Check');
  
  // Test des APIs stats (sans authentification pour voir les erreurs)
  await testAPI('/api/projects/stats', 'Projects Stats');
  await testAPI('/api/sales/stats', 'Sales Stats');
  await testAPI('/api/checks/stats/summary', 'Checks Stats');
  await testAPI('/api/expenses/stats', 'Expenses Stats');
  await testAPI('/api/payments/stats', 'Payments Stats');
  
  console.log('\n🎯 Analyse terminée !');
}

testDashboardAPIs();
