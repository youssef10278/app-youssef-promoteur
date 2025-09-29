// Script pour créer une vente de test et reproduire le problème
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', data = null, token = null) {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (data && method !== 'GET') config.body = JSON.stringify(data);

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const result = await response.json();

    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createTestSale() {
  try {
    log('\n🔧 CRÉATION D\'UNE VENTE DE TEST', 'blue');
    log('=' .repeat(50), 'blue');

    // 1. Créer un utilisateur de test
    log('\n1. Création d\'un utilisateur de test...', 'yellow');
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      nom: 'Utilisateur Test',
      telephone: '0123456789',
      societe: 'Test Company'
    };

    const registerResult = await testEndpoint('/auth/register', 'POST', userData);
    let authToken = null;

    if (registerResult.success) {
      log('✅ Utilisateur créé avec succès', 'green');
      authToken = registerResult.data.token;
    } else if (registerResult.status === 409) {
      // Utilisateur existe déjà, se connecter
      log('ℹ️ Utilisateur existe déjà, connexion...', 'cyan');
      const loginResult = await testEndpoint('/auth/login', 'POST', {
        email: userData.email,
        password: userData.password
      });
      
      if (loginResult.success) {
        log('✅ Connexion réussie', 'green');
        authToken = loginResult.data.token;
      } else {
        log('❌ Échec de la connexion', 'red');
        return;
      }
    } else {
      log('❌ Échec de la création de l\'utilisateur', 'red');
      console.log(registerResult);
      return;
    }

    // 2. Créer un projet de test
    log('\n2. Création d\'un projet de test...', 'yellow');
    const projectData = {
      nom: 'Projet Test Valeurs',
      localisation: 'Test Location',
      societe: 'Test Company',
      surface_totale: 1000,
      nombre_lots: 10,
      nombre_appartements: 8,
      nombre_garages: 2,
      description: 'Projet pour tester les valeurs des ventes'
    };

    const projectResult = await testEndpoint('/projects', 'POST', projectData, authToken);
    
    if (!projectResult.success) {
      log('❌ Échec de la création du projet', 'red');
      console.log(projectResult);
      return;
    }

    const projectId = projectResult.data.id;
    log(`✅ Projet créé avec succès (ID: ${projectId})`, 'green');

    // 3. Créer une vente avec les valeurs que vous mentionnez (20 et 80)
    log('\n3. Création d\'une vente de test avec valeurs 20 et 80...', 'yellow');
    const saleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'A01',
      client_nom: 'Client Test',
      client_telephone: '0987654321',
      client_email: 'client@test.com',
      client_adresse: '123 Rue Test',
      surface: 100,
      prix_total: 100, // Prix total de 100 DH pour simplifier
      description: 'Vente de test pour déboguer les valeurs',
      mode_paiement: 'cheque_espece',
      avance_declare: 20, // Votre valeur de 20
      avance_non_declare: 80, // Votre valeur de 80
      avance_cheque: 50, // Répartition chèque
      avance_espece: 50  // Répartition espèce
    };

    const saleResult = await testEndpoint('/sales', 'POST', saleData, authToken);
    
    if (!saleResult.success) {
      log('❌ Échec de la création de la vente', 'red');
      console.log(saleResult);
      return;
    }

    const saleId = saleResult.data.id;
    log(`✅ Vente créée avec succès (ID: ${saleId})`, 'green');
    
    // Afficher les détails de la vente créée
    log('\n📊 DÉTAILS DE LA VENTE CRÉÉE:', 'cyan');
    log(`  Prix total: ${saleResult.data.prix_total} DH`, 'cyan');
    log(`  Avance déclarée: ${saleResult.data.avance_declare} DH`, 'cyan');
    log(`  Avance non déclarée: ${saleResult.data.avance_non_declare} DH`, 'cyan');
    log(`  Avance chèque: ${saleResult.data.avance_cheque} DH`, 'cyan');
    log(`  Avance espèce: ${saleResult.data.avance_espece} DH`, 'cyan');

    // 4. Créer un plan de paiement
    log('\n4. Création d\'un plan de paiement...', 'yellow');
    const paymentPlanData = {
      sale_id: saleId,
      numero_echeance: 1,
      date_prevue: '2024-01-15',
      montant_prevu: 50,
      description: 'Premier paiement'
    };

    const planResult = await testEndpoint('/payments/plans', 'POST', paymentPlanData, authToken);
    
    if (planResult.success) {
      log('✅ Plan de paiement créé avec succès', 'green');
    } else {
      log('❌ Échec de la création du plan de paiement', 'red');
      console.log(planResult);
    }

    // 5. Maintenant tester la récupération des données
    log('\n5. Test de récupération des données...', 'yellow');
    
    // Test de la route debug
    const debugResult = await testEndpoint('/debug-data');
    if (debugResult.success) {
      log('✅ Données debug récupérées', 'green');
      
      // Chercher notre vente
      const ourSale = debugResult.data.sales?.find(sale => sale.id === saleId);
      if (ourSale) {
        log('\n🎯 VENTE TROUVÉE DANS LA BASE:', 'green');
        log(`  Prix total: ${ourSale.prix_total} (type: ${typeof ourSale.prix_total})`, 'green');
        log(`  Avance déclarée: ${ourSale.avance_declare} (type: ${typeof ourSale.avance_declare})`, 'green');
        log(`  Avance non déclarée: ${ourSale.avance_non_declare} (type: ${typeof ourSale.avance_non_declare})`, 'green');
        
        // Calcul comme dans le frontend
        const initialAdvance = (parseFloat(ourSale.avance_declare || 0)) + (parseFloat(ourSale.avance_non_declare || 0));
        log(`  Avance totale calculée: ${initialAdvance}`, 'green');
        
        if (initialAdvance !== 100) {
          log(`  ⚠️ PROBLÈME DÉTECTÉ: Avance totale (${initialAdvance}) ≠ Valeurs attendues (100)`, 'red');
        }
      } else {
        log('❌ Vente non trouvée dans les données debug', 'red');
      }
    }

    // 6. Test de récupération via l'API normale
    log('\n6. Test via API normale...', 'yellow');
    const salesResult = await testEndpoint(`/sales/project/${projectId}`, 'GET', null, authToken);
    
    if (salesResult.success) {
      log('✅ Ventes récupérées via API normale', 'green');
      
      if (salesResult.data.data && salesResult.data.data.length > 0) {
        const sale = salesResult.data.data[0];
        log('\n🎯 VENTE VIA API NORMALE:', 'green');
        log(`  Prix total: ${sale.prix_total} (type: ${typeof sale.prix_total})`, 'green');
        log(`  Avance déclarée: ${sale.avance_declare} (type: ${typeof sale.avance_declare})`, 'green');
        log(`  Avance non déclarée: ${sale.avance_non_declare} (type: ${typeof sale.avance_non_declare})`, 'green');
      }
    } else {
      log('❌ Échec de récupération via API normale', 'red');
      console.log(salesResult);
    }

    log('\n✅ Test terminé - Vente créée pour reproduire le problème', 'green');
    log(`📝 Vous pouvez maintenant aller dans l'interface pour voir la vente du client "Client Test"`, 'cyan');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
createTestSale();
