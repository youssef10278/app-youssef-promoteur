const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Fonction pour tester les analytics des dépenses
async function testExpenseAnalytics() {
  console.log('🧪 Test des Analytics des Dépenses');
  console.log('=====================================');

  try {
    // 1. Tester les analytics globales
    console.log('\n1. Test des analytics globales...');
    const globalResponse = await fetch(`${API_BASE_URL}/expenses/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    if (globalResponse.ok) {
      const globalData = await globalResponse.json();
      console.log('✅ Analytics globales récupérées:');
      console.log(`   - Total dépenses: ${globalData.data.total_depenses}`);
      console.log(`   - Montant total: ${globalData.data.montant_total_depenses} DH`);
      console.log(`   - Dépenses ce mois: ${globalData.data.depenses_ce_mois}`);
      console.log(`   - Projets: ${globalData.data.par_projet.length}`);
    } else {
      console.log('❌ Erreur analytics globales:', globalResponse.status);
    }

    // 2. Tester les analytics par projet (remplacez par un vrai projectId)
    console.log('\n2. Test des analytics par projet...');
    const projectId = 'YOUR_PROJECT_ID_HERE'; // Remplacez par un vrai projectId
    
    const projectResponse = await fetch(`${API_BASE_URL}/expenses/analytics/project/${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      console.log('✅ Analytics par projet récupérées:');
      console.log(`   - Total dépenses: ${projectData.data.total_depenses}`);
      console.log(`   - Montant total: ${projectData.data.montant_total_depenses} DH`);
      console.log(`   - Dépenses ce mois: ${projectData.data.depenses_ce_mois}`);
      console.log(`   - Modes de paiement:`, projectData.data.modes_paiement);
    } else {
      console.log('❌ Erreur analytics par projet:', projectResponse.status);
    }

    // 3. Tester la route de debug
    console.log('\n3. Test de la route de debug...');
    const debugResponse = await fetch(`${API_BASE_URL}/expenses/debug`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE' // Remplacez par un vrai token
      }
    });

    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Données de debug récupérées:');
      console.log(`   - Dépenses: ${debugData.data.expenses.length}`);
      console.log(`   - Projets: ${debugData.data.projects.length}`);
    } else {
      console.log('❌ Erreur route debug:', debugResponse.status);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Instructions d'utilisation
console.log('📋 Instructions pour tester:');
console.log('1. Assurez-vous que le backend est démarré sur le port 3001');
console.log('2. Remplacez YOUR_JWT_TOKEN_HERE par un vrai token JWT');
console.log('3. Remplacez YOUR_PROJECT_ID_HERE par un vrai ID de projet');
console.log('4. Exécutez: node test-expense-analytics.js');
console.log('');

// Exécuter le test si les tokens sont configurés
if (process.argv.includes('--run')) {
  testExpenseAnalytics();
} else {
  console.log('💡 Pour exécuter le test, ajoutez --run à la commande');
}
