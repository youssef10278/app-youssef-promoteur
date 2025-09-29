@echo off
echo.
echo ========================================
echo 🚀 Démarrage Application Complète
echo ========================================
echo.

echo 📋 Choix de la base de données :
echo.
echo 1. Supabase Cloud (Gratuit - Recommandé)
echo 2. Docker PostgreSQL (Local)
echo 3. PostgreSQL installé localement
echo 4. J'ai déjà configuré ma base de données
echo.

set /p choice="Votre choix (1-4) : "

if "%choice%"=="1" (
    echo.
    echo 🌐 Configuration Supabase...
    call setup-supabase-db.bat
) else if "%choice%"=="2" (
    echo.
    echo 🐳 Configuration Docker PostgreSQL...
    call setup-docker-db.bat
) else if "%choice%"=="3" (
    echo.
    echo 💾 Configuration PostgreSQL local...
    echo.
    echo 📝 Entrez votre DATABASE_URL PostgreSQL :
    echo Exemple : postgresql://postgres:password@localhost:5432/promoteur_db
    set /p DATABASE_URL="DATABASE_URL="
    
    echo DATABASE_URL=%DATABASE_URL%> backend\.env.temp
    type backend\.env >> backend\.env.temp
    move backend\.env.temp backend\.env
    
    echo ✅ Configuration mise à jour
    cd backend
    call npm run build
    call npm run migrate
    cd ..
) else if "%choice%"=="4" (
    echo.
    echo ✅ Utilisation de la configuration existante
) else (
    echo ❌ Choix invalide
    pause
    exit /b 1
)

echo.
echo 🔧 Compilation du backend...
cd backend
call npm run build

if %errorlevel% neq 0 (
    echo ❌ Erreur de compilation
    pause
    exit /b 1
)

echo ✅ Backend compilé

echo.
echo 🗄️  Test de la base de données...
call npm run migrate

if %errorlevel% neq 0 (
    echo ❌ Erreur de migration de la base de données
    echo 💡 Vérifiez votre configuration DATABASE_URL
    pause
    exit /b 1
)

echo ✅ Base de données prête

cd ..

echo.
echo 🚀 Démarrage de l'application...
echo.
echo 📍 Backend : http://localhost:3001
echo 📍 Frontend : http://localhost:5173
echo.
echo ⚠️  Gardez cette fenêtre ouverte pendant l'utilisation
echo.

start "Backend API" cmd /k "cd backend && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend App" cmd /k "npm run dev"

echo.
echo 🎉 Application démarrée !
echo.
echo 📋 Prochaines étapes :
echo    1. Attendez que les deux serveurs démarrent
echo    2. Ouvrez http://localhost:5173 dans votre navigateur
echo    3. Créez un compte et testez l'application
echo.
echo 💡 Pour arrêter : fermez les fenêtres de terminal
echo.

pause
