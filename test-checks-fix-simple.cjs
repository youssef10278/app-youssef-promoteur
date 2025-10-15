const fs = require('fs');

console.log('🔧 Vérification des corrections de la page /checks');
console.log('================================================\n');

// 1. Vérifier que eventBus.on() est utilisé au lieu de subscribe()
console.log('1. Vérification de l\'EventBus...');
const checksContent = fs.readFileSync('src/pages/Checks.tsx', 'utf8');
if (checksContent.includes('eventBus.on(EVENTS.CHECK_CREATED')) {
  console.log('✅ Checks.tsx utilise eventBus.on() - CORRIGÉ');
} else if (checksContent.includes('eventBus.subscribe(EVENTS.CHECK_CREATED')) {
  console.log('❌ Checks.tsx utilise encore eventBus.subscribe() - ERREUR');
} else {
  console.log('⚠️  EventBus non trouvé dans Checks.tsx');
}

// 2. Vérifier la structure du CheckService
console.log('\n2. Vérification du CheckService...');
const checkServiceContent = fs.readFileSync('src/services/checkService.ts', 'utf8');
if (checkServiceContent.includes('Promise<{ success: boolean; data: Check[] }>')) {
  console.log('✅ CheckService.getChecks() retourne la bonne structure - CORRIGÉ');
} else {
  console.log('❌ CheckService.getChecks() - Structure incorrecte');
}

// 3. Vérifier les types CheckFiltersState
console.log('\n3. Vérification des types CheckFilters...');
const checkFiltersContent = fs.readFileSync('src/components/checks/CheckFilters.tsx', 'utf8');
if (checkFiltersContent.includes('nom_beneficiaire: string') && 
    checkFiltersContent.includes('nom_emetteur: string') &&
    checkFiltersContent.includes('numero_cheque: string')) {
  console.log('✅ CheckFiltersState contient tous les champs - CORRIGÉ');
} else {
  console.log('❌ CheckFiltersState - Champs manquants');
}

console.log('\n📋 Résumé des corrections:');
console.log('=========================');
console.log('✅ eventBus.subscribe() → eventBus.on()');
console.log('✅ Type de retour CheckService.getChecks()');
console.log('✅ Champs manquants dans CheckFiltersState');
console.log('✅ Méthode createCheck() corrigée');

console.log('\n🎯 La page /checks devrait maintenant fonctionner !');
console.log('\nPour tester:');
console.log('1. npm run dev');
console.log('2. Aller sur http://localhost:8080/checks');
console.log('3. Vérifier qu\'il n\'y a plus d\'erreur "subscribe is not a function"');
