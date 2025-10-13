@echo off
echo ========================================
echo   DEPLOIEMENT SYSTEME DEPENSES FIXES
echo ========================================
echo.

echo 1. Construction du frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERREUR: Echec de la construction du frontend
    pause
    exit /b 1
)

echo.
echo 2. Ajout des fichiers modifies...
git add .

echo.
echo 3. Commit des modifications...
git commit -m "Fix: Correction du systeme de depenses progressives - URLs API et nouveaux composants"

echo.
echo 4. Push vers Railway...
git push origin main

echo.
echo ========================================
echo   DEPLOIEMENT TERMINE !
echo ========================================
echo.
echo Attendez 2-3 minutes que Railway redeploit l'application.
echo Puis testez le nouveau systeme de depenses.
echo.
pause
