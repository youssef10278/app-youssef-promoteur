// Test direct de la base de données pour les ventes
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

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount).replace('MAD', 'DH');
}

async function testSalesDatabase() {
  try {
    log('\n🔍 TEST COMPLET DES VENTES - BASE DE DONNÉES', 'blue');
    log('=' .repeat(60), 'blue');

    // 1. Récupérer toutes les données debug
    log('\n1. Récupération des données debug...', 'yellow');
    const debugResponse = await fetch(`${API_BASE}/debug-data`);
    const debugData = await debugResponse.json();
    
    if (!debugData.success) {
      log('❌ Erreur lors de la récupération des données debug', 'red');
      return;
    }

    // 2. Afficher les ventes trouvées
    log('\n📊 VENTES TROUVÉES DANS LA BASE:', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    if (debugData.data.sales && debugData.data.sales.length > 0) {
      debugData.data.sales.forEach((sale, index) => {
        log(`\n  🏠 VENTE ${index + 1}:`, 'green');
        log(`    ID: ${sale.id}`, 'green');
        log(`    Client: ${sale.client_nom}`, 'green');
        log(`    Unité: ${sale.unite_numero}`, 'green');
        log(`    Projet: ${sale.project_nom}`, 'green');
        log(`    Type: ${sale.type_propriete}`, 'green');
        log(`    Surface: ${sale.surface}m²`, 'green');
        
        // VALEURS CRITIQUES - C'est ici que le problème peut être
        log(`    💰 PRIX TOTAL: ${formatAmount(parseFloat(sale.prix_total))}`, 'magenta');
        log(`    💵 AVANCE DÉCLARÉE: ${formatAmount(parseFloat(sale.avance_declare || 0))}`, 'magenta');
        log(`    💴 AVANCE NON DÉCLARÉE: ${formatAmount(parseFloat(sale.avance_non_declare || 0))}`, 'magenta');
        log(`    🏦 AVANCE CHÈQUE: ${formatAmount(parseFloat(sale.avance_cheque || 0))}`, 'magenta');
        log(`    💸 AVANCE ESPÈCE: ${formatAmount(parseFloat(sale.avance_espece || 0))}`, 'magenta');
        
        // Calculs comme dans le frontend
        const initialAdvance = (parseFloat(sale.avance_declare || 0)) + (parseFloat(sale.avance_non_declare || 0));
        log(`    ✅ AVANCE TOTALE (calculée): ${formatAmount(initialAdvance)}`, 'magenta');
        
        log(`    📅 Mode paiement: ${sale.mode_paiement}`, 'green');
        log(`    📊 Statut: ${sale.statut}`, 'green');
        log(`    📅 Créé le: ${new Date(sale.created_at).toLocaleDateString('fr-FR')}`, 'green');
        
        // Types de données brutes
        log(`    🔍 TYPES DE DONNÉES:`, 'yellow');
        log(`      - prix_total: ${typeof sale.prix_total} (${sale.prix_total})`, 'yellow');
        log(`      - avance_declare: ${typeof sale.avance_declare} (${sale.avance_declare})`, 'yellow');
        log(`      - avance_non_declare: ${typeof sale.avance_non_declare} (${sale.avance_non_declare})`, 'yellow');
        log(`      - avance_cheque: ${typeof sale.avance_cheque} (${sale.avance_cheque})`, 'yellow');
        log(`      - avance_espece: ${typeof sale.avance_espece} (${sale.avance_espece})`, 'yellow');
      });
    } else {
      log('  ℹ️ Aucune vente trouvée dans la base de données', 'cyan');
    }

    // 3. Afficher les plans de paiement
    log('\n💳 PLANS DE PAIEMENT TROUVÉS:', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    if (debugData.data.payment_plans && debugData.data.payment_plans.length > 0) {
      debugData.data.payment_plans.forEach((plan, index) => {
        log(`\n  📋 PLAN ${index + 1}:`, 'green');
        log(`    ID: ${plan.id}`, 'green');
        log(`    Vente: ${plan.client_nom} - ${plan.unite_numero}`, 'green');
        log(`    Projet: ${plan.project_nom}`, 'green');
        log(`    Échéance N°: ${plan.numero_echeance}`, 'green');
        log(`    💰 Montant prévu: ${formatAmount(parseFloat(plan.montant_prevu || 0))}`, 'magenta');
        log(`    💵 Montant payé: ${formatAmount(parseFloat(plan.montant_paye || 0))}`, 'magenta');
        log(`    💸 Montant espèce: ${formatAmount(parseFloat(plan.montant_espece || 0))}`, 'magenta');
        log(`    🏦 Montant chèque: ${formatAmount(parseFloat(plan.montant_cheque || 0))}`, 'magenta');
        log(`    📅 Date prévue: ${new Date(plan.date_prevue).toLocaleDateString('fr-FR')}`, 'green');
        log(`    📊 Statut: ${plan.statut}`, 'green');
        
        if (plan.date_paiement) {
          log(`    ✅ Payé le: ${new Date(plan.date_paiement).toLocaleDateString('fr-FR')}`, 'green');
        }
      });
    } else {
      log('  ℹ️ Aucun plan de paiement trouvé', 'cyan');
    }

    // 4. Simulation du calcul frontend
    log('\n🧮 SIMULATION CALCUL FRONTEND:', 'blue');
    log('=' .repeat(40), 'blue');
    
    if (debugData.data.sales && debugData.data.sales.length > 0) {
      debugData.data.sales.forEach((sale, index) => {
        log(`\n  🔢 CALCUL POUR VENTE ${index + 1} (${sale.client_nom}):`, 'yellow');
        
        // Reproduire exactement le calcul du frontend
        const initialAdvance = (parseFloat(sale.avance_declare || 0)) + (parseFloat(sale.avance_non_declare || 0));
        
        // Trouver les plans de paiement pour cette vente
        const salePaymentPlans = debugData.data.payment_plans?.filter(plan => plan.sale_id === sale.id) || [];
        const additionalPayments = salePaymentPlans.reduce((sum, plan) => sum + (parseFloat(plan.montant_paye || 0)), 0);
        
        const totalPaid = initialAdvance + additionalPayments;
        const totalDue = parseFloat(sale.prix_total);
        const percentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;
        
        log(`    📊 Avance initiale: ${formatAmount(initialAdvance)}`, 'cyan');
        log(`    📊 Paiements supplémentaires: ${formatAmount(additionalPayments)}`, 'cyan');
        log(`    📊 Total payé: ${formatAmount(totalPaid)}`, 'cyan');
        log(`    📊 Total dû: ${formatAmount(totalDue)}`, 'cyan');
        log(`    📊 Pourcentage: ${percentage.toFixed(1)}%`, 'cyan');
        log(`    📊 Montant restant: ${formatAmount(totalDue - totalPaid)}`, 'cyan');
        
        // Vérifier s'il y a des incohérences
        if (totalPaid > totalDue) {
          log(`    ⚠️ PROBLÈME: Total payé > Total dû !`, 'red');
        }
        
        if (initialAdvance !== (parseFloat(sale.avance_cheque || 0) + parseFloat(sale.avance_espece || 0))) {
          log(`    ⚠️ INCOHÉRENCE: Avance totale ≠ Chèque + Espèce`, 'red');
          log(`      Avance totale: ${formatAmount(initialAdvance)}`, 'red');
          log(`      Chèque + Espèce: ${formatAmount(parseFloat(sale.avance_cheque || 0) + parseFloat(sale.avance_espece || 0))}`, 'red');
        }
      });
    }

    log('\n✅ Test terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
testSalesDatabase();
