@echo off
REM ============================================================================
REM Script de vérification du schéma de la base de données
REM ============================================================================

echo.
echo ========================================
echo   VERIFICATION DU SCHEMA
echo ========================================
echo.

REM Configuration (à adapter selon votre environnement)
set DB_HOST=localhost
set DB_PORT=5433
set DB_NAME=promoteur_db
set DB_USER=postgres

echo [INFO] Configuration:
echo   - Host: %DB_HOST%
echo   - Port: %DB_PORT%
echo   - Database: %DB_NAME%
echo   - User: %DB_USER%
echo.

REM Vérifier que psql est installé
where psql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] psql n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer PostgreSQL ou ajouter psql au PATH
    echo.
    pause
    exit /b 1
)

echo [INFO] Verification de la connexion...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT NOW();" >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Impossible de se connecter a la base de donnees
    echo Verifiez que PostgreSQL est demarre et que les credentials sont corrects
    echo.
    pause
    exit /b 1
)

echo [OK] Connexion etablie
echo.

echo ========================================
echo   VERIFICATION DES COLONNES
echo ========================================
echo.

echo [INFO] Verification de la table payment_plans...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT column_name, data_type, column_default FROM information_schema.columns WHERE table_name = 'payment_plans' AND column_name IN ('montant_declare', 'montant_non_declare') ORDER BY column_name;"

echo.
echo ========================================
echo   STATISTIQUES
echo ========================================
echo.

echo [INFO] Statistiques de la table payment_plans...
psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -c "SELECT COUNT(*) as total_plans, COUNT(montant_declare) as with_declare, COUNT(montant_non_declare) as with_non_declare FROM payment_plans;"

echo.
echo ========================================
echo   VERIFICATION TERMINEE
echo ========================================
echo.

pause

