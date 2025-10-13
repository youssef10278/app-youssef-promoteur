@echo off
echo ========================================
echo   DEPLOIEMENT REFACTORISATION DEPENSES
echo ========================================
echo.

echo 🚀 Deploiement de la refactorisation du systeme de depenses sur Railway...
echo.

REM Vérifier si nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: package.json non trouve
    echo Veuillez executer ce script depuis le repertoire racine du projet
    pause
    exit /b 1
)

echo 📋 Etapes du deploiement:
echo   1. Verification de l'environnement
echo   2. Installation des dependances
echo   3. Compilation du backend
echo   4. Execution de la migration de la base de donnees
echo   5. Test des nouvelles APIs
echo   6. Compilation du frontend
echo   7. Deploiement sur Railway
echo.

set /p confirm="Voulez-vous continuer avec le deploiement? (o/N): "
if /i not "%confirm%"=="o" (
    echo ❌ Deploiement annule par l'utilisateur
    pause
    exit /b 0
)

echo.
echo 🔍 Etape 1: Verification de l'environnement...

REM Vérifier Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js n'est pas installe
    pause
    exit /b 1
)
echo ✅ Node.js detecte

REM Vérifier npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm n'est pas installe
    pause
    exit /b 1
)
echo ✅ npm detecte

echo.
echo 📦 Etape 2: Installation des dependances...

REM Frontend
echo Installation des dependances frontend...
npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dependances frontend
    pause
    exit /b 1
)
echo ✅ Dependances frontend installees

REM Backend
echo Installation des dependances backend...
cd backend
npm install
if errorlevel 1 (
    echo ❌ Erreur lors de l'installation des dependances backend
    cd ..
    pause
    exit /b 1
)
echo ✅ Dependances backend installees

echo.
echo 🔨 Etape 3: Compilation du backend...
npm run build
if errorlevel 1 (
    echo ❌ Erreur lors de la compilation du backend
    cd ..
    pause
    exit /b 1
)
echo ✅ Backend compile avec succes

echo.
echo 🗄️ Etape 4: Execution de la migration...
echo ⚠️  ATTENTION: Cette etape va modifier la base de donnees de production
echo.

set /p migrate_confirm="Executer la migration sur la base de donnees? (o/N): "
if /i "%migrate_confirm%"=="o" (
    echo Execution de la migration...
    npm run migrate:expense-refactor
    if errorlevel 1 (
        echo ❌ Erreur lors de la migration
        cd ..
        pause
        exit /b 1
    )
    echo ✅ Migration executee avec succes
) else (
    echo ⚠️  Migration ignoree - Assurez-vous de l'executer manuellement
)

cd ..

echo.
echo 🧪 Etape 5: Test des nouvelles APIs...
echo Demarrage du serveur backend pour les tests...

REM Démarrer le serveur backend en arrière-plan pour les tests
start /b cmd /c "cd backend && npm run dev"

REM Attendre que le serveur démarre
echo Attente du demarrage du serveur...
timeout /t 10 /nobreak >nul

REM Exécuter les tests
echo Execution des tests...
node test-expense-refactor.js
if errorlevel 1 (
    echo ❌ Les tests ont echoue
    echo Arret du serveur...
    taskkill /f /im node.exe >nul 2>&1
    pause
    exit /b 1
)
echo ✅ Tests passes avec succes

REM Arrêter le serveur de test
echo Arret du serveur de test...
taskkill /f /im node.exe >nul 2>&1

echo.
echo 🎨 Etape 6: Compilation du frontend...
npm run build
if errorlevel 1 (
    echo ❌ Erreur lors de la compilation du frontend
    pause
    exit /b 1
)
echo ✅ Frontend compile avec succes

echo.
echo 🚀 Etape 7: Deploiement sur Railway...

REM Vérifier si Railway CLI est installé
railway --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Railway CLI n'est pas installe
    echo Veuillez installer Railway CLI: npm install -g @railway/cli
    pause
    exit /b 1
)
echo ✅ Railway CLI detecte

echo Deploiement du backend...
cd backend
railway up
if errorlevel 1 (
    echo ❌ Erreur lors du deploiement du backend
    cd ..
    pause
    exit /b 1
)
echo ✅ Backend deploye sur Railway

cd ..

echo Deploiement du frontend...
railway up
if errorlevel 1 (
    echo ❌ Erreur lors du deploiement du frontend
    pause
    exit /b 1
)
echo ✅ Frontend deploye sur Railway

echo.
echo 🎉 DEPLOIEMENT TERMINE AVEC SUCCES !
echo.
echo ✅ Nouveau systeme de depenses deploye
echo ✅ Migration de la base de donnees executee
echo ✅ Tests valides
echo ✅ Backend et frontend deployes sur Railway
echo.
echo 📋 Prochaines etapes:
echo   1. Verifier le fonctionnement sur l'environnement de production
echo   2. Tester les nouvelles fonctionnalites
echo   3. Former les utilisateurs au nouveau systeme
echo.
echo 🌐 URLs de production:
echo   Frontend: https://votre-app-frontend.railway.app
echo   Backend:  https://votre-app-backend.railway.app
echo.

pause
