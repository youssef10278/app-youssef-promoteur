// Script pour déboguer les valeurs des ventes
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

async function debugSalesValues() {
  try {
    log('\n🔍 DÉBOGAGE DES VALEURS DES VENTES', 'blue');
    log('=====================================\n', 'blue');

    // 1. Récupérer toutes les ventes depuis la base de données
    log('1. Récupération des ventes depuis la base de données...', 'yellow');
    
    const salesResponse = await fetch(`${API_BASE}/debug-data`);
    const debugData = await salesResponse.json();
    
    if (!debugData.success) {
      log('❌ Erreur lors de la récupération des données debug', 'red');
      return;
    }

    // 2. Afficher les projets disponibles
    log('\n📋 PROJETS DISPONIBLES:', 'cyan');
    debugData.data.projects.forEach(project => {
      log(`  - ${project.nom} (ID: ${project.id})`, 'cyan');
    });

    // 3. Récupérer les ventes pour chaque projet
    for (const project of debugData.data.projects) {
      log(`\n🏗️ VENTES DU PROJET: ${project.nom}`, 'yellow');
      log('=' .repeat(50), 'yellow');
      
      try {
        // Récupérer les ventes du projet (sans authentification pour le debug)
        const projectSalesResponse = await fetch(`${API_BASE}/sales/project/${project.id}`);
        
        if (projectSalesResponse.status === 401) {
          log('⚠️ Authentification requise - utilisation de la route debug', 'yellow');
          continue;
        }
        
        const projectSalesData = await projectSalesResponse.json();
        
        if (projectSalesData.success && projectSalesData.data.length > 0) {
          projectSalesData.data.forEach((sale, index) => {
            log(`\n  📊 VENTE ${index + 1}:`, 'green');
            log(`    Client: ${sale.client_nom}`, 'green');
            log(`    Unité: ${sale.unite_numero}`, 'green');
            log(`    Prix total: ${sale.prix_total} DH`, 'green');
            log(`    Avance déclarée: ${sale.avance_declare || 0} DH`, 'green');
            log(`    Avance non déclarée: ${sale.avance_non_declare || 0} DH`, 'green');
            log(`    Avance chèque: ${sale.avance_cheque || 0} DH`, 'green');
            log(`    Avance espèce: ${sale.avance_espece || 0} DH`, 'green');
            log(`    Avance totale (calculée): ${(sale.avance_declare || 0) + (sale.avance_non_declare || 0)} DH`, 'green');
            log(`    Statut: ${sale.statut}`, 'green');
            log(`    Mode paiement: ${sale.mode_paiement}`, 'green');
            log(`    Date création: ${sale.created_at}`, 'green');
          });
        } else {
          log('  ℹ️ Aucune vente trouvée pour ce projet', 'cyan');
        }
      } catch (error) {
        log(`  ❌ Erreur lors de la récupération des ventes: ${error.message}`, 'red');
      }
    }

    // 4. Test direct de la base de données via une requête SQL
    log('\n🗄️ TEST DIRECT BASE DE DONNÉES:', 'blue');
    log('=' .repeat(40), 'blue');
    
    try {
      const dbTestResponse = await fetch(`${API_BASE}/debug-data`);
      const dbTestData = await dbTestResponse.json();
      
      // Simuler une requête SQL pour les ventes (à ajouter dans le backend)
      log('  ⚠️ Pour un test complet, ajouter une route debug pour les ventes dans le backend', 'yellow');
      
    } catch (error) {
      log(`  ❌ Erreur test DB: ${error.message}`, 'red');
    }

    log('\n✅ Débogage terminé', 'green');
    
  } catch (error) {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    console.error(error);
  }
}

// Exécuter le débogage
debugSalesValues();
