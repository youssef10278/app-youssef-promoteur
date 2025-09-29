@echo off
REM ============================================================================
REM Script Windows pour exécuter la migration des colonnes montant_declare
REM ============================================================================

echo.
echo ========================================
echo   MIGRATION: Colonnes montant_declare
echo ========================================
echo.

REM Vérifier que Node.js est installé
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] Node.js n'est pas installe ou n'est pas dans le PATH
    echo Veuillez installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

REM Vérifier que npm est installé
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERREUR] npm n'est pas installe
    pause
    exit /b 1
)

echo [INFO] Node.js et npm sont installes
echo.

REM Se déplacer dans le dossier backend
cd /d "%~dp0"

REM Vérifier que les dépendances sont installées
if not exist "node_modules" (
    echo [INFO] Installation des dependances...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] Echec de l'installation des dependances
        pause
        exit /b 1
    )
)

echo [INFO] Execution de la migration...
echo.

REM Exécuter le script de migration avec ts-node
call npx ts-node src/scripts/run-migration.ts

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   MIGRATION TERMINEE AVEC SUCCES
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   ERREUR LORS DE LA MIGRATION
    echo ========================================
)

echo.
pause

