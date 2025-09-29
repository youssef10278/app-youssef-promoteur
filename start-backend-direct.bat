@echo off
title Backend Promoteur Immobilier
echo.
echo ========================================
echo 🚀 Démarrage Direct du Backend
echo ========================================
echo.

cd backend

echo 📍 Répertoire actuel: %CD%
echo.

echo 🔍 Vérification des fichiers...
if not exist "dist\server.js" (
    echo ⚠️  Fichier dist\server.js non trouvé
    echo 🔧 Compilation en cours...
    call tsc
    if %errorlevel% neq 0 (
        echo ❌ Erreur de compilation TypeScript
        pause
        exit /b 1
    )
    echo ✅ Compilation réussie
)

echo 🔍 Vérification de la base de données...
docker ps | findstr promoteur-postgres >nul
if %errorlevel% neq 0 (
    echo ⚠️  Conteneur PostgreSQL non trouvé ou arrêté
    echo 🐳 Démarrage de PostgreSQL...
    docker start promoteur-postgres
    timeout /t 3 /nobreak >nul
)

echo 📊 Variables d'environnement:
echo NODE_ENV=%NODE_ENV%
echo.

echo 🌐 Démarrage du serveur sur le port 3001...
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo.

node dist/server.js

echo.
echo 🛑 Serveur arrêté
pause
