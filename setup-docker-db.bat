@echo off
echo.
echo ========================================
echo 🐳 Configuration PostgreSQL avec Docker
echo ========================================
echo.

echo 📋 Vérification de Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker n'est pas installé
    echo 💡 Installez Docker Desktop depuis https://www.docker.com/products/docker-desktop/
    echo 💡 Ou utilisez setup-supabase-db.bat pour une DB cloud
    pause
    exit /b 1
)

echo ✅ Docker détecté

echo.
echo 🗄️  Démarrage de PostgreSQL...
docker run --name promoteur-postgres ^
  -e POSTGRES_DB=promoteur_db ^
  -e POSTGRES_USER=promoteur_user ^
  -e POSTGRES_PASSWORD=promoteur_password ^
  -p 5432:5432 ^
  -d postgres:15

if %errorlevel% neq 0 (
    echo ⚠️  Le conteneur existe peut-être déjà, tentative de redémarrage...
    docker start promoteur-postgres
)

echo ✅ PostgreSQL démarré sur le port 5432

echo.
echo 🔧 Mise à jour du fichier .env...

(
echo # Database Configuration
echo DATABASE_URL=postgresql://promoteur_user:promoteur_password@localhost:5432/promoteur_db
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=promoteur_db
echo DB_USER=promoteur_user
echo DB_PASSWORD=promoteur_password
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
echo ⏳ Attente que PostgreSQL soit prêt...
timeout /t 5 /nobreak >nul

echo.
echo 🚀 Création des tables...
cd backend
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
    echo.
    echo 💡 Pour arrêter PostgreSQL : docker stop promoteur-postgres
    echo 💡 Pour redémarrer : docker start promoteur-postgres
) else (
    echo.
    echo ❌ Erreur lors de la création des tables
    echo 💡 Vérifiez que PostgreSQL est bien démarré
    echo 💡 Logs Docker : docker logs promoteur-postgres
)

pause
