@echo off
echo.
echo ========================================
echo 🚀 Promoteur Immobilier Pro - Dev Mode
echo ========================================
echo.

echo 📋 Vérification des prérequis...

:: Vérifier Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js n'est pas installé
    echo 💡 Installez Node.js depuis https://nodejs.org
    pause
    exit /b 1
)

:: Vérifier npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm n'est pas disponible
    pause
    exit /b 1
)

echo ✅ Node.js et npm sont installés

:: Vérifier PostgreSQL (optionnel pour le développement)
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️  PostgreSQL n'est pas installé localement
    echo 💡 Vous pouvez utiliser une base de données distante
) else (
    echo ✅ PostgreSQL est installé
)

echo.
echo 📦 Installation des dépendances...

:: Installer les dépendances du frontend
echo 🌐 Frontend...
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances frontend
    pause
    exit /b 1
)

:: Installer les dépendances du backend
echo 🔧 Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Erreur lors de l'installation des dépendances backend
    cd ..
    pause
    exit /b 1
)

echo.
echo 🔧 Configuration du backend...

:: Vérifier le fichier .env
if not exist ".env" (
    echo 📝 Création du fichier .env...
    copy .env.example .env >nul 2>&1
    if %errorlevel% neq 0 (
        echo ⚠️  Fichier .env.example non trouvé
        echo 💡 Créez manuellement le fichier .env avec DATABASE_URL
    ) else (
        echo ✅ Fichier .env créé depuis .env.example
        echo ⚠️  N'oubliez pas de configurer DATABASE_URL dans backend/.env
    )
) else (
    echo ✅ Fichier .env existe
)

echo.
echo 🗄️  Préparation de la base de données...

:: Exécuter les migrations
echo 📊 Exécution des migrations...
call npm run migrate
if %errorlevel% neq 0 (
    echo ⚠️  Erreur lors des migrations
    echo 💡 Vérifiez votre configuration DATABASE_URL
    echo 💡 Ou utilisez une base de données distante
)

cd ..

echo.
echo 🚀 Démarrage des services...
echo.
echo 📍 URLs de développement :
echo    🔧 Backend API : http://localhost:3001
echo    🌐 Frontend    : http://localhost:5173
echo.

:: Créer un nouveau terminal pour le backend
echo 🔧 Démarrage du backend...
start "Backend API" cmd /k "cd backend && npm run dev"

:: Attendre un peu pour que le backend démarre
timeout /t 3 /nobreak >nul

:: Démarrer le frontend dans le terminal actuel
echo 🌐 Démarrage du frontend...
echo.
echo ✅ Le backend démarre dans une fenêtre séparée
echo ✅ Le frontend va démarrer ici...
echo.
echo 💡 Conseils :
echo    - Attendez que le backend soit prêt avant d'utiliser l'app
echo    - Utilisez Ctrl+C pour arrêter le frontend
echo    - Fermez la fenêtre "Backend API" pour arrêter le backend
echo.

call npm run dev
