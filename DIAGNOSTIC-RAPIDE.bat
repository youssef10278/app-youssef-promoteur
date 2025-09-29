@echo off
echo ========================================
echo 🔍 DIAGNOSTIC RAPIDE PROBLEME POWERSHELL
echo ========================================
echo.

echo 📋 Informations système :
echo OS: %OS%
echo Utilisateur: %USERNAME%
echo Répertoire: %CD%
echo.

echo 🔍 Vérification Node.js :
node --version
echo.

echo 🔍 Vérification NPM :
npm --version
echo.

echo 🔍 Variables d'environnement suspectes :
set | findstr /i "node"
set | findstr /i "npm"
set | findstr /i "test"
echo.

echo 🔍 Processus Node.js en cours :
tasklist | findstr /i "node"
echo.

echo 🔍 Ports utilisés :
netstat -an | findstr ":3001"
netstat -an | findstr ":5173"
echo.

echo 🐳 Conteneurs Docker :
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo 📁 Contenu répertoire backend :
dir backend\dist\server.js
echo.

echo 🔍 Test direct Node.js :
echo Tentative de démarrage direct...
cd backend
echo Répertoire actuel: %CD%
echo.
echo === DEMARRAGE BACKEND ===
node dist\server.js

pause
