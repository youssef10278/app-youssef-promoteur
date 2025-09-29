// Test pour vérifier que les corrections des valeurs fonctionnent
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
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  if (isNaN(numericAmount)) return '0 DH';
  
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(numericAmount).replace('MAD', 'DH');
}

async function testFixedValues() {
  try {
    log('\n🔧 TEST DES CORRECTIONS DES VALEURS', 'blue');
    log('=' .repeat(50), 'blue');

    // 1. Récupérer les données debug pour voir les types
    log('\n1. Récupération des données debug...', 'yellow');
    const debugResponse = await fetch(`${API_BASE}/debug-data`);
    const debugData = await debugResponse.json();
    
    if (!debugData.success) {
      log('❌ Erreur lors de la récupération des données debug', 'red');
      return;
    }

    // 2. Analyser les ventes trouvées
    log('\n📊 ANALYSE DES VENTES DANS LA BASE:', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    if (debugData.data.sales && debugData.data.sales.length > 0) {
      debugData.data.sales.forEach((sale, index) => {
        log(`\n  🏠 VENTE ${index + 1}: ${sale.client_nom}`, 'green');
        
        // Afficher les types de données brutes de la DB
        log(`    🔍 DONNÉES BRUTES DE LA DB:`, 'yellow');
        log(`      - prix_total: ${typeof sale.prix_total} (${sale.prix_total})`, 'yellow');
        log(`      - avance_declare: ${typeof sale.avance_declare} (${sale.avance_declare})`, 'yellow');
        log(`      - avance_non_declare: ${typeof sale.avance_non_declare} (${sale.avance_non_declare})`, 'yellow');
        log(`      - avance_cheque: ${typeof sale.avance_cheque} (${sale.avance_cheque})`, 'yellow');
        log(`      - avance_espece: ${typeof sale.avance_espece} (${sale.avance_espece})`, 'yellow');
        
        // Test de la conversion comme dans le frontend corrigé
        log(`    🧮 CALCULS AVEC CONVERSIONS CORRIGÉES:`, 'cyan');
        const avanceDeclare = parseFloat(sale.avance_declare?.toString() || '0');
        const avanceNonDeclare = parseFloat(sale.avance_non_declare?.toString() || '0');
        const initialAdvance = avanceDeclare + avanceNonDeclare;
        const prixTotal = parseFloat(sale.prix_total?.toString() || '0');
        
        log(`      - Avance déclarée convertie: ${avanceDeclare}`, 'cyan');
        log(`      - Avance non déclarée convertie: ${avanceNonDeclare}`, 'cyan');
        log(`      - Avance totale calculée: ${initialAdvance}`, 'cyan');
        log(`      - Prix total converti: ${prixTotal}`, 'cyan');
        
        // Formatage avec la fonction corrigée
        log(`    💰 AFFICHAGE FORMATÉ:`, 'magenta');
        log(`      - Prix total: ${formatAmount(prixTotal)}`, 'magenta');
        log(`      - Avance déclarée: ${formatAmount(avanceDeclare)}`, 'magenta');
        log(`      - Avance non déclarée: ${formatAmount(avanceNonDeclare)}`, 'magenta');
        log(`      - Avance totale: ${formatAmount(initialAdvance)}`, 'magenta');
        
        // Vérifications de cohérence
        log(`    ✅ VÉRIFICATIONS:`, 'green');
        if (avanceDeclare + avanceNonDeclare === initialAdvance) {
          log(`      ✓ Calcul avance totale correct`, 'green');
        } else {
          log(`      ✗ Erreur calcul avance totale`, 'red');
        }
        
        if (initialAdvance <= prixTotal) {
          log(`      ✓ Avance ≤ Prix total`, 'green');
        } else {
          log(`      ✗ Avance > Prix total (problème!)`, 'red');
        }
      });
    } else {
      log('  ℹ️ Aucune vente trouvée dans la base de données', 'cyan');
      log('  💡 Créez une vente dans l\'interface pour tester les corrections', 'cyan');
    }

    // 3. Test des plans de paiement
    log('\n💳 ANALYSE DES PLANS DE PAIEMENT:', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    if (debugData.data.payment_plans && debugData.data.payment_plans.length > 0) {
      debugData.data.payment_plans.forEach((plan, index) => {
        log(`\n  📋 PLAN ${index + 1}:`, 'green');
        
        // Types de données brutes
        log(`    🔍 DONNÉES BRUTES:`, 'yellow');
        log(`      - montant_prevu: ${typeof plan.montant_prevu} (${plan.montant_prevu})`, 'yellow');
        log(`      - montant_paye: ${typeof plan.montant_paye} (${plan.montant_paye})`, 'yellow');
        
        // Conversions
        const montantPrevu = parseFloat(plan.montant_prevu?.toString() || '0');
        const montantPaye = parseFloat(plan.montant_paye?.toString() || '0');
        
        log(`    🧮 CONVERSIONS:`, 'cyan');
        log(`      - Montant prévu converti: ${montantPrevu}`, 'cyan');
        log(`      - Montant payé converti: ${montantPaye}`, 'cyan');
        
        log(`    💰 FORMATÉ:`, 'magenta');
        log(`      - Montant prévu: ${formatAmount(montantPrevu)}`, 'magenta');
        log(`      - Montant payé: ${formatAmount(montantPaye)}`, 'magenta');
      });
    } else {
      log('  ℹ️ Aucun plan de paiement trouvé', 'cyan');
    }

    // 4. Instructions pour tester
    log('\n📝 INSTRUCTIONS POUR TESTER LES CORRECTIONS:', 'blue');
    log('=' .repeat(50), 'blue');
    log('1. Redémarrez le backend pour appliquer les corrections', 'cyan');
    log('2. Allez dans l\'interface web (http://localhost:5173)', 'cyan');
    log('3. Créez une nouvelle vente avec des valeurs spécifiques (ex: 20 et 80)', 'cyan');
    log('4. Vérifiez que les valeurs affichées correspondent exactement à ce que vous avez saisi', 'cyan');
    log('5. Les calculs de progression doivent maintenant être corrects', 'cyan');

    log('\n✅ Test des corrections terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
testFixedValues();
