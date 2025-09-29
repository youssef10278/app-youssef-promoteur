const fs = require('fs');
const path = require('path');

const servicesDir = 'src/services';
const files = fs.readdirSync(servicesDir).filter(file => file.endsWith('.ts'));

console.log('🔧 Correction des imports Supabase vers API...\n');

files.forEach(file => {
  const filePath = path.join(servicesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remplacer l'import Supabase par l'import API
  const oldImport = /import { supabase } from ['"]@\/integrations\/supabase\/client['"];?/g;
  const newImport = "import { apiClient } from '@/integrations/api/client';";
  
  if (oldImport.test(content)) {
    content = content.replace(oldImport, newImport);
    console.log(`✅ ${file} - Import corrigé`);
    
    // Sauvegarder le fichier modifié
    fs.writeFileSync(filePath, content);
  } else {
    console.log(`⚠️  ${file} - Pas d'import Supabase trouvé`);
  }
});

console.log('\n🎉 Correction terminée !');
console.log('⚠️  ATTENTION: Les services nécessitent encore une migration manuelle des méthodes.');
console.log('   Pour l\'instant, utilisez seulement projectService.ts qui est migré.');
