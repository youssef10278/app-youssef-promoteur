@echo off
echo 🔧 Résolution des problèmes PowerShell...
echo.

echo 📋 Diagnostic de l'environnement...
echo Node.js version:
node --version
echo.
echo NPM version:
npm --version
echo.

echo 🧹 Nettoyage du cache npm...
cd backend
call npm cache clean --force

echo 🔄 Réinstallation des dépendances...
rmdir /s /q node_modules 2>nul
call npm install

echo 🔧 Compilation forcée...
call npm run build

echo ✅ Environnement nettoyé !
echo.
echo 🚀 Test de démarrage...
echo Tentative de démarrage du backend...

start "Backend Server" cmd /k "cd /d %CD% && node dist/server.js"

echo.
echo 📍 Le backend devrait démarrer dans une nouvelle fenêtre
echo 💡 Si ça ne fonctionne pas, utilisez: node dist/server.js
pause
