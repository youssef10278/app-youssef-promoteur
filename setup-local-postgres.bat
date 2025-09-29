@echo off
echo.
echo ========================================
echo 🗄️  Configuration PostgreSQL Local
echo ========================================
echo.

echo 📋 Prérequis : PostgreSQL doit être installé
echo 💡 Si pas installé : https://www.postgresql.org/download/windows/
echo.

echo 📝 Configuration de la connexion :
echo.
set /p DB_HOST="Host PostgreSQL (défaut: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Port PostgreSQL (défaut: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_USER="Utilisateur PostgreSQL (défaut: postgres): "
if "%DB_USER%"=="" set DB_USER=postgres

set /p DB_PASSWORD="Mot de passe PostgreSQL: "

set /p DB_NAME="Nom de la base (défaut: promoteur_db): "
if "%DB_NAME%"=="" set DB_NAME=promoteur_db

echo.
echo 🔧 Mise à jour du fichier .env...

(
echo # Database Configuration
echo DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_NAME=%DB_NAME%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo.
echo # JWT Configuration
echo JWT_SECRET=super-secret-jwt-key-change-this-in-production-2024
echo JWT_EXPIRES_IN=7d
echo JWT_REFRESH_SECRET=super-secret-refresh-token-2024
echo JWT_REFRESH_EXPIRES_IN=30d
echo.
echo # Server Configuration
echo PORT=3001
echo NODE_ENV=development
echo CORS_ORIGIN=http://localhost:5173
echo.
echo # Rate Limiting
echo RATE_LIMIT_WINDOW_MS=900000
echo RATE_LIMIT_MAX_REQUESTS=100
echo.
echo # Security
echo BCRYPT_ROUNDS=12
) > backend\.env

echo ✅ Fichier .env mis à jour !

echo.
echo 🗄️  Création de la base de données...
echo CREATE DATABASE %DB_NAME%; | psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER%

echo.
echo 🚀 Création des tables...
cd backend
call npm run build
call npm run migrate

if %errorlevel% equ 0 (
    echo.
    echo ✅ Base de données configurée avec succès !
    echo 🎉 Votre application est maintenant 100%% fonctionnelle !
    echo.
    echo 📍 Prochaines étapes :
    echo    1. cd backend ^&^& npm run dev
    echo    2. Dans un autre terminal : npm run dev
    echo    3. Ouvrez http://localhost:5173
) else (
    echo.
    echo ❌ Erreur lors de la création des tables
    echo 💡 Vérifiez que PostgreSQL est démarré
    echo 💡 Vérifiez les informations de connexion
)

pause
