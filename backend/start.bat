@echo off
echo 🚀 Démarrage du backend Promoteur Immobilier Pro...
echo.

echo 📦 Installation des dépendances...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances
    pause
    exit /b 1
)

echo.
echo 🔨 Compilation TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de la compilation
    pause
    exit /b 1
)

echo.
echo 🗄️ Exécution des migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo ⚠️ Erreur lors des migrations (vérifiez PostgreSQL)
    echo Continuons quand même...
)

echo.
echo 🌟 Démarrage du serveur...
call npm run dev
