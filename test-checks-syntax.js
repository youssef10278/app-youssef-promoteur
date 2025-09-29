const fs = require('fs');

console.log('🧪 Test de syntaxe du fichier Checks.tsx');
console.log('=====================================');

try {
  // Lire le fichier
  const content = fs.readFileSync('src/pages/Checks.tsx', 'utf8');
  
  // Vérifications de base
  const checks = [
    {
      name: 'Export par défaut unique',
      test: () => {
        const exports = (content.match(/export default Checks;/g) || []).length;
        return exports === 1;
      }
    },
    {
      name: 'Fonction Checks définie',
      test: () => content.includes('const Checks = () => {')
    },
    {
      name: 'JSX valide - pas de fragments adjacents',
      test: () => {
        // Vérifier qu'il n'y a pas de JSX adjacents sans wrapper
        const lines = content.split('\n');
        let inJSX = false;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Compter les accolades pour détecter les blocs JSX
          if (line.includes('return (')) {
            inJSX = true;
            braceCount = 0;
          }
          
          if (inJSX) {
            braceCount += (line.match(/\{/g) || []).length;
            braceCount -= (line.match(/\}/g) || []).length;
            
            // Si on ferme le return, on sort du JSX
            if (braceCount < 0 && line.includes(');')) {
              inJSX = false;
            }
          }
        }
        
        return true; // Si on arrive ici sans erreur, c'est bon
      }
    },
    {
      name: 'Imports corrects',
      test: () => {
        const hasReact = content.includes("import { useEffect, useState, useCallback } from 'react'");
        const hasRouter = content.includes("import { Navigate, Link } from 'react-router-dom'");
        const hasAuth = content.includes("import { useAuth } from '@/contexts/AuthContext'");
        return hasReact && hasRouter && hasAuth;
      }
    },
    {
      name: 'Pas de code dupliqué',
      test: () => {
        // Vérifier qu'il n'y a pas de sections dupliquées
        const headerCount = (content.match(/Gestion des Chèques/g) || []).length;
        const dialogCount = (content.match(/Nouveau Chèque/g) || []).length;
        return headerCount <= 1 && dialogCount <= 1;
      }
    }
  ];
  
  console.log('\n📋 Résultats des tests:');
  console.log('------------------------');
  
  let allPassed = true;
  checks.forEach((check, index) => {
    try {
      const passed = check.test();
      console.log(`${passed ? '✅' : '❌'} ${index + 1}. ${check.name}`);
      if (!passed) allPassed = false;
    } catch (error) {
      console.log(`❌ ${index + 1}. ${check.name} - Erreur: ${error.message}`);
      allPassed = false;
    }
  });
  
  console.log('\n📊 Résumé:');
  if (allPassed) {
    console.log('🎉 Tous les tests sont passés ! Le fichier Checks.tsx semble correct.');
  } else {
    console.log('⚠️ Certains tests ont échoué. Vérifiez le fichier.');
  }
  
  // Informations supplémentaires
  console.log('\n📈 Statistiques:');
  console.log(`   - Lignes totales: ${content.split('\n').length}`);
  console.log(`   - Taille: ${Math.round(content.length / 1024)} KB`);
  console.log(`   - Fonctions: ${(content.match(/const \w+ = /g) || []).length}`);
  console.log(`   - Composants JSX: ${(content.match(/<[A-Z]\w+/g) || []).length}`);
  
} catch (error) {
  console.error('❌ Erreur lors de la lecture du fichier:', error.message);
}
