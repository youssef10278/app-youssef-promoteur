#!/usr/bin/env node

// Script de démarrage pour Railway
import { spawn } from 'child_process';

const PORT = process.env.PORT || 8080;

console.log(`🚀 Démarrage du frontend sur le port ${PORT}`);
console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'production'}`);

// Démarrer Vite en mode preview
const vite = spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', PORT], {
  stdio: 'inherit',
  env: { ...process.env, PORT }
});

vite.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage:', error);
  process.exit(1);
});

vite.on('close', (code) => {
  console.log(`🛑 Processus terminé avec le code ${code}`);
  process.exit(code);
});

// Gestion propre de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 Signal SIGTERM reçu, arrêt du serveur...');
  vite.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('🛑 Signal SIGINT reçu, arrêt du serveur...');
  vite.kill('SIGINT');
});
