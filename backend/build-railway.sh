#!/bin/bash
echo "🚀 Build Backend Railway personnalisé"

# Supprimer les lockfiles s'ils existent
rm -f package-lock.json
rm -f yarn.lock
rm -f pnpm-lock.yaml

# Installer les dépendances sans lockfile
npm install --no-package-lock --legacy-peer-deps

# Build
npm run build

echo "✅ Build Backend terminé"
