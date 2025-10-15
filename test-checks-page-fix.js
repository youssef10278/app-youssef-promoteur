#!/usr/bin/env node

/**
 * Test rapide pour vérifier que la page /checks fonctionne
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Test de la correction de la page /checks');
console.log('=====================================\n');

// 1. Vérifier que les fichiers modifiés existent
const filesToCheck = [
  'src/pages/Checks.tsx',
  'src/services/checkService.ts',
  'src/components/checks/CheckFilters.tsx',
  'src/utils/eventBus.ts'
];

console.log('📁 Vérification des fichiers...');
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - OK`);
  } else {
    console.log(`❌ ${file} - MANQUANT`);
  }
});

// 2. Vérifier la syntaxe TypeScript
console.log('\n🔍 Vérification de la syntaxe TypeScript...');
try {
  execSync('npx tsc --noEmit --skipLibCheck', { stdio: 'pipe' });
  console.log('✅ Syntaxe TypeScript - OK');
} catch (error) {
  console.log('❌ Erreurs TypeScript détectées:');
  console.log(error.stdout?.toString() || error.message);
}

// 3. Vérifier que eventBus.on() existe
console.log('\n🔍 Vérification de l\'EventBus...');
const eventBusContent = fs.readFileSync('src/utils/eventBus.ts', 'utf8');
if (eventBusContent.includes('on(event: string, callback: EventCallback)')) {
  console.log('✅ EventBus.on() - OK');
} else {
  console.log('❌ EventBus.on() - MANQUANT');
}

// 4. Vérifier que Checks.tsx utilise eventBus.on()
console.log('\n🔍 Vérification de l\'utilisation dans Checks.tsx...');
const checksContent = fs.readFileSync('src/pages/Checks.tsx', 'utf8');
if (checksContent.includes('eventBus.on(EVENTS.CHECK_CREATED')) {
  console.log('✅ Checks.tsx utilise eventBus.on() - OK');
} else if (checksContent.includes('eventBus.subscribe(EVENTS.CHECK_CREATED')) {
  console.log('❌ Checks.tsx utilise encore eventBus.subscribe() - ERREUR');
} else {
  console.log('⚠️  Checks.tsx - Utilisation d\'eventBus non trouvée');
}

// 5. Vérifier la structure du CheckService
console.log('\n🔍 Vérification du CheckService...');
const checkServiceContent = fs.readFileSync('src/services/checkService.ts', 'utf8');
if (checkServiceContent.includes('Promise<{ success: boolean; data: Check[] }>')) {
  console.log('✅ CheckService.getChecks() retourne la bonne structure - OK');
} else {
  console.log('❌ CheckService.getChecks() - Structure de retour incorrecte');
}

// 6. Essayer de compiler le projet
console.log('\n🏗️  Test de compilation...');
try {
  execSync('npm run build', { stdio: 'pipe' });
  console.log('✅ Compilation réussie - OK');
} catch (error) {
  console.log('❌ Erreur de compilation:');
  console.log(error.stdout?.toString() || error.message);
}

console.log('\n📋 Résumé des corrections appliquées:');
console.log('=====================================');
console.log('1. ✅ Correction eventBus.subscribe() → eventBus.on()');
console.log('2. ✅ Correction du type de retour de CheckService.getChecks()');
console.log('3. ✅ Ajout des champs manquants dans CheckFiltersState');
console.log('4. ✅ Correction de la méthode createCheck()');

console.log('\n🎯 Prochaines étapes:');
console.log('===================');
console.log('1. Démarrer le serveur de développement: npm run dev');
console.log('2. Tester la page /checks dans le navigateur');
console.log('3. Vérifier que les chèques s\'affichent correctement');
console.log('4. Tester l\'ajout d\'un nouveau chèque');

console.log('\n✅ Test terminé !');
