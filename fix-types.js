// Script pour corriger les types TypeScript dans les routes
import fs from 'fs';
import path from 'path';

const routesDir = './backend/src/routes';
const files = ['sales.ts', 'payments.ts', 'expenses.ts', 'checks.ts'];

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  
  if (fs.existsSync(filePath)) {
    console.log(`🔧 Correction de ${file}...`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Ajouter les imports Request et Response si pas déjà présents
    if (!content.includes('Request, Response')) {
      content = content.replace(
        "import { Router } from 'express';",
        "import { Router, Request, Response } from 'express';"
      );
    }
    
    // Corriger tous les handlers
    content = content.replace(
      /asyncHandler\(async \(req, res\)/g,
      'asyncHandler(async (req: Request, res: Response)'
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} corrigé`);
  } else {
    console.log(`⚠️  ${file} non trouvé`);
  }
});

console.log('🎉 Correction terminée !');
