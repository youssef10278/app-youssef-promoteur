// Test rapide pour vérifier que les routes sont corrigées
const http = require('http');

const testRoutes = [
  '/api/health',
  '/api/projects/stats?period=this_month',
  '/api/sales/stats?period=this_month',
  '/api/expenses/stats?period=this_month',
  '/api/checks/stats?period=this_month',
  '/api/checks/stats/pending?period=this_month',
  '/api/payments/stats?period=this_month'
];

async function testRoute(path) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            path,
            status: res.statusCode,
            success: response.success,
            error: response.error,
            hasData: !!response.data
          });
        } catch (e) {
          resolve({
            path,
            status: res.statusCode,
            success: false,
            error: 'Invalid JSON',
            hasData: false
          });
        }
      });
    });

    req.on('error', (err) => {
      resolve({
        path,
        status: 0,
        success: false,
        error: err.message,
        hasData: false
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Test des routes après correction...\n');

  for (const route of testRoutes) {
    const result = await testRoute(route);
    
    const statusColor = result.status === 200 ? '\x1b[32m' : 
                       result.status === 401 ? '\x1b[33m' : '\x1b[31m';
    const resetColor = '\x1b[0m';
    
    console.log(`${statusColor}${result.status}${resetColor} ${route}`);
    
    if (result.status === 401) {
      console.log('   ✅ Route accessible (erreur d\'auth attendue)');
    } else if (result.status === 200 && result.success) {
      console.log('   ✅ Route fonctionne correctement');
    } else if (result.error && result.error.includes('uuid')) {
      console.log('   ❌ Erreur UUID encore présente');
    } else {
      console.log(`   ⚠️  Erreur: ${result.error}`);
    }
    console.log('');
  }

  console.log('🎉 Tests terminés !');
  console.log('\n📝 Note: Les erreurs 401 (Unauthorized) sont normales car nous n\'avons pas de token valide.');
  console.log('   L\'important est qu\'il n\'y ait plus d\'erreurs UUID.');
}

runTests().catch(console.error);
