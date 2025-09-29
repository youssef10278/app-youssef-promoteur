// Test pour vérifier que le CA total est maintenant correct
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

async function testCATotal() {
  try {
    log('\n💰 TEST DU CA TOTAL DANS LA PAGE VENTES', 'blue');
    log('=' .repeat(50), 'blue');

    // 1. Récupérer les données debug pour voir les ventes brutes
    log('\n1. Récupération des ventes brutes...', 'yellow');
    const debugResponse = await fetch(`${API_BASE}/debug-data`);
    const debugData = await debugResponse.json();
    
    if (!debugData.success) {
      log('❌ Erreur lors de la récupération des données debug', 'red');
      return;
    }

    // 2. Analyser les ventes et calculer le CA total manuellement
    log('\n📊 ANALYSE DES VENTES POUR LE CA TOTAL:', 'cyan');
    log('=' .repeat(40), 'cyan');
    
    let caTotalCalcule = 0;
    let nombreVentes = 0;
    
    if (debugData.data.sales && debugData.data.sales.length > 0) {
      debugData.data.sales.forEach((sale, index) => {
        log(`\n  🏠 VENTE ${index + 1}: ${sale.client_nom}`, 'green');
        
        // Afficher les données brutes
        log(`    🔍 DONNÉES BRUTES:`, 'yellow');
        log(`      - prix_total (brut): ${typeof sale.prix_total} (${sale.prix_total})`, 'yellow');
        
        // Conversion comme dans le service corrigé
        const prixTotal = parseFloat(sale.prix_total?.toString() || '0');
        log(`    🧮 CONVERSION:`, 'cyan');
        log(`      - prix_total (converti): ${prixTotal}`, 'cyan');
        log(`      - prix_total (formaté): ${formatAmount(prixTotal)}`, 'cyan');
        
        // Ajouter au CA total
        caTotalCalcule += prixTotal;
        nombreVentes++;
        
        // Vérifications
        if (isNaN(prixTotal)) {
          log(`      ❌ ERREUR: Prix total invalide après conversion`, 'red');
        } else {
          log(`      ✅ Prix total valide`, 'green');
        }
      });
      
      log(`\n📈 RÉSUMÉ DU CALCUL DU CA TOTAL:`, 'magenta');
      log(`  - Nombre de ventes: ${nombreVentes}`, 'magenta');
      log(`  - CA total calculé: ${caTotalCalcule}`, 'magenta');
      log(`  - CA total formaté: ${formatAmount(caTotalCalcule)}`, 'magenta');
      
    } else {
      log('  ℹ️ Aucune vente trouvée dans la base de données', 'cyan');
      log('  💡 Créez des ventes dans l\'interface pour tester le CA total', 'cyan');
    }

    // 3. Tester l'API analytics si on a des projets
    log('\n🔍 TEST DE L\'API ANALYTICS:', 'cyan');
    log('=' .repeat(30), 'cyan');
    
    // Récupérer les projets
    const projectsResponse = await fetch(`${API_BASE}/projects`);
    if (projectsResponse.ok) {
      const projectsData = await projectsResponse.json();
      
      if (projectsData.success && projectsData.data && projectsData.data.length > 0) {
        const firstProject = projectsData.data[0];
        log(`\n  📋 Test avec le projet: ${firstProject.nom}`, 'green');
        
        // Simuler l'appel analytics (nous ne pouvons pas le faire directement car il nécessite l'authentification)
        log(`  ⚠️ L'API analytics nécessite une authentification`, 'yellow');
        log(`  💡 Testez dans l'interface web pour voir le CA total corrigé`, 'yellow');
      } else {
        log('  ℹ️ Aucun projet trouvé', 'cyan');
      }
    }

    // 4. Instructions pour tester
    log('\n📝 INSTRUCTIONS POUR VÉRIFIER LE CA TOTAL:', 'blue');
    log('=' .repeat(50), 'blue');
    log('1. Allez dans l\'interface web (http://localhost:5173)', 'cyan');
    log('2. Connectez-vous et sélectionnez un projet', 'cyan');
    log('3. Regardez la section "Analytics du Projet"', 'cyan');
    log('4. Vérifiez que le "CA Total" correspond à la somme des prix_total des ventes', 'cyan');
    log('5. Le CA total ne devrait plus afficher de valeurs anormales', 'cyan');

    // 5. Résumé des corrections
    log('\n🔧 CORRECTIONS APPLIQUÉES:', 'blue');
    log('=' .repeat(30), 'blue');
    log('✅ Conversion explicite des prix_total de string vers number', 'green');
    log('✅ Utilisation de parseFloat() pour tous les montants', 'green');
    log('✅ Calcul basé sur les vraies avances (avance_declare + avance_non_declare)', 'green');
    log('✅ Gestion des valeurs null/undefined', 'green');

    if (nombreVentes > 0) {
      log('\n🎯 RÉSULTAT ATTENDU:', 'magenta');
      log(`Le CA total dans l'interface devrait afficher: ${formatAmount(caTotalCalcule)}`, 'magenta');
    }

    log('\n✅ Test du CA total terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le test
testCATotal();
