@echo off
echo ========================================
echo   MIGRATION SYSTEME DEPENSES - RAILWAY
echo ========================================
echo.

echo 🚀 Preparation de la migration du systeme de depenses...
echo.

REM Vérifier si nous sommes dans le bon répertoire
if not exist "package.json" (
    echo ❌ Erreur: package.json non trouve
    echo Veuillez executer ce script depuis le repertoire backend/
    pause
    exit /b 1
)

REM Vérifier si les dépendances sont installées
if not exist "node_modules" (
    echo 📦 Installation des dependances...
    npm install
    if errorlevel 1 (
        echo ❌ Erreur lors de l'installation des dependances
        pause
        exit /b 1
    )
)

echo 🔍 Verification de l'environnement...
echo.

REM Afficher les variables d'environnement importantes (sans les mots de passe)
echo Variables d'environnement detectees:
if defined NODE_ENV echo   NODE_ENV: %NODE_ENV%
if defined DB_HOST echo   DB_HOST: %DB_HOST%
if defined DB_PORT echo   DB_PORT: %DB_PORT%
if defined DB_NAME echo   DB_NAME: %DB_NAME%
if defined DB_USER echo   DB_USER: %DB_USER%
if defined DATABASE_URL echo   DATABASE_URL: [CONFIGURE]
echo.

echo ⚠️  ATTENTION: Cette migration va modifier la structure de la base de donnees
echo.
echo Modifications prevues:
echo   - Ajout de la table expense_payments
echo   - Modification de la table expenses (ajout statut)
echo   - Creation de vues et triggers automatiques
echo   - Migration des donnees existantes
echo.

set /p confirm="Voulez-vous continuer? (o/N): "
if /i not "%confirm%"=="o" (
    echo ❌ Migration annulee par l'utilisateur
    pause
    exit /b 0
)

echo.
echo 🔄 Execution de la migration...
echo.

REM Exécuter la migration
npm run migrate:expense-refactor

if errorlevel 1 (
    echo.
    echo ❌ ERREUR: La migration a echoue
    echo.
    echo Solutions possibles:
    echo   1. Verifier la connexion a la base de donnees
    echo   2. Verifier les variables d'environnement
    echo   3. Consulter les logs ci-dessus pour plus de details
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Migration terminee avec succes !
echo.
echo 🎉 Le nouveau systeme de depenses est maintenant actif:
echo   - Creation de depenses sans montant initial
echo   - Ajout progressif de paiements
echo   - Calcul automatique des totaux
echo   - Historique complet des paiements
echo.

echo 📋 Prochaines etapes:
echo   1. Redemarrer le serveur backend
echo   2. Tester les nouvelles fonctionnalites
echo   3. Deployer sur Railway si necessaire
echo.

pause
