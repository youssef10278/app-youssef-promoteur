@echo off
echo 🚀 Démarrage du backend...
cd backend
echo 📍 Répertoire: %CD%
echo 🔧 Compilation...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    pause
    exit /b 1
)
echo ✅ Compilation réussie
echo 🌐 Démarrage du serveur...
node dist/server.js
pause
