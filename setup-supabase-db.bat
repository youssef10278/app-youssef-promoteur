@echo off
echo.
echo ========================================
echo 🗄️  Configuration Base de Données Cloud
echo ========================================
echo.

echo 📋 Instructions pour Supabase (Gratuit) :
echo.
echo 1. Allez sur https://supabase.com
echo 2. Créez un compte gratuit
echo 3. Cliquez sur "New Project"
echo 4. Choisissez un nom : "promoteur-immobilier"
echo 5. Définissez un mot de passe fort
echo 6. Région : Europe West (Ireland)
echo 7. Attendez 2-3 minutes que le projet soit créé
echo.
echo 8. Dans votre projet, allez dans Settings ^> Database
echo 9. Copiez la "Connection string" (URI)
echo 10. Remplacez [YOUR-PASSWORD] par votre mot de passe
echo.

pause

echo.
echo 📝 Collez votre DATABASE_URL ici et appuyez sur Entrée :
set /p DATABASE_URL="DATABASE_URL="

echo.
echo 🔧 Mise à jour du fichier .env...

(
echo # Database Configuration
echo DATABASE_URL=%DATABASE_URL%
echo DB_HOST=localhost
echo DB_PORT=5432
echo DB_NAME=promoteur_db
echo DB_USER=postgres
echo DB_PASSWORD=password
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
echo 🚀 Test de la connexion...
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
) else (
    echo.
    echo ❌ Erreur de connexion à la base de données
    echo 💡 Vérifiez votre DATABASE_URL et réessayez
)

pause
