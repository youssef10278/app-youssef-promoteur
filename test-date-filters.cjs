// Test des filtres de date
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

async function testDateFilters() {
  console.log('🗓️ Test des Filtres de Date');
  console.log('============================');
  
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
    
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // Test 1: Toutes les périodes
    console.log('\n🧪 Test 1: period=all');
    const allOptions = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/sales/stats?period=all',
      method: 'GET',
      headers: authHeaders
    };
    
    const allResponse = await makeRequest(allOptions);
    console.log('📊 Sales (all):', allResponse.data.data);
    
    // Test 2: Ce mois-ci (septembre 2025)
    console.log('\n🧪 Test 2: period=this_month');
    const thisMonthStart = '2025-09-01T00:00:00.000Z';
    const thisMonthEnd = '2025-09-30T23:59:59.999Z';
    
    const thisMonthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/sales/stats?period=this_month&startDate=${thisMonthStart}&endDate=${thisMonthEnd}`,
      method: 'GET',
      headers: authHeaders
    };
    
    const thisMonthResponse = await makeRequest(thisMonthOptions);
    console.log('📊 Sales (this_month):', thisMonthResponse.data.data);
    
    // Test 3: Mois dernier (août 2025)
    console.log('\n🧪 Test 3: period=last_month');
    const lastMonthStart = '2025-08-01T00:00:00.000Z';
    const lastMonthEnd = '2025-08-31T23:59:59.999Z';
    
    const lastMonthOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/sales/stats?period=last_month&startDate=${lastMonthStart}&endDate=${lastMonthEnd}`,
      method: 'GET',
      headers: authHeaders
    };
    
    const lastMonthResponse = await makeRequest(lastMonthOptions);
    console.log('📊 Sales (last_month):', lastMonthResponse.data.data);
    
    // Test 4: Checks avec filtres
    console.log('\n🧪 Test 4: Checks avec filtres');
    const checksOptions = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/checks/stats/summary?period=last_month&startDate=${lastMonthStart}&endDate=${lastMonthEnd}`,
      method: 'GET',
      headers: authHeaders
    };
    
    const checksResponse = await makeRequest(checksOptions);
    console.log('📊 Checks (last_month):', checksResponse.data.data);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testDateFilters();
