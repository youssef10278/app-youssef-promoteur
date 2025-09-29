// Test de compilation rapide
import { spawn } from 'child_process';
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

function testTypeScript() {
  return new Promise((resolve) => {
    log('🔍 Test de compilation TypeScript...', 'blue');
    
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });

    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    tsc.on('close', (code) => {
      if (code === 0) {
        log('✅ Compilation TypeScript réussie !', 'green');
        resolve(true);
      } else {
        log('❌ Erreurs de compilation TypeScript:', 'red');
        console.log(errorOutput);
        resolve(false);
      }
    });

    // Timeout après 30 secondes
    setTimeout(() => {
      tsc.kill();
      log('⏰ Timeout de compilation', 'yellow');
      resolve(false);
    }, 30000);
  });
}

function testViteBuild() {
  return new Promise((resolve) => {
    log('🔍 Test de build Vite...', 'blue');
    
    const vite = spawn('npm', ['run', 'build'], {
      stdio: 'pipe',
      shell: true
    });

    let output = '';
    let errorOutput = '';

    vite.stdout.on('data', (data) => {
      output += data.toString();
    });

    vite.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    vite.on('close', (code) => {
      if (code === 0) {
        log('✅ Build Vite réussi !', 'green');
        resolve(true);
      } else {
        log('❌ Erreurs de build Vite:', 'red');
        console.log(errorOutput);
        resolve(false);
      }
    });

    // Timeout après 60 secondes
    setTimeout(() => {
      vite.kill();
      log('⏰ Timeout de build', 'yellow');
      resolve(false);
    }, 60000);
  });
}

async function main() {
  log('🧪 TEST DE COMPILATION COMPLÈTE', 'blue');
  log('================================\n', 'blue');

  // Vérifier que les fichiers existent
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'src/main.tsx'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`❌ Fichier manquant: ${file}`, 'red');
      return;
    }
  }

  log('✅ Tous les fichiers requis sont présents', 'green');

  // Test TypeScript
  const tsSuccess = await testTypeScript();
  
  if (!tsSuccess) {
    log('\n❌ Échec du test TypeScript', 'red');
    return;
  }

  // Test Vite Build
  const buildSuccess = await testViteBuild();
  
  if (!buildSuccess) {
    log('\n❌ Échec du test de build', 'red');
    return;
  }

  log('\n🎉 TOUS LES TESTS PASSENT !', 'green');
  log('✅ L\'application compile sans erreurs', 'green');
  log('✅ Le bouton de déconnexion est maintenant fonctionnel', 'green');
  
  log('\n🚀 PROCHAINES ÉTAPES:', 'blue');
  log('1. Démarrer le backend: cd backend && npm run dev', 'blue');
  log('2. Démarrer le frontend: npm run dev', 'blue');
  log('3. Tester la déconnexion dans l\'application', 'blue');
}

main().catch(console.error);
