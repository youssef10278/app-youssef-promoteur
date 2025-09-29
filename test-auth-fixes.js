// Test des corrections d'authentification
import fs from 'fs';
import path from 'path';

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

// Fichiers à vérifier
const filesToCheck = [
  'src/pages/Dashboard.tsx',
  'src/pages/CreateProject.tsx',
  'src/pages/Register.tsx',
  'src/pages/Settings.tsx',
  'src/pages/Sales.tsx',
  'src/pages/Projects.tsx',
  'src/components/layout/AppSidebar.tsx'
];

function checkFile(filePath) {
  log(`\n🔍 Vérification de ${filePath}`, 'blue');
  
  if (!fs.existsSync(filePath)) {
    log(`❌ Fichier non trouvé: ${filePath}`, 'red');
    return false;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  let hasErrors = false;

  // Vérifier les problèmes corrigés
  const checks = [
    {
      name: 'Pas de "loading" au lieu de "isLoading"',
      test: () => {
        const loadingMatches = content.match(/const\s+{\s*[^}]*loading[^}]*}\s*=\s*useAuth\(\)/g);
        const ifLoadingMatches = content.match(/if\s*\(\s*loading\s*\)/g);
        return !loadingMatches && !ifLoadingMatches;
      }
    },
    {
      name: 'Pas de "signOut" au lieu de "logout"',
      test: () => {
        const signOutMatches = content.match(/signOut/g);
        return !signOutMatches;
      }
    },
    {
      name: 'Pas de "profile" au lieu de "user" dans useAuth',
      test: () => {
        const profileMatches = content.match(/const\s+{\s*[^}]*profile[^}]*}\s*=\s*useAuth\(\)/g);
        return !profileMatches;
      }
    },
    {
      name: 'Pas d\'import Supabase',
      test: () => {
        const supabaseImports = content.match(/import.*supabase.*from/g);
        return !supabaseImports;
      }
    },
    {
      name: 'Utilise apiClient au lieu de supabase',
      test: () => {
        const supabaseUsage = content.match(/supabase\./g);
        return !supabaseUsage;
      }
    }
  ];

  checks.forEach(check => {
    if (check.test()) {
      log(`  ✅ ${check.name}`, 'green');
    } else {
      log(`  ❌ ${check.name}`, 'red');
      hasErrors = true;
    }
  });

  return !hasErrors;
}

function main() {
  log('🔧 VÉRIFICATION DES CORRECTIONS D\'AUTHENTIFICATION', 'blue');
  log('================================================\n', 'blue');

  let allGood = true;

  filesToCheck.forEach(file => {
    const isGood = checkFile(file);
    if (!isGood) {
      allGood = false;
    }
  });

  log('\n📋 RÉSUMÉ', 'blue');
  log('========', 'blue');

  if (allGood) {
    log('✅ Toutes les corrections ont été appliquées avec succès !', 'green');
    log('✅ Le bouton de déconnexion devrait maintenant fonctionner', 'green');
    log('\n🚀 PROCHAINES ÉTAPES:', 'blue');
    log('1. Démarrer le backend: cd backend && npm run dev', 'blue');
    log('2. Démarrer le frontend: npm run dev', 'blue');
    log('3. Tester la déconnexion dans l\'application', 'blue');
  } else {
    log('❌ Certaines corrections n\'ont pas été appliquées correctement', 'red');
    log('⚠️  Vérifiez les erreurs ci-dessus et corrigez-les manuellement', 'yellow');
  }
}

main();
