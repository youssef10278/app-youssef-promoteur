// Test pour vérifier que l'enregistrement des paiements fonctionne
import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
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

async function testPaymentCreation() {
  try {
    log('\n💰 TEST D\'ENREGISTREMENT DES PAIEMENTS', 'blue');
    log('=' .repeat(50), 'blue');

    // 1. Créer un utilisateur de test
    log('\n1. Création d\'un utilisateur de test...', 'yellow');
    const userData = {
      email: 'test-payment@example.com',
      password: 'password123',
      nom: 'Test Payment',
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
      nom: 'Projet Test Paiements',
      localisation: 'Test Location',
      societe: 'Test Company',
      surface_totale: 1000,
      nombre_lots: 10,
      nombre_appartements: 8,
      nombre_garages: 2,
      description: 'Projet pour tester les paiements'
    };

    const projectResult = await testEndpoint('/projects', 'POST', projectData, authToken);
    
    if (!projectResult.success) {
      log('❌ Échec de la création du projet', 'red');
      console.log(projectResult);
      return;
    }

    const projectId = projectResult.data.id;
    log(`✅ Projet créé avec succès (ID: ${projectId})`, 'green');

    // 3. Créer une vente de test
    log('\n3. Création d\'une vente de test...', 'yellow');
    const saleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'A01',
      client_nom: 'Client Test Payment',
      client_telephone: '0987654321',
      client_email: 'client-payment@test.com',
      client_adresse: '123 Rue Test',
      surface: 100,
      prix_total: 500000, // 500,000 DH
      description: 'Vente de test pour paiements',
      mode_paiement: 'espece',
      avance_declare: 100000, // 100,000 DH déclaré
      avance_non_declare: 50000, // 50,000 DH non déclaré
      avance_cheque: 0,
      avance_espece: 150000 // 150,000 DH en espèce
    };

    const saleResult = await testEndpoint('/sales', 'POST', saleData, authToken);
    
    if (!saleResult.success) {
      log('❌ Échec de la création de la vente', 'red');
      console.log(saleResult);
      return;
    }

    const saleId = saleResult.data.id;
    log(`✅ Vente créée avec succès (ID: ${saleId})`, 'green');
    log(`  Prix total: ${saleData.prix_total} DH`, 'cyan');
    log(`  Avance payée: ${saleData.avance_declare + saleData.avance_non_declare} DH`, 'cyan');
    log(`  Montant restant: ${saleData.prix_total - (saleData.avance_declare + saleData.avance_non_declare)} DH`, 'cyan');

    // 4. Test d'enregistrement d'un nouveau paiement
    log('\n4. Test d\'enregistrement d\'un nouveau paiement...', 'yellow');
    
    const paymentData = {
      montant_paye: 100000, // 100,000 DH
      montant_declare: 80000, // 80,000 DH déclaré
      montant_non_declare: 20000, // 20,000 DH non déclaré
      date_paiement: '2024-01-15',
      mode_paiement: 'espece',
      montant_espece: 100000,
      montant_cheque: 0,
      notes: 'Deuxième paiement du client'
    };

    log('📋 Données du paiement:', 'cyan');
    log(`  - Montant: ${paymentData.montant_paye} DH`, 'cyan');
    log(`  - Mode: ${paymentData.mode_paiement}`, 'cyan');
    log(`  - Date: ${paymentData.date_paiement}`, 'cyan');

    // Simuler l'appel du service frontend
    const addPaymentEndpoint = `/sales/${saleId}/payments`; // Endpoint fictif pour le test
    
    // En réalité, nous devons tester via le service SalesServiceNew.addPayment
    // Mais pour ce test, nous allons tester les étapes individuelles
    
    // Étape 1: Obtenir les plans existants
    log('\n  📊 Étape 1: Vérification des plans existants...', 'cyan');
    const existingPlansResult = await testEndpoint(`/payments/plans/sale/${saleId}`, 'GET', null, authToken);
    
    if (existingPlansResult.success) {
      const existingPlans = existingPlansResult.data || [];
      log(`    ✅ Plans existants récupérés: ${existingPlans.length}`, 'green');
      
      // Étape 2: Créer un nouveau plan de paiement
      log('\n  📋 Étape 2: Création du plan de paiement...', 'cyan');
      const nextEcheanceNumber = existingPlans.length + 1;
      
      const planData = {
        sale_id: saleId,
        numero_echeance: nextEcheanceNumber,
        date_prevue: paymentData.date_paiement,
        montant_prevu: paymentData.montant_paye,
        description: paymentData.notes || `Paiement #${nextEcheanceNumber}`
      };
      
      const planResult = await testEndpoint('/payments/plans', 'POST', planData, authToken);
      
      if (planResult.success) {
        const paymentPlan = planResult.data;
        log(`    ✅ Plan de paiement créé (ID: ${paymentPlan.id})`, 'green');
        
        // Étape 3: Enregistrer le paiement
        log('\n  💰 Étape 3: Enregistrement du paiement...', 'cyan');
        const paymentRecord = {
          montant_paye: paymentData.montant_paye,
          mode_paiement: paymentData.mode_paiement,
          montant_espece: paymentData.montant_espece || 0,
          montant_cheque: paymentData.montant_cheque || 0,
          notes: paymentData.notes || `Paiement de ${paymentData.montant_paye} DH`
        };
        
        const payResult = await testEndpoint(`/payments/pay/${paymentPlan.id}`, 'POST', paymentRecord, authToken);
        
        if (payResult.success) {
          log(`    ✅ Paiement enregistré avec succès`, 'green');
          log(`    💰 Montant: ${paymentData.montant_paye} DH`, 'green');
          
          // Vérifier le plan mis à jour
          const updatedPlansResult = await testEndpoint(`/payments/plans/sale/${saleId}`, 'GET', null, authToken);
          if (updatedPlansResult.success) {
            const updatedPlans = updatedPlansResult.data || [];
            const ourPlan = updatedPlans.find(plan => plan.id === paymentPlan.id);
            
            if (ourPlan) {
              log(`    📊 Plan mis à jour:`, 'green');
              log(`      - Montant prévu: ${ourPlan.montant_prevu} DH`, 'green');
              log(`      - Montant payé: ${ourPlan.montant_paye} DH`, 'green');
              log(`      - Statut: ${ourPlan.statut}`, 'green');
            }
          }
          
        } else {
          log(`    ❌ Échec de l'enregistrement du paiement`, 'red');
          console.log(payResult);
        }
        
      } else {
        log(`    ❌ Échec de la création du plan de paiement`, 'red');
        console.log(planResult);
      }
      
    } else {
      log(`    ❌ Échec de la récupération des plans existants`, 'red');
      console.log(existingPlansResult);
    }

    // 5. Instructions pour tester dans l'interface
    log('\n📝 INSTRUCTIONS POUR TESTER DANS L\'INTERFACE:', 'blue');
    log('=' .repeat(50), 'blue');
    log('1. Allez dans l\'interface web (http://localhost:5173)', 'cyan');
    log('2. Connectez-vous et sélectionnez un projet', 'cyan');
    log('3. Allez dans la page "Ventes"', 'cyan');
    log('4. Cliquez sur "Ajouter un paiement" pour une vente', 'cyan');
    log('5. Remplissez le formulaire de paiement', 'cyan');
    log('6. Cliquez sur "Enregistrer le paiement"', 'cyan');
    log('7. Vérifiez que le paiement est enregistré sans erreur', 'cyan');

    log('\n✅ Test d\'enregistrement des paiements terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
testPaymentCreation();
