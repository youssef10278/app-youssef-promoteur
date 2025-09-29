const fetch = require('node-fetch');

// Configuration
const API_BASE_URL = 'http://localhost:3001/api';
const TEST_USER = {
  email: 'test@example.com',
  password: 'password123'
};

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

// Fonction pour tester un endpoint
async function testEndpoint(endpoint, method = 'GET', data = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test principal
async function testPaymentUpdate() {
  log('🧪 TEST DE MODIFICATION DES PAIEMENTS', 'blue');
  log('=====================================\n', 'blue');

  try {
    // 1. Connexion
    log('📝 Étape 1: Connexion...', 'cyan');
    const loginResult = await testEndpoint('/auth/login', 'POST', TEST_USER);
    
    if (!loginResult.success) {
      log('❌ Échec de la connexion', 'red');
      console.log('Détails:', loginResult);
      return;
    }
    
    const authToken = loginResult.data.data.token;
    log('✅ Connexion réussie', 'green');

    // 2. Récupérer les projets
    log('\n📂 Étape 2: Récupération des projets...', 'cyan');
    const projectsResult = await testEndpoint('/projects', 'GET', null, authToken);
    
    if (!projectsResult.success || !projectsResult.data.data.length) {
      log('❌ Aucun projet trouvé', 'red');
      return;
    }
    
    const project = projectsResult.data.data[0];
    log(`✅ Projet trouvé: ${project.nom}`, 'green');

    // 3. Récupérer les ventes du projet
    log('\n💰 Étape 3: Récupération des ventes...', 'cyan');
    const salesResult = await testEndpoint(`/sales/project/${project.id}`, 'GET', null, authToken);
    
    if (!salesResult.success || !salesResult.data.length) {
      log('❌ Aucune vente trouvée', 'red');
      return;
    }
    
    const sale = salesResult.data[0];
    log(`✅ Vente trouvée: ${sale.client_nom} - ${sale.unite_numero}`, 'green');

    // 4. Récupérer les plans de paiement
    log('\n📋 Étape 4: Récupération des plans de paiement...', 'cyan');
    const plansResult = await testEndpoint(`/payments/plans/sale/${sale.id}`, 'GET', null, authToken);
    
    if (!plansResult.success || !plansResult.data.data.length) {
      log('❌ Aucun plan de paiement trouvé', 'red');
      return;
    }
    
    const paymentPlan = plansResult.data.data[0];
    log(`✅ Plan de paiement trouvé: ${paymentPlan.montant_paye} DH`, 'green');
    log(`   - ID: ${paymentPlan.id}`, 'cyan');
    log(`   - Montant actuel: ${paymentPlan.montant_paye} DH`, 'cyan');
    log(`   - Mode: ${paymentPlan.mode_paiement}`, 'cyan');

    // 5. Modifier le paiement
    log('\n✏️  Étape 5: Modification du paiement...', 'cyan');
    
    const originalAmount = parseFloat(paymentPlan.montant_paye || 0);
    const newAmount = originalAmount + 1000; // Ajouter 1000 DH
    
    const updateData = {
      montant_paye: newAmount,
      montant_prevu: newAmount,
      montant_declare: newAmount * 0.7,
      montant_non_declare: newAmount * 0.3,
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      montant_espece: newAmount,
      montant_cheque: 0,
      notes: `Paiement modifié par test le ${new Date().toLocaleString()}`
    };

    log(`📊 Données de modification:`, 'cyan');
    log(`   - Ancien montant: ${originalAmount} DH`, 'cyan');
    log(`   - Nouveau montant: ${newAmount} DH`, 'cyan');
    log(`   - Déclaré: ${updateData.montant_declare} DH`, 'cyan');
    log(`   - Non déclaré: ${updateData.montant_non_declare} DH`, 'cyan');

    const updateResult = await testEndpoint(`/payments/plans/${paymentPlan.id}`, 'PUT', updateData, authToken);
    
    if (!updateResult.success) {
      log('❌ Échec de la modification', 'red');
      console.log('Détails:', updateResult);
      return;
    }
    
    log('✅ Modification réussie', 'green');
    
    // 6. Vérifier la modification
    log('\n🔍 Étape 6: Vérification de la modification...', 'cyan');
    const verifyResult = await testEndpoint(`/payments/plans/sale/${sale.id}`, 'GET', null, authToken);
    
    if (!verifyResult.success) {
      log('❌ Échec de la vérification', 'red');
      return;
    }
    
    const updatedPlan = verifyResult.data.data.find(p => p.id === paymentPlan.id);
    
    if (!updatedPlan) {
      log('❌ Plan de paiement non trouvé après modification', 'red');
      return;
    }
    
    log('📊 Résultats de la vérification:', 'cyan');
    log(`   - Montant payé: ${updatedPlan.montant_paye} DH (attendu: ${newAmount})`, 'cyan');
    log(`   - Montant déclaré: ${updatedPlan.montant_declare} DH`, 'cyan');
    log(`   - Montant non déclaré: ${updatedPlan.montant_non_declare} DH`, 'cyan');
    log(`   - Mode de paiement: ${updatedPlan.mode_paiement}`, 'cyan');
    log(`   - Notes: ${updatedPlan.notes}`, 'cyan');
    
    // Vérifier que les montants correspondent
    const actualAmount = parseFloat(updatedPlan.montant_paye);
    const actualDeclare = parseFloat(updatedPlan.montant_declare || 0);
    const actualNonDeclare = parseFloat(updatedPlan.montant_non_declare || 0);
    
    if (Math.abs(actualAmount - newAmount) < 0.01) {
      log('✅ Montant payé correctement mis à jour', 'green');
    } else {
      log(`❌ Montant payé incorrect: ${actualAmount} au lieu de ${newAmount}`, 'red');
    }
    
    if (Math.abs(actualDeclare - updateData.montant_declare) < 0.01) {
      log('✅ Montant déclaré correctement mis à jour', 'green');
    } else {
      log(`❌ Montant déclaré incorrect: ${actualDeclare} au lieu de ${updateData.montant_declare}`, 'red');
    }
    
    if (Math.abs(actualNonDeclare - updateData.montant_non_declare) < 0.01) {
      log('✅ Montant non déclaré correctement mis à jour', 'green');
    } else {
      log(`❌ Montant non déclaré incorrect: ${actualNonDeclare} au lieu de ${updateData.montant_non_declare}`, 'red');
    }

    log('\n🎉 Test de modification des paiements terminé avec succès !', 'green');

  } catch (error) {
    log(`❌ Erreur lors du test: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
if (require.main === module) {
  testPaymentUpdate();
}

module.exports = { testPaymentUpdate };
