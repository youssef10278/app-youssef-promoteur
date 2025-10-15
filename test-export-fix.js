const fetch = require('node-fetch');

async function testExportEndpoints() {
  const baseUrl = 'http://localhost:3001/api/data-export';
  
  console.log('🧪 Test des endpoints d\'export...\n');
  
  try {
    // Test 1: Endpoint de test (sans auth)
    console.log('1️⃣ Test de l\'endpoint de test (sans authentification)...');
    const testResponse = await fetch(`${baseUrl}/test-export`);
    const testData = await testResponse.text();
    console.log('Status:', testResponse.status);
    console.log('Response:', testData);
    console.log('✅ Test endpoint OK\n');
    
  } catch (error) {
    console.error('❌ Erreur test endpoint:', error.message);
  }
  
  try {
    // Test 2: Export global (avec auth simulée)
    console.log('2️⃣ Test de l\'export global (avec token simulé)...');
    const exportResponse = await fetch(`${baseUrl}/export-all`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', exportResponse.status);
    console.log('Headers:', Object.fromEntries(exportResponse.headers.entries()));
    
    const exportData = await exportResponse.text();
    console.log('Response length:', exportData.length);
    console.log('Response preview (first 200 chars):', exportData.substring(0, 200));
    
    if (exportData === 'undefined' || exportData === 'null') {
      console.error('🚨 PROBLÈME DÉTECTÉ: Le backend renvoie undefined/null');
    } else {
      try {
        const json = JSON.parse(exportData);
        console.log('✅ JSON valide:', Object.keys(json));
      } catch (e) {
        console.error('❌ JSON invalide:', e.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur export global:', error.message);
  }
  
  try {
    // Test 3: Export sélectif
    console.log('\n3️⃣ Test de l\'export sélectif (projets)...');
    const selectiveResponse = await fetch(`${baseUrl}/export/projects`, {
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', selectiveResponse.status);
    const selectiveData = await selectiveResponse.text();
    console.log('Response length:', selectiveData.length);
    console.log('Response preview:', selectiveData.substring(0, 200));
    
  } catch (error) {
    console.error('❌ Erreur export sélectif:', error.message);
  }
}

testExportEndpoints();
