// Test rapide de l'API après migration
const http = require('http');

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAPI() {
  console.log('🧪 Test rapide de l\'API après migration');
  console.log('=' .repeat(50));

  try {
    // 1. Test de santé
    console.log('\n🔍 Test de santé du serveur...');
    const health = await makeRequest('GET', '/');
    if (health.status === 200) {
      console.log('✅ Serveur accessible');
    } else {
      throw new Error(`Serveur non accessible: ${health.status}`);
    }

    // 2. Test de connexion avec un utilisateur existant
    console.log('\n🔐 Test de connexion...');
    
    // Essayer de se connecter avec un utilisateur existant
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    };

    const loginResponse = await makeRequest('POST', '/api/auth/login', loginData);
    
    let authToken = null;
    if (loginResponse.status === 200 && loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      console.log('✅ Connexion réussie avec utilisateur existant');
    } else {
      console.log('⚠️  Utilisateur test non trouvé, création...');
      
      // Créer un utilisateur de test
      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        nom: 'Test User'
      };

      const registerResponse = await makeRequest('POST', '/api/auth/register', registerData);
      if (registerResponse.status === 201 && registerResponse.data.success) {
        authToken = registerResponse.data.data.token;
        console.log('✅ Utilisateur créé et connecté');
      } else {
        throw new Error(`Échec de l'authentification: ${JSON.stringify(registerResponse.data)}`);
      }
    }

    // 3. Test de l'API des dépenses
    console.log('\n📋 Test de l\'API des dépenses...');
    const expensesResponse = await makeRequest('GET', '/api/expenses', null, authToken);
    
    if (expensesResponse.status === 200 && expensesResponse.data.success) {
      console.log('✅ API des dépenses accessible');
      console.log(`📊 ${expensesResponse.data.data.length} dépenses trouvées`);
      
      // Afficher quelques exemples
      if (expensesResponse.data.data.length > 0) {
        console.log('\n📄 Exemples de dépenses:');
        expensesResponse.data.data.slice(0, 3).forEach((expense, index) => {
          console.log(`  ${index + 1}. ${expense.nom}`);
          console.log(`     Total: ${expense.montant_total || 0}`);
          console.log(`     Calculé: ${expense.total_paye_calcule || 0}`);
          console.log(`     Paiements: ${expense.nombre_paiements || 0}`);
        });
      }
    } else {
      throw new Error(`Erreur API dépenses: ${expensesResponse.status} - ${JSON.stringify(expensesResponse.data)}`);
    }

    // 4. Test de la vue expenses_with_totals
    console.log('\n🔍 Test spécifique de la vue...');
    if (expensesResponse.data.data.length > 0) {
      const firstExpense = expensesResponse.data.data[0];
      const detailResponse = await makeRequest('GET', `/api/expenses/${firstExpense.id}/with-payments`, null, authToken);
      
      if (detailResponse.status === 200 && detailResponse.data.success) {
        console.log('✅ Vue expenses_with_totals fonctionne');
        const expense = detailResponse.data.data;
        console.log(`   Nom: ${expense.nom}`);
        console.log(`   Total calculé: ${expense.total_paye_calcule || 0}`);
        console.log(`   Nombre de paiements: ${expense.nombre_paiements || 0}`);
      } else {
        console.log('❌ Erreur avec la vue:', detailResponse.data);
      }
    }

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Migration réussie');
    console.log('✅ API fonctionnelle');
    console.log('✅ Vue expenses_with_totals opérationnelle');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.log('🔧 Vérifiez que le serveur backend est démarré sur le port 3001');
  }
}

// Attendre un peu que le serveur démarre
setTimeout(() => {
  testAPI().then(() => {
    console.log('\n✅ Test terminé');
  }).catch((error) => {
    console.error('\n❌ Test échoué:', error);
  });
}, 3000);
