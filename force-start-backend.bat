@echo off
setlocal

echo ========================================
echo 🔧 RESOLUTION PROBLEME POWERSHELL
echo ========================================
echo.

echo 🧹 Nettoyage de l'environnement...
set NODE_OPTIONS=
set npm_config_cache=
set npm_config_prefix=

echo 📍 Changement vers le répertoire backend...
pushd backend

echo 🔍 Vérification des fichiers...
if not exist "dist\server.js" (
    echo ⚠️  Compilation nécessaire...
    echo 🔧 Compilation avec TypeScript...
    call npx tsc
    if errorlevel 1 (
        echo ❌ Erreur de compilation
        popd
        pause
        exit /b 1
    )
)

echo 🐳 Vérification de PostgreSQL...
docker ps | findstr "promoteur-postgres" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Démarrage de PostgreSQL...
    docker start promoteur-postgres >nul 2>&1
    timeout /t 3 /nobreak >nul
)

echo.
echo ========================================
echo 🚀 DEMARRAGE DU BACKEND
echo ========================================
echo 📍 Port: 3001
echo 🌐 URL: http://localhost:3001
echo 💡 Appuyez sur Ctrl+C pour arrêter
echo ========================================
echo.

REM Démarrage direct avec Node.js
node dist\server.js

echo.
echo 🛑 Serveur arrêté
popd
pause
