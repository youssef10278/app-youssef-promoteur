const fetch = require('node-fetch');

async function quickTest() {
  console.log('🚀 Test rapide du backend');
  console.log('=========================');

  const API_BASE = 'http://localhost:3001';

  try {
    // 1. Test de base
    console.log('\n1. Test de base...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Backend accessible:', healthData.status);
    } else {
      console.log('❌ Backend inaccessible:', healthResponse.status);
      return;
    }

    // 2. Test de la route debug
    console.log('\n2. Test de la route debug...');
    try {
      const debugResponse = await fetch(`${API_BASE}/api/debug-data`);
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('✅ Route debug accessible');
        console.log(`   Dépenses: ${debugData.data.expenses.length}`);
        console.log(`   Projets: ${debugData.data.projects.length}`);
      } else {
        console.log('❌ Route debug inaccessible:', debugResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur route debug:', error.message);
    }

    // 3. Test des routes avec authentification (sans token)
    console.log('\n3. Test des routes protégées (sans token)...');
    
    const protectedRoutes = [
      '/api/auth/profile',
      '/api/projects/stats',
      '/api/expenses',
      '/api/sales'
    ];

    for (const route of protectedRoutes) {
      try {
        const response = await fetch(`${API_BASE}${route}`);
        console.log(`   ${route}: ${response.status} ${response.statusText}`);
        
        if (response.status === 401) {
          console.log('     ✅ Authentification requise (comportement normal)');
        } else if (response.status === 500) {
          console.log('     ❌ Erreur serveur (problème de DB probable)');
          const errorText = await response.text();
          console.log(`     Détails: ${errorText.substring(0, 200)}...`);
        }
      } catch (error) {
        console.log(`   ${route}: Erreur de connexion - ${error.message}`);
      }
    }

    console.log('\n📋 Résumé:');
    console.log('- Si toutes les routes protégées retournent 401, le backend fonctionne');
    console.log('- Si certaines retournent 500, il y a un problème de base de données');
    console.log('- Vérifiez la configuration dans backend/.env');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Instructions
console.log('📋 Instructions:');
console.log('1. Assurez-vous que le backend est démarré: cd backend && npm run dev');
console.log('2. Exécutez ce script: node quick-test-backend.js');
console.log('');

quickTest();
