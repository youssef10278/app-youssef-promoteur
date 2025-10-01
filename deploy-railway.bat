@echo off
echo 🚀 DEPLOIEMENT RAILWAY - Promoteur Immobilier Pro
echo ================================================

echo.
echo 📋 Verification des prerequis...

:: Vérifier si Railway CLI est installé
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Railway CLI n'est pas installé
    echo 📥 Installation de Railway CLI...
    npm install -g @railway/cli
    if %errorlevel% neq 0 (
        echo ❌ Erreur lors de l'installation de Railway CLI
        pause
        exit /b 1
    )
)

echo ✅ Railway CLI installé

:: Vérifier si l'utilisateur est connecté
railway whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔐 Connexion à Railway...
    railway login
    if %errorlevel% neq 0 (
        echo ❌ Erreur de connexion à Railway
        pause
        exit /b 1
    )
)

echo ✅ Connecté à Railway

echo.
echo 🏗️ Preparation du projet...

:: Build du backend
echo 📦 Build du backend...
cd backend
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build du backend
    cd ..
    pause
    exit /b 1
)
cd ..

:: Build du frontend
echo 📦 Build du frontend...
call npm install
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build du frontend
    pause
    exit /b 1
)

echo ✅ Builds terminés

echo.
echo 🚀 Déploiement sur Railway...

:: Créer ou connecter le projet Railway
echo 📡 Configuration du projet Railway...
railway project

echo.
echo 🎉 Déploiement terminé !
echo.
echo 📋 Prochaines étapes :
echo 1. Configurez les variables d'environnement dans Railway
echo 2. Ajoutez une base de données PostgreSQL
echo 3. Mettez à jour les URLs dans les variables d'environnement
echo.
echo 🔗 Ouvrir Railway Dashboard :
railway open

pause
