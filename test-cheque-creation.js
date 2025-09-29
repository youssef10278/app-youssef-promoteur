// Test pour vérifier que les chèques sont créés automatiquement lors de la création d'une vente
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

async function testChequeCreation() {
  try {
    log('\n💳 TEST DE CRÉATION AUTOMATIQUE DES CHÈQUES', 'blue');
    log('=' .repeat(60), 'blue');

    // 1. Créer un utilisateur de test
    log('\n1. Création d\'un utilisateur de test...', 'yellow');
    const userData = {
      email: 'test-cheque@example.com',
      password: 'password123',
      nom: 'Test Chèque',
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
      nom: 'Projet Test Chèques',
      localisation: 'Test Location',
      societe: 'Test Company',
      surface_totale: 1000,
      nombre_lots: 10,
      nombre_appartements: 8,
      nombre_garages: 2,
      description: 'Projet pour tester la création automatique des chèques'
    };

    const projectResult = await testEndpoint('/projects', 'POST', projectData, authToken);
    
    if (!projectResult.success) {
      log('❌ Échec de la création du projet', 'red');
      console.log(projectResult);
      return;
    }

    const projectId = projectResult.data.id;
    log(`✅ Projet créé avec succès (ID: ${projectId})`, 'green');

    // 3. Créer une vente avec mode de paiement chèque
    log('\n3. Création d\'une vente avec paiement par chèque...', 'yellow');
    const saleData = {
      project_id: projectId,
      type_propriete: 'appartement',
      unite_numero: 'A01',
      client_nom: 'Client Test Chèque',
      client_telephone: '0987654321',
      client_email: 'client-cheque@test.com',
      client_adresse: '123 Rue Test',
      surface: 100,
      prix_total: 500000, // 500,000 DH
      description: 'Vente de test pour chèque automatique',
      mode_paiement: 'cheque',
      avance_declare: 100000, // 100,000 DH déclaré
      avance_non_declare: 50000, // 50,000 DH non déclaré
      avance_cheque: 150000, // 150,000 DH en chèque
      avance_espece: 0
    };

    log('📋 Données de la vente:', 'cyan');
    log(`  - Prix total: ${saleData.prix_total} DH`, 'cyan');
    log(`  - Mode de paiement: ${saleData.mode_paiement}`, 'cyan');
    log(`  - Avance chèque: ${saleData.avance_cheque} DH`, 'cyan');

    const saleResult = await testEndpoint('/sales', 'POST', saleData, authToken);
    
    if (!saleResult.success) {
      log('❌ Échec de la création de la vente', 'red');
      console.log(saleResult);
      return;
    }

    const saleId = saleResult.data.id;
    log(`✅ Vente créée avec succès (ID: ${saleId})`, 'green');

    // 4. Vérifier que le chèque a été créé automatiquement
    log('\n4. Vérification de la création automatique du chèque...', 'yellow');
    
    // Attendre un peu pour que la création soit terminée
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const checksResult = await testEndpoint('/checks', 'GET', null, authToken);
    
    if (checksResult.success) {
      const checks = checksResult.data.data || [];
      const saleChecks = checks.filter(check => check.sale_id === saleId);
      
      log(`📊 Résultats de la vérification:`, 'cyan');
      log(`  - Total chèques dans le système: ${checks.length}`, 'cyan');
      log(`  - Chèques liés à cette vente: ${saleChecks.length}`, 'cyan');
      
      if (saleChecks.length > 0) {
        log('\n🎉 SUCCÈS: Chèque créé automatiquement!', 'green');
        
        saleChecks.forEach((check, index) => {
          log(`\n  💳 CHÈQUE ${index + 1}:`, 'green');
          log(`    - ID: ${check.id}`, 'green');
          log(`    - Type: ${check.type_cheque}`, 'green');
          log(`    - Montant: ${check.montant} DH`, 'green');
          log(`    - Numéro: ${check.numero_cheque}`, 'green');
          log(`    - Émetteur: ${check.nom_emetteur}`, 'green');
          log(`    - Bénéficiaire: ${check.nom_beneficiaire}`, 'green');
          log(`    - Statut: ${check.statut}`, 'green');
          log(`    - Description: ${check.description}`, 'green');
        });
        
        // Vérifier que le montant correspond
        const totalChequeAmount = saleChecks.reduce((sum, check) => sum + parseFloat(check.montant), 0);
        if (totalChequeAmount === saleData.avance_cheque) {
          log(`\n✅ MONTANT CORRECT: ${totalChequeAmount} DH = ${saleData.avance_cheque} DH`, 'green');
        } else {
          log(`\n❌ MONTANT INCORRECT: ${totalChequeAmount} DH ≠ ${saleData.avance_cheque} DH`, 'red');
        }
        
      } else {
        log('\n❌ ÉCHEC: Aucun chèque créé automatiquement', 'red');
        log('🔍 Vérifiez que la logique de création automatique fonctionne', 'yellow');
      }
    } else {
      log('❌ Erreur lors de la récupération des chèques', 'red');
      console.log(checksResult);
    }

    // 5. Test avec mode de paiement mixte (chèque + espèce)
    log('\n5. Test avec mode de paiement mixte...', 'yellow');
    const saleDataMixte = {
      project_id: projectId,
      type_propriete: 'garage',
      unite_numero: 'G01',
      client_nom: 'Client Test Mixte',
      client_telephone: '0987654322',
      client_email: 'client-mixte@test.com',
      client_adresse: '456 Rue Test',
      surface: 25,
      prix_total: 200000, // 200,000 DH
      description: 'Vente de test pour paiement mixte',
      mode_paiement: 'cheque_espece',
      avance_declare: 50000, // 50,000 DH déclaré
      avance_non_declare: 30000, // 30,000 DH non déclaré
      avance_cheque: 60000, // 60,000 DH en chèque
      avance_espece: 20000 // 20,000 DH en espèce
    };

    const saleMixteResult = await testEndpoint('/sales', 'POST', saleDataMixte, authToken);
    
    if (saleMixteResult.success) {
      const saleMixteId = saleMixteResult.data.id;
      log(`✅ Vente mixte créée avec succès (ID: ${saleMixteId})`, 'green');
      
      // Vérifier les chèques pour la vente mixte
      await new Promise(resolve => setTimeout(resolve, 1000));
      const checksMixteResult = await testEndpoint('/checks', 'GET', null, authToken);
      
      if (checksMixteResult.success) {
        const allChecks = checksMixteResult.data.data || [];
        const mixteChecks = allChecks.filter(check => check.sale_id === saleMixteId);
        
        if (mixteChecks.length > 0) {
          log(`✅ Chèque créé pour la vente mixte (${mixteChecks.length} chèque(s))`, 'green');
        } else {
          log(`❌ Aucun chèque créé pour la vente mixte`, 'red');
        }
      }
    }

    // 6. Instructions pour vérifier dans l'interface
    log('\n📝 INSTRUCTIONS POUR VÉRIFIER DANS L\'INTERFACE:', 'blue');
    log('=' .repeat(60), 'blue');
    log('1. Allez dans l\'interface web (http://localhost:5173)', 'cyan');
    log('2. Connectez-vous avec les identifiants de test', 'cyan');
    log('3. Allez dans "Gestion des Chèques"', 'cyan');
    log('4. Vérifiez la section "Chèques Reçus"', 'cyan');
    log('5. Vous devriez voir les chèques créés automatiquement', 'cyan');
    log('6. Créez une nouvelle vente avec paiement par chèque', 'cyan');
    log('7. Vérifiez que le chèque apparaît immédiatement dans la gestion des chèques', 'cyan');

    log('\n✅ Test de création automatique des chèques terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
testChequeCreation();
