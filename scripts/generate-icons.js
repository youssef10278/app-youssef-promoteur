import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const inputSvg = 'public/icons/app-icon.svg';
const outputDir = 'public/icons';

// Créer le répertoire de sortie s'il n'existe pas
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Générer les icônes pour chaque taille
async function generateIcons() {
  try {
    for (const size of sizes) {
      const outputPath = path.join(outputDir, `icon-${size}x${size}.png`);
      
      await sharp(inputSvg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Icône générée: ${outputPath}`);
    }
    
    console.log('🎉 Toutes les icônes ont été générées avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la génération des icônes:', error);
  }
}

generateIcons();
