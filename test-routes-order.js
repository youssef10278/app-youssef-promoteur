// Test de l'ordre des routes pour éviter les conflits
import fs from 'fs';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function analyzeRouteOrder(filePath, routerName) {
  log(`\n🔍 Analyse de ${routerName} (${filePath})`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Fichier non trouvé: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const routes = [];
  let hasIdRoute = false;
  let idRouteIndex = -1;
  
  // Extraire toutes les routes GET
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const routeMatch = line.match(/router\.get\(['"`]([^'"`]+)['"`]/);
    
    if (routeMatch) {
      const route = routeMatch[1];
      routes.push({
        route,
        line: i + 1,
        isIdRoute: route === '/:id',
        isStatsRoute: route.includes('/stats')
      });
      
      if (route === '/:id') {
        hasIdRoute = true;
        idRouteIndex = routes.length - 1;
      }
    }
  }
  
  log(`📋 Routes trouvées:`, 'reset');
  routes.forEach((r, index) => {
    const icon = r.isIdRoute ? '🆔' : r.isStatsRoute ? '📊' : '📄';
    const color = r.isIdRoute ? 'yellow' : r.isStatsRoute ? 'green' : 'reset';
    log(`  ${icon} ${r.route} (ligne ${r.line})`, color);
  });
  
  // Vérifier l'ordre des routes
  let hasProblems = false;
  
  if (hasIdRoute) {
    const statsRoutesAfterIdRoute = routes.slice(idRouteIndex + 1).filter(r => r.isStatsRoute);
    
    if (statsRoutesAfterIdRoute.length > 0) {
      log(`❌ Problème détecté: Routes /stats après /:id`, 'red');
      statsRoutesAfterIdRoute.forEach(r => {
        log(`   ⚠️  ${r.route} (ligne ${r.line}) sera capturée par /:id`, 'yellow');
      });
      hasProblems = true;
    } else {
      log(`✅ Ordre des routes correct`, 'green');
    }
  } else {
    log(`ℹ️  Pas de route /:id trouvée`, 'blue');
  }
  
  return !hasProblems;
}

function main() {
  log('🧪 TEST DE L\'ORDRE DES ROUTES', 'blue');
  log('==============================\n', 'blue');
  
  const routeFiles = [
    {
      path: 'backend/src/routes/sales.ts',
      name: 'Sales Router'
    },
    {
      path: 'backend/src/routes/checks.ts',
      name: 'Checks Router'
    },
    {
      path: 'backend/src/routes/projects.ts',
      name: 'Projects Router'
    },
    {
      path: 'backend/src/routes/expenses.ts',
      name: 'Expenses Router'
    }
  ];
  
  let allGood = true;
  
  for (const file of routeFiles) {
    const isGood = analyzeRouteOrder(file.path, file.name);
    if (!isGood) {
      allGood = false;
    }
  }
  
  log('\n📋 RÉSUMÉ', 'blue');
  log('========', 'blue');
  
  if (allGood) {
    log('✅ Tous les routeurs ont un ordre de routes correct !', 'green');
    log('✅ Les endpoints /stats devraient maintenant fonctionner', 'green');
    
    log('\n🚀 PROCHAINES ÉTAPES:', 'blue');
    log('1. Redémarrer le backend: cd backend && npm run dev', 'blue');
    log('2. Tester les endpoints:', 'blue');
    log('   - GET /api/sales/stats', 'blue');
    log('   - GET /api/checks/stats/pending', 'blue');
    log('3. Vérifier le dashboard', 'blue');
  } else {
    log('❌ Certains routeurs ont des problèmes d\'ordre de routes', 'red');
    log('⚠️  Corrigez l\'ordre avant de continuer', 'yellow');
    
    log('\n🔧 SOLUTION:', 'blue');
    log('Déplacez toutes les routes spécifiques (comme /stats) AVANT les routes génériques (comme /:id)', 'blue');
  }
  
  log('\n💡 RAPPEL:', 'yellow');
  log('En Express.js, l\'ordre des routes est important !', 'yellow');
  log('Les routes plus spécifiques doivent être définies avant les routes génériques.', 'yellow');
}

main();
