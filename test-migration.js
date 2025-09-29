// Script de test pour vérifier la migration de Supabase vers PostgreSQL
import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null, token = null, fullUrl = null) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const url = fullUrl || `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, config);
    const result = await response.json();

    if (response.ok) {
      log(`✅ ${method} ${endpoint} - SUCCESS`, 'green');
      return { success: true, data: result };
    } else {
      log(`❌ ${method} ${endpoint} - ERROR: ${result.error || response.statusText}`, 'red');
      return { success: false, error: result.error || response.statusText };
    }
  } catch (error) {
    log(`❌ ${method} ${fullUrl || endpoint} - NETWORK ERROR: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n🚀 Test de Migration Supabase → PostgreSQL + API', 'bold');
  log('=' .repeat(60), 'blue');

  // Test 1: Vérifier que le serveur répond
  log('\n📡 Test 1: Connexion au serveur...', 'yellow');
  const healthCheck = await testEndpoint('', 'GET', null, null, 'http://localhost:3001/health');
  if (!healthCheck.success) {
    log('\n❌ Le serveur backend n\'est pas accessible. Assurez-vous qu\'il est démarré.', 'red');
    log('💡 Exécutez: cd backend && npm run dev', 'yellow');
    return;
  }

  // Test 2: Test d'inscription
  log('\n👤 Test 2: Inscription d\'un utilisateur test...', 'yellow');
  const testUser = {
    email: 'test@migration.com',
    password: 'TestMigration123!',
    nom: 'Test Migration',
    telephone: '0612345678',
    societe: 'Test Company'
  };

  const registerResult = await testEndpoint('/auth/register', 'POST', testUser);
  let authToken = null;

  if (registerResult.success) {
    authToken = registerResult.data.token;
    log('✅ Inscription réussie', 'green');
  } else {
    // Essayer de se connecter si l'utilisateur existe déjà
    log('ℹ️  Utilisateur existe déjà, tentative de connexion...', 'blue');
    const loginResult = await testEndpoint('/auth/login', 'POST', {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResult.success) {
      authToken = loginResult.data.token;
      log('✅ Connexion réussie', 'green');
    } else {
      log('❌ Impossible de s\'authentifier', 'red');
      return;
    }
  }

  // Test 3: Vérification du token
  log('\n🔐 Test 3: Vérification du token...', 'yellow');
  await testEndpoint('/auth/verify', 'GET', null, authToken);

  // Test 4: Récupération du profil
  log('\n👤 Test 4: Récupération du profil...', 'yellow');
  await testEndpoint('/auth/profile', 'GET', null, authToken);

  // Test 5: Test des projets
  log('\n🏗️  Test 5: Gestion des projets...', 'yellow');
  
  // Créer un projet test
  const testProject = {
    nom: 'Projet Test Migration',
    description: 'Projet créé pour tester la migration',
    adresse: '123 Rue Test',
    ville: 'Casablanca',
    code_postal: '20000',
    prix_total: 1000000,
    nombre_lots: 10,
    date_debut: '2024-01-01',
    date_fin_prevue: '2024-12-31'
  };

  const createProjectResult = await testEndpoint('/projects', 'POST', testProject, authToken);
  let projectId = null;

  if (createProjectResult.success) {
    projectId = createProjectResult.data.id;
    log('✅ Projet créé avec succès', 'green');
  }

  // Lister les projets
  await testEndpoint('/projects', 'GET', null, authToken);

  // Test 6: Test des ventes (si on a un projet)
  if (projectId) {
    log('\n💰 Test 6: Gestion des ventes...', 'yellow');
    
    const testSale = {
      projet_id: projectId,
      client_nom: 'Dupont',
      client_prenom: 'Jean',
      client_telephone: '0612345678',
      client_email: 'jean.dupont@test.com',
      lot_numero: 'A001',
      prix_vente: 100000,
      date_vente: '2024-01-15'
    };

    const createSaleResult = await testEndpoint('/sales', 'POST', testSale, authToken);
    let saleId = null;

    if (createSaleResult.success) {
      saleId = createSaleResult.data.id;
      log('✅ Vente créée avec succès', 'green');
    }

    // Lister les ventes
    await testEndpoint('/sales', 'GET', null, authToken);

    // Test 7: Test des plans de paiement (si on a une vente)
    if (saleId) {
      log('\n💳 Test 7: Gestion des paiements...', 'yellow');
      
      const testPaymentPlan = {
        vente_id: saleId,
        montant_total: 100000,
        nombre_echeances: 12,
        date_premiere_echeance: '2024-02-01',
        frequence: 'mensuel'
      };

      await testEndpoint('/payments/plans', 'POST', testPaymentPlan, authToken);
      await testEndpoint(`/payments/plans/sale/${saleId}`, 'GET', null, authToken);
    }
  }

  // Test 8: Test des statistiques
  log('\n📊 Test 8: Statistiques...', 'yellow');
  await testEndpoint('/payments/stats/summary', 'GET', null, authToken);

  // Test 9: Test des chèques
  log('\n🏦 Test 9: Gestion des chèques...', 'yellow');
  
  const testCheck = {
    numero_cheque: 'CHK001',
    montant: 50000,
    date_emission: '2024-01-20',
    banque: 'Banque Test',
    emetteur_nom: 'Martin',
    emetteur_prenom: 'Pierre'
  };

  await testEndpoint('/checks', 'POST', testCheck, authToken);
  await testEndpoint('/checks', 'GET', null, authToken);

  // Test 10: Test des dépenses (si on a un projet)
  if (projectId) {
    log('\n💸 Test 10: Gestion des dépenses...', 'yellow');
    
    const testExpense = {
      projet_id: projectId,
      description: 'Achat matériel test',
      montant: 5000,
      date_depense: '2024-01-10',
      categorie: 'materiel',
      fournisseur: 'Fournisseur Test'
    };

    await testEndpoint('/expenses', 'POST', testExpense, authToken);
    await testEndpoint('/expenses', 'GET', null, authToken);
  }

  log('\n🎉 Tests de migration terminés !', 'bold');
  log('=' .repeat(60), 'blue');
  log('\n✅ Si tous les tests sont verts, la migration est réussie !', 'green');
  log('🚀 Vous pouvez maintenant déployer sur Railway.', 'blue');
}

// Exécuter les tests
runTests().catch(error => {
  log(`\n💥 Erreur lors des tests: ${error.message}`, 'red');
  process.exit(1);
});
