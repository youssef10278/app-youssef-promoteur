@echo off
echo ========================================
echo   MIGRATION RAILWAY PRODUCTION
echo ========================================
echo.

echo 🚀 Migration de la base de donnees Railway...
echo.

REM Vérifier si Railway CLI est installé
railway --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Railway CLI n'est pas installe
    echo Veuillez installer Railway CLI: npm install -g @railway/cli
    pause
    exit /b 1
)
echo ✅ Railway CLI detecte

echo.
echo ⚠️  ATTENTION: Cette operation va modifier la base de donnees de PRODUCTION
echo.

set /p confirm="Voulez-vous continuer avec la migration sur Railway? (o/N): "
if /i not "%confirm%"=="o" (
    echo ❌ Migration annulee par l'utilisateur
    pause
    exit /b 0
)

echo.
echo 🔍 Connexion a Railway...

REM Se connecter au projet Railway
railway login

echo.
echo 📋 Selection du projet...
railway link

echo.
echo 🗄️ Execution de la migration...

REM Copier le script de migration dans le backend
copy fix-expense-migration-final.cjs backend\migrate-railway.cjs

REM Exécuter la migration via Railway
cd backend
railway run node migrate-railway.cjs

if errorlevel 1 (
    echo ❌ Erreur lors de la migration
    pause
    exit /b 1
)

echo.
echo 🎉 MIGRATION TERMINEE AVEC SUCCES !
echo ✅ Base de donnees Railway mise a jour
echo ✅ Vue expenses_with_totals creee
echo ✅ Systeme de depenses progressives operationnel

echo.
echo 🔄 Redemarrage du service Railway...
railway up --detach

echo.
echo ✅ Migration et redemarrage termines
echo 🌐 Votre application est maintenant a jour sur Railway

pause
