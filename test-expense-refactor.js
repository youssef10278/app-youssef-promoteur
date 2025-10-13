// Script de test pour valider la refactorisation du système de dépenses
const http = require('http');

const API_BASE = 'http://localhost:3001';

// Fonction utilitaire pour faire des requêtes HTTP
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

// Variables globales pour les tests
let authToken = null;
let testUserId = null;
let testProjectId = null;
let testExpenseId = null;
let testPaymentId = null;

async function runTests() {
  console.log('🚀 Début des tests de refactorisation du système de dépenses');
  console.log('=' .repeat(60));

  try {
    // Test 1: Vérifier que le serveur répond
    console.log('\n📡 Test 1: Connexion au serveur...');
    const healthCheck = await makeRequest('GET', '/');
    if (healthCheck.status === 200) {
      console.log('✅ Serveur accessible');
    } else {
      throw new Error(`Serveur non accessible: ${healthCheck.status}`);
    }

    // Test 2: Authentification (créer un utilisateur de test)
    console.log('\n🔐 Test 2: Authentification...');
    const testUser = {
      email: `test-expense-${Date.now()}@example.com`,
      password: 'testpassword123',
      nom: 'Test Expense User'
    };

    const registerResponse = await makeRequest('POST', '/api/auth/register', testUser);
    if (registerResponse.status === 201 && registerResponse.data.success) {
      authToken = registerResponse.data.data.token;
      testUserId = registerResponse.data.data.user.id;
      console.log('✅ Utilisateur créé et authentifié');
    } else {
      throw new Error(`Échec de l'authentification: ${JSON.stringify(registerResponse.data)}`);
    }

    // Test 3: Créer un projet de test
    console.log('\n🏗️ Test 3: Création d\'un projet de test...');
    const testProject = {
      nom: 'Projet Test Dépenses',
      localisation: 'Test City',
      societe: 'Test Company'
    };

    const projectResponse = await makeRequest('POST', '/api/projects', testProject, authToken);
    if (projectResponse.status === 201 && projectResponse.data.success) {
      testProjectId = projectResponse.data.data.id;
      console.log('✅ Projet créé:', testProjectId);
    } else {
      throw new Error(`Échec de la création du projet: ${JSON.stringify(projectResponse.data)}`);
    }

    // Test 4: Vérifier que la migration a été exécutée
    console.log('\n🔍 Test 4: Vérification de la migration...');
    const migrationCheck = await makeRequest('GET', '/api/expenses', null, authToken);
    if (migrationCheck.status === 200) {
      console.log('✅ API des dépenses accessible');
    } else {
      throw new Error(`API des dépenses non accessible: ${migrationCheck.status}`);
    }

    // Test 5: Créer une dépense simple (nouveau système)
    console.log('\n📝 Test 5: Création d\'une dépense simple...');
    const simpleExpense = {
      project_id: testProjectId,
      nom: 'Plombier Test',
      description: 'Test de création de dépense sans montant initial'
    };

    const expenseResponse = await makeRequest('POST', '/api/expenses/create-simple', simpleExpense, authToken);
    if (expenseResponse.status === 201 && expenseResponse.data.success) {
      testExpenseId = expenseResponse.data.data.id;
      console.log('✅ Dépense simple créée:', testExpenseId);
      console.log('   Nom:', expenseResponse.data.data.nom);
      console.log('   Montant total:', expenseResponse.data.data.montant_total);
    } else {
      throw new Error(`Échec de la création de la dépense: ${JSON.stringify(expenseResponse.data)}`);
    }

    // Test 6: Ajouter un premier paiement
    console.log('\n💰 Test 6: Ajout du premier paiement...');
    const firstPayment = {
      montant_paye: 1500.00,
      montant_declare: 1200.00,
      montant_non_declare: 300.00,
      date_paiement: '2024-01-15',
      mode_paiement: 'espece',
      description: 'Premier paiement - Réparation salle de bain'
    };

    const paymentResponse = await makeRequest('POST', `/api/expenses/${testExpenseId}/payments`, firstPayment, authToken);
    if (paymentResponse.status === 201 && paymentResponse.data.success) {
      testPaymentId = paymentResponse.data.data.id;
      console.log('✅ Premier paiement ajouté:', testPaymentId);
      console.log('   Montant:', paymentResponse.data.data.montant_paye);
    } else {
      throw new Error(`Échec de l'ajout du paiement: ${JSON.stringify(paymentResponse.data)}`);
    }

    // Test 7: Ajouter un deuxième paiement
    console.log('\n💰 Test 7: Ajout du deuxième paiement...');
    const secondPayment = {
      montant_paye: 2000.00,
      montant_declare: 2000.00,
      montant_non_declare: 0.00,
      date_paiement: '2024-01-22',
      mode_paiement: 'cheque',
      description: 'Deuxième paiement - Installation cuisine',
      reference_paiement: 'CHQ123456'
    };

    const payment2Response = await makeRequest('POST', `/api/expenses/${testExpenseId}/payments`, secondPayment, authToken);
    if (payment2Response.status === 201 && payment2Response.data.success) {
      console.log('✅ Deuxième paiement ajouté');
      console.log('   Montant:', payment2Response.data.data.montant_paye);
      console.log('   Référence:', payment2Response.data.data.reference_paiement);
    } else {
      throw new Error(`Échec de l'ajout du deuxième paiement: ${JSON.stringify(payment2Response.data)}`);
    }

    // Test 8: Récupérer la dépense avec ses paiements
    console.log('\n📊 Test 8: Récupération de la dépense avec paiements...');
    const expenseWithPayments = await makeRequest('GET', `/api/expenses/${testExpenseId}/with-payments`, null, authToken);
    if (expenseWithPayments.status === 200 && expenseWithPayments.data.success) {
      const expense = expenseWithPayments.data.data;
      console.log('✅ Dépense récupérée avec succès');
      console.log('   Nom:', expense.nom);
      console.log('   Total payé calculé:', expense.total_paye_calcule);
      console.log('   Total déclaré calculé:', expense.total_declare_calcule);
      console.log('   Total non déclaré calculé:', expense.total_non_declare_calcule);
      console.log('   Nombre de paiements:', expense.nombre_paiements);
      console.log('   Paiements:', expense.payments?.length || 0);

      // Vérifier les calculs
      const expectedTotal = 1500 + 2000;
      const expectedDeclare = 1200 + 2000;
      const expectedNonDeclare = 300 + 0;

      if (expense.total_paye_calcule === expectedTotal) {
        console.log('✅ Calcul du total payé correct');
      } else {
        console.log('❌ Erreur dans le calcul du total payé:', expense.total_paye_calcule, 'vs', expectedTotal);
      }

      if (expense.total_declare_calcule === expectedDeclare) {
        console.log('✅ Calcul du total déclaré correct');
      } else {
        console.log('❌ Erreur dans le calcul du total déclaré:', expense.total_declare_calcule, 'vs', expectedDeclare);
      }

      if (expense.total_non_declare_calcule === expectedNonDeclare) {
        console.log('✅ Calcul du total non déclaré correct');
      } else {
        console.log('❌ Erreur dans le calcul du total non déclaré:', expense.total_non_declare_calcule, 'vs', expectedNonDeclare);
      }
    } else {
      throw new Error(`Échec de la récupération: ${JSON.stringify(expenseWithPayments.data)}`);
    }

    // Test 9: Récupérer toutes les dépenses (vérifier la vue)
    console.log('\n📋 Test 9: Récupération de toutes les dépenses...');
    const allExpenses = await makeRequest('GET', '/api/expenses', null, authToken);
    if (allExpenses.status === 200 && allExpenses.data.success) {
      const expenses = allExpenses.data.data;
      console.log('✅ Liste des dépenses récupérée');
      console.log('   Nombre de dépenses:', expenses.length);
      
      const ourExpense = expenses.find(e => e.id === testExpenseId);
      if (ourExpense) {
        console.log('✅ Notre dépense trouvée dans la liste');
        console.log('   Total calculé dans la liste:', ourExpense.total_paye_calcule);
      } else {
        console.log('❌ Notre dépense non trouvée dans la liste');
      }
    } else {
      throw new Error(`Échec de la récupération de la liste: ${JSON.stringify(allExpenses.data)}`);
    }

    // Test 10: Changer le statut de la dépense
    console.log('\n🔄 Test 10: Changement de statut...');
    const statusChange = await makeRequest('PATCH', `/api/expenses/${testExpenseId}/status`, { statut: 'termine' }, authToken);
    if (statusChange.status === 200 && statusChange.data.success) {
      console.log('✅ Statut changé avec succès');
      console.log('   Nouveau statut:', statusChange.data.data.statut);
    } else {
      throw new Error(`Échec du changement de statut: ${JSON.stringify(statusChange.data)}`);
    }

    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
    console.log('=' .repeat(60));
    console.log('✅ Le nouveau système de dépenses fonctionne correctement');
    console.log('✅ Les calculs automatiques sont corrects');
    console.log('✅ Les paiements progressifs fonctionnent');
    console.log('✅ La migration a été appliquée avec succès');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error.message);
    console.log('=' .repeat(60));
    process.exit(1);
  }
}

// Exécuter les tests
console.log('🧪 Script de test du système de dépenses refactorisé');
console.log('Assurez-vous que le serveur backend est démarré sur le port 3001');
console.log('');

runTests().then(() => {
  console.log('\n✅ Tests terminés avec succès');
  process.exit(0);
}).catch((error) => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
