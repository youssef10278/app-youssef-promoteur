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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
    log(`📡 ${method} ${url}`, 'cyan');
    if (data) {
      log(`📤 Données envoyées: ${JSON.stringify(data, null, 2)}`, 'cyan');
    }

    const response = await fetch(url, options);
    const result = await response.json();
    
    log(`📥 Status: ${response.status}`, response.ok ? 'green' : 'red');
    log(`📥 Réponse: ${JSON.stringify(result, null, 2)}`, response.ok ? 'green' : 'red');
    
    return {
      success: response.ok,
      status: response.status,
      data: result
    };
  } catch (error) {
    log(`❌ Erreur réseau: ${error.message}`, 'red');
    return {
      success: false,
      error: error.message
    };
  }
}

// Diagnostic complet
async function diagnosticComplet() {
  log('🔍 DIAGNOSTIC COMPLET - MODIFICATION PAIEMENTS', 'blue');
  log('================================================\n', 'blue');

  let authToken = null;
  let testSale = null;
  let testPaymentPlan = null;

  try {
    // 1. Test de connexion
    log('🔐 ÉTAPE 1: Test de connexion', 'magenta');
    log('─'.repeat(40), 'magenta');
    
    const loginResult = await testEndpoint('/auth/login', 'POST', TEST_USER);
    
    if (!loginResult.success) {
      log('❌ ÉCHEC: Impossible de se connecter', 'red');
      log('💡 Vérifiez que le backend est démarré et que les credentials sont corrects', 'yellow');
      return;
    }
    
    authToken = loginResult.data.data?.token || loginResult.data.token;
    log('✅ Connexion réussie', 'green');

    // 2. Récupération des données de test
    log('\n📊 ÉTAPE 2: Récupération des données de test', 'magenta');
    log('─'.repeat(40), 'magenta');
    
    // Récupérer les projets
    const projectsResult = await testEndpoint('/projects', 'GET', null, authToken);
    if (!projectsResult.success || !projectsResult.data.data?.length) {
      log('❌ ÉCHEC: Aucun projet trouvé', 'red');
      return;
    }
    
    const project = projectsResult.data.data[0];
    log(`✅ Projet trouvé: ${project.nom}`, 'green');

    // Récupérer les ventes
    const salesResult = await testEndpoint(`/sales/project/${project.id}`, 'GET', null, authToken);
    if (!salesResult.success || !salesResult.data?.length) {
      log('❌ ÉCHEC: Aucune vente trouvée', 'red');
      return;
    }
    
    testSale = salesResult.data[0];
    log(`✅ Vente trouvée: ${testSale.client_nom} - Unité ${testSale.unite_numero}`, 'green');

    // Récupérer les plans de paiement
    const plansResult = await testEndpoint(`/payments/plans/sale/${testSale.id}`, 'GET', null, authToken);
    if (!plansResult.success || !plansResult.data.data?.length) {
      log('❌ ÉCHEC: Aucun plan de paiement trouvé', 'red');
      return;
    }
    
    testPaymentPlan = plansResult.data.data[0];
    log(`✅ Plan de paiement trouvé: ${testPaymentPlan.montant_paye} DH`, 'green');

    // 3. Test de l'état initial
    log('\n📋 ÉTAPE 3: État initial du paiement', 'magenta');
    log('─'.repeat(40), 'magenta');
    
    log(`ID du plan: ${testPaymentPlan.id}`, 'cyan');
    log(`Montant payé: ${testPaymentPlan.montant_paye} DH`, 'cyan');
    log(`Montant déclaré: ${testPaymentPlan.montant_declare || 'Non défini'} DH`, 'cyan');
    log(`Montant non déclaré: ${testPaymentPlan.montant_non_declare || 'Non défini'} DH`, 'cyan');
    log(`Mode de paiement: ${testPaymentPlan.mode_paiement || 'Non défini'}`, 'cyan');
    log(`Statut: ${testPaymentPlan.statut || 'Non défini'}`, 'cyan');

    // 4. Test de modification
    log('\n✏️  ÉTAPE 4: Test de modification', 'magenta');
    log('─'.repeat(40), 'magenta');
    
    const originalAmount = parseFloat(testPaymentPlan.montant_paye || 0);
    const newAmount = originalAmount + 1000;
    
    const updateData = {
      montant_paye: newAmount,
      montant_prevu: newAmount,
      montant_declare: Math.round(newAmount * 0.7),
      montant_non_declare: Math.round(newAmount * 0.3),
      date_paiement: new Date().toISOString().split('T')[0],
      date_prevue: new Date().toISOString().split('T')[0],
      mode_paiement: 'espece',
      montant_espece: newAmount,
      montant_cheque: 0,
      notes: `Test de modification ${new Date().toLocaleString()}`,
      description: `Test de modification ${new Date().toLocaleString()}`
    };

    log(`🔄 Modification: ${originalAmount} DH → ${newAmount} DH`, 'yellow');
    
    const updateResult = await testEndpoint(`/payments/plans/${testPaymentPlan.id}`, 'PUT', updateData, authToken);
    
    if (!updateResult.success) {
      log('❌ ÉCHEC: Modification échouée', 'red');
      log(`Détails: ${JSON.stringify(updateResult.data, null, 2)}`, 'red');
      return;
    }
    
    log('✅ Modification envoyée avec succès', 'green');

    // 5. Vérification immédiate
    log('\n🔍 ÉTAPE 5: Vérification immédiate', 'magenta');
    log('─'.repeat(40), 'magenta');
    
    const verifyResult = await testEndpoint(`/payments/plans/sale/${testSale.id}`, 'GET', null, authToken);
    
    if (!verifyResult.success) {
      log('❌ ÉCHEC: Impossible de vérifier', 'red');
      return;
    }
    
    const updatedPlan = verifyResult.data.data.find(p => p.id === testPaymentPlan.id);
    
    if (!updatedPlan) {
      log('❌ ÉCHEC: Plan de paiement non trouvé après modification', 'red');
      return;
    }

    // Comparaison détaillée
    log('📊 COMPARAISON AVANT/APRÈS:', 'yellow');
    log(`Montant payé: ${testPaymentPlan.montant_paye} → ${updatedPlan.montant_paye}`, 'cyan');
    log(`Montant déclaré: ${testPaymentPlan.montant_declare || 'N/A'} → ${updatedPlan.montant_declare || 'N/A'}`, 'cyan');
    log(`Montant non déclaré: ${testPaymentPlan.montant_non_declare || 'N/A'} → ${updatedPlan.montant_non_declare || 'N/A'}`, 'cyan');
    log(`Mode: ${testPaymentPlan.mode_paiement || 'N/A'} → ${updatedPlan.mode_paiement || 'N/A'}`, 'cyan');
    log(`Statut: ${testPaymentPlan.statut || 'N/A'} → ${updatedPlan.statut || 'N/A'}`, 'cyan');

    // Validation des résultats
    const actualAmount = parseFloat(updatedPlan.montant_paye);
    const actualDeclare = parseFloat(updatedPlan.montant_declare || 0);
    const actualNonDeclare = parseFloat(updatedPlan.montant_non_declare || 0);

    log('\n🎯 RÉSULTATS DU TEST:', 'yellow');
    
    if (Math.abs(actualAmount - newAmount) < 0.01) {
      log('✅ Montant payé: CORRECT', 'green');
    } else {
      log(`❌ Montant payé: INCORRECT (${actualAmount} au lieu de ${newAmount})`, 'red');
    }
    
    if (Math.abs(actualDeclare - updateData.montant_declare) < 0.01) {
      log('✅ Montant déclaré: CORRECT', 'green');
    } else {
      log(`❌ Montant déclaré: INCORRECT (${actualDeclare} au lieu de ${updateData.montant_declare})`, 'red');
    }
    
    if (Math.abs(actualNonDeclare - updateData.montant_non_declare) < 0.01) {
      log('✅ Montant non déclaré: CORRECT', 'green');
    } else {
      log(`❌ Montant non déclaré: INCORRECT (${actualNonDeclare} au lieu de ${updateData.montant_non_declare})`, 'red');
    }

    if (updatedPlan.mode_paiement === updateData.mode_paiement) {
      log('✅ Mode de paiement: CORRECT', 'green');
    } else {
      log(`❌ Mode de paiement: INCORRECT (${updatedPlan.mode_paiement} au lieu de ${updateData.mode_paiement})`, 'red');
    }

    // 6. Test via getSaleById (comme le frontend)
    log('\n🔄 ÉTAPE 6: Test via getSaleById (simulation frontend)', 'magenta');
    log('─'.repeat(40), 'magenta');
    
    const saleResult = await testEndpoint(`/sales/${testSale.id}`, 'GET', null, authToken);
    
    if (saleResult.success && saleResult.data.data) {
      const saleData = saleResult.data.data;
      const planInSale = saleData.payment_plans?.find(p => p.id === testPaymentPlan.id);
      
      if (planInSale) {
        log(`✅ Plan trouvé via getSaleById: ${planInSale.montant_paye} DH`, 'green');
        
        if (Math.abs(parseFloat(planInSale.montant_paye) - newAmount) < 0.01) {
          log('✅ Cohérence getSaleById: CORRECT', 'green');
        } else {
          log(`❌ Cohérence getSaleById: INCORRECT (${planInSale.montant_paye} au lieu de ${newAmount})`, 'red');
        }
      } else {
        log('❌ Plan non trouvé dans getSaleById', 'red');
      }
    } else {
      log('❌ Échec getSaleById', 'red');
    }

    log('\n🏁 DIAGNOSTIC TERMINÉ', 'blue');
    log('===================', 'blue');

  } catch (error) {
    log(`❌ ERREUR CRITIQUE: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  diagnosticComplet();
}

module.exports = { diagnosticComplet };
