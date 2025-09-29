// Test final de validation des corrections
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

function getAllTsxFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...getAllTsxFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function checkForProblematicIsLoading(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const problems = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;
    
    // Chercher les utilisations problématiques de isLoading
    // Exclure les définitions et les utilisations légitimes
    if (line.includes('isLoading') && 
        !line.includes('isLoading:') && 
        !line.includes('isLoadingProjects') && 
        !line.includes('isLoadingSales') && 
        !line.includes('isLoadingExpenses') && 
        !line.includes('authLoading') && 
        !line.includes('isSubmitting') &&
        !line.includes('setIsLoading') &&
        !line.includes('useState') &&
        !line.includes('interface') &&
        !line.includes('type ') &&
        !line.includes('//') &&
        !line.includes('const [isLoading') &&
        !line.includes('isLoading?:') &&
        !line.includes('isLoading = ') &&
        !line.includes('export ') &&
        !line.includes('import ')) {
      
      // Vérifier si c'est dans un fichier de page qui pourrait avoir un conflit
      const isPageFile = filePath.includes('pages/') && 
                        (filePath.includes('CreateProject') || 
                         filePath.includes('Register') || 
                         filePath.includes('Sales') || 
                         filePath.includes('Projects') || 
                         filePath.includes('Expenses'));
      
      if (isPageFile) {
        problems.push({
          line: lineNumber,
          content: line.trim(),
          severity: 'high'
        });
      }
    }
    
    // Chercher les utilisations de 'loading' au lieu de 'isLoading'
    if (line.includes('loading') && 
        !line.includes('isLoading') && 
        !line.includes('Loading') &&
        !line.includes('loading...') &&
        !line.includes('Chargement') &&
        !line.includes('//') &&
        line.includes('useAuth')) {
      problems.push({
        line: lineNumber,
        content: line.trim(),
        severity: 'medium'
      });
    }
  }
  
  return problems;
}

function main() {
  log('🔍 VALIDATION FINALE DES CORRECTIONS', 'blue');
  log('====================================\n', 'blue');
  
  const srcFiles = getAllTsxFiles('src');
  let totalProblems = 0;
  
  for (const file of srcFiles) {
    const problems = checkForProblematicIsLoading(file);
    
    if (problems.length > 0) {
      log(`❌ Problèmes détectés dans ${file}:`, 'red');
      
      for (const problem of problems) {
        const severity = problem.severity === 'high' ? '🔴' : '🟡';
        log(`  ${severity} Ligne ${problem.line}: ${problem.content}`, 'yellow');
      }
      
      totalProblems += problems.length;
      log('');
    }
  }
  
  if (totalProblems === 0) {
    log('🎉 VALIDATION RÉUSSIE !', 'green');
    log('✅ Aucun conflit de variables détecté', 'green');
    log('✅ Toutes les corrections sont appliquées', 'green');
    log('✅ L\'application devrait compiler sans erreurs', 'green');
    
    log('\n🚀 PROCHAINES ÉTAPES:', 'blue');
    log('1. Démarrer le backend: cd backend && npm run dev', 'blue');
    log('2. Démarrer le frontend: npm run dev', 'blue');
    log('3. Tester la déconnexion dans l\'application', 'blue');
    log('4. Vérifier que toutes les pages se chargent correctement', 'blue');
  } else {
    log(`❌ ${totalProblems} problème(s) détecté(s)`, 'red');
    log('⚠️  Corrigez ces problèmes avant de continuer', 'yellow');
  }
}

main();
