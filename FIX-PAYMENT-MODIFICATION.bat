@echo off
REM ============================================================================
REM Script de correction rapide du problème de modification des paiements
REM ============================================================================

color 0A
title Correction - Modification des Paiements

echo.
echo ============================================================
echo    CORRECTION DU PROBLEME DE MODIFICATION DES PAIEMENTS
echo ============================================================
echo.
echo Ce script va:
echo   1. Verifier l'etat actuel de la base de donnees
echo   2. Executer la migration necessaire
echo   3. Verifier que la correction a fonctionne
echo.
echo ============================================================
echo.

pause

REM Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo [ERREUR] Node.js n'est pas installe
    echo.
    echo Veuillez installer Node.js depuis: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js est installe
echo.

REM Se déplacer dans le dossier backend
if not exist "backend" (
    color 0C
    echo [ERREUR] Le dossier backend n'existe pas
    echo Assurez-vous d'executer ce script depuis la racine du projet
    echo.
    pause
    exit /b 1
)

cd backend

REM Vérifier que les dépendances sont installées
if not exist "node_modules" (
    echo [INFO] Installation des dependances du backend...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        color 0C
        echo [ERREUR] Echec de l'installation des dependances
        echo.
        pause
        exit /b 1
    )
    echo [OK] Dependances installees
    echo.
)

echo ============================================================
echo    ETAPE 1: VERIFICATION DE L'ETAT ACTUEL
echo ============================================================
echo.

call npm run verify:schema

echo.
echo ============================================================
echo    ETAPE 2: EXECUTION DE LA MIGRATION
echo ============================================================
echo.
echo Appuyez sur une touche pour executer la migration...
pause >nul

call npm run migrate:declared-amounts

if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================================
    echo    ERREUR LORS DE LA MIGRATION
    echo ============================================================
    echo.
    echo Consultez les logs ci-dessus pour plus de details
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo    ETAPE 3: VERIFICATION POST-MIGRATION
echo ============================================================
echo.

call npm run verify:schema

echo.
echo ============================================================
echo    CORRECTION TERMINEE
echo ============================================================
echo.
echo Prochaines etapes:
echo   1. Demarrer le backend: cd backend ^&^& npm run dev
echo   2. Demarrer le frontend: npm run dev
echo   3. Tester la modification d'un paiement
echo.
echo Pour plus d'informations, consultez:
echo   - GUIDE-RESOLUTION-MODIFICATION-PAIEMENTS.md
echo   - backend/GUIDE-MIGRATION-DECLARED-AMOUNTS.md
echo.

color 0A
pause

