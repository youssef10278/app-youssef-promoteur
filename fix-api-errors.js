const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const DIAGNOSTIC_URL = 'http://localhost:3002';

async function testMainAPI() {
  console.log('🧪 Test de l\'API principale (port 3001)');
  console.log('=====================================');

  try {
    // Test de base
    const healthResponse = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API principale accessible:', healthData);
    } else {
      console.log('❌ API principale inaccessible:', healthResponse.status);
      return;
    }

    // Test des routes problématiques (sans authentification pour voir l'erreur)
    console.log('\n🔍 Test des routes sans authentification:');
    
    try {
      const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`);
      console.log(`   /auth/profile: ${profileResponse.status} ${profileResponse.statusText}`);
      if (!profileResponse.ok) {
        const errorData = await profileResponse.text();
        console.log(`   Erreur: ${errorData.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   /auth/profile: Erreur de connexion - ${error.message}`);
    }

    try {
      const statsResponse = await fetch(`${API_BASE_URL}/projects/stats`);
      console.log(`   /projects/stats: ${statsResponse.status} ${statsResponse.statusText}`);
      if (!statsResponse.ok) {
        const errorData = await statsResponse.text();
        console.log(`   Erreur: ${errorData.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`   /projects/stats: Erreur de connexion - ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API principale:', error.message);
  }
}

async function testDiagnosticAPI() {
  console.log('\n🧪 Test de l\'API de diagnostic (port 3002)');
  console.log('==========================================');

  try {
    // Test de base
    const healthResponse = await fetch(`${DIAGNOSTIC_URL}/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API de diagnostic accessible:', healthData);
    } else {
      console.log('❌ API de diagnostic inaccessible:', healthResponse.status);
      return;
    }

    // Test de connexion DB
    console.log('\n🔍 Test de connexion à la base de données:');
    const dbResponse = await fetch(`${DIAGNOSTIC_URL}/test-db`);
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log('✅ Connexion DB:', dbData.message);
    } else {
      const dbError = await dbResponse.json();
      console.log('❌ Erreur DB:', dbError.message);
    }

    // Test des tables
    console.log('\n🔍 Test des tables:');
    const tablesResponse = await fetch(`${DIAGNOSTIC_URL}/test-tables`);
    if (tablesResponse.ok) {
      const tablesData = await tablesResponse.json();
      console.log('✅ Test des tables:');
      Object.entries(tablesData.data).forEach(([table, result]) => {
        if (result.success) {
          console.log(`   ✅ ${table}: ${result.count} enregistrements`);
        } else {
          console.log(`   ❌ ${table}: ${result.error}`);
        }
      });
    } else {
      const tablesError = await tablesResponse.json();
      console.log('❌ Erreur test tables:', tablesError.message);
    }

    // Test des requêtes problématiques
    console.log('\n🔍 Test des requêtes problématiques:');
    const queriesResponse = await fetch(`${DIAGNOSTIC_URL}/test-problematic-queries`);
    if (queriesResponse.ok) {
      const queriesData = await queriesResponse.json();
      console.log('✅ Test des requêtes:');
      Object.entries(queriesData.data).forEach(([query, result]) => {
        if (result.success) {
          console.log(`   ✅ ${query}: ${result.message}`);
        } else {
          console.log(`   ❌ ${query}: ${result.error}`);
        }
      });
    } else {
      const queriesError = await queriesResponse.json();
      console.log('❌ Erreur test requêtes:', queriesError.message);
    }

    // Test avec un vrai utilisateur
    console.log('\n🔍 Test avec un utilisateur réel:');
    const realUserResponse = await fetch(`${DIAGNOSTIC_URL}/test-real-user`);
    if (realUserResponse.ok) {
      const realUserData = await realUserResponse.json();
      if (realUserData.success) {
        console.log('✅ Test avec utilisateur réel:');
        console.log(`   Utilisateur ID: ${realUserData.userId}`);
        Object.entries(realUserData.data).forEach(([query, result]) => {
          if (result.success) {
            console.log(`   ✅ ${query}: ${result.message}`);
          } else {
            console.log(`   ❌ ${query}: ${result.error}`);
          }
        });
      } else {
        console.log('❌ Aucun utilisateur trouvé dans la base de données');
      }
    } else {
      const realUserError = await realUserResponse.json();
      console.log('❌ Erreur test utilisateur réel:', realUserError.message);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test de l\'API de diagnostic:', error.message);
  }
}

async function main() {
  console.log('🚀 Diagnostic des erreurs API');
  console.log('=============================');
  
  console.log('\n📋 Instructions:');
  console.log('1. Assurez-vous que le backend principal est démarré sur le port 3001');
  console.log('2. Démarrez l\'API de diagnostic: node backend/diagnostic-api.js');
  console.log('3. Exécutez ce script: node fix-api-errors.js');
  console.log('');

  await testMainAPI();
  await testDiagnosticAPI();

  console.log('\n📋 Résumé des actions recommandées:');
  console.log('1. Vérifiez la configuration de la base de données dans backend/.env');
  console.log('2. Assurez-vous que PostgreSQL est démarré et accessible');
  console.log('3. Vérifiez que les tables existent (exécutez create-tables.sql si nécessaire)');
  console.log('4. Redémarrez le backend principal après les corrections');
}

main().catch(console.error);
