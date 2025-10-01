@echo off
echo 🔧 PREPARATION POUR RAILWAY
echo =========================

echo.
echo 📦 Nettoyage des node_modules...
if exist node_modules rmdir /s /q node_modules
if exist backend\node_modules rmdir /s /q backend\node_modules

echo.
echo 🗑️ Suppression des lockfiles problématiques...
if exist package-lock.json del package-lock.json
if exist backend\package-lock.json del backend\package-lock.json
if exist yarn.lock del yarn.lock
if exist backend\yarn.lock del backend\yarn.lock
if exist bun.lockb del bun.lockb

echo.
echo 📥 Réinstallation des dépendances...
echo Frontend...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Erreur installation frontend
    pause
    exit /b 1
)

echo Backend...
cd backend
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo ❌ Erreur installation backend
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo 🧪 Test des builds...
echo Frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur build frontend
    pause
    exit /b 1
)

echo Backend...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur build backend
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ✅ PREPARATION TERMINEE !
echo.
echo 📋 Prochaines étapes :
echo 1. Commitez et pushez les changements sur GitHub
echo 2. Dans Railway, redéployez le service qui a échoué
echo 3. Les nouveaux fichiers de configuration devraient résoudre le problème
echo.

pause
