@echo off
echo 🚀 Correction des erreurs du backend
echo ====================================

echo.
echo 📋 Étapes de correction:
echo.

echo 1. Vérification de la configuration...
if not exist "backend\.env" (
    echo ❌ Fichier .env manquant dans backend/
    echo 📝 Création du fichier .env...
    copy "backend\env-example.txt" "backend\.env"
    echo ✅ Fichier .env créé
    echo ⚠️  IMPORTANT: Modifiez les valeurs dans backend/.env selon votre configuration
) else (
    echo ✅ Fichier .env existe
)

echo.
echo 2. Test de connexion à la base de données...
cd backend
node test-db-connection.js
cd ..

echo.
echo 3. Démarrage de l'API de diagnostic...
echo    Ouvrez un nouveau terminal et exécutez: node backend/diagnostic-api.js
echo    Puis dans un autre terminal: node fix-api-errors.js

echo.
echo 4. Redémarrage du backend principal...
echo    Arrêtez le backend actuel (Ctrl+C) puis redémarrez avec:
echo    cd backend
echo    npm run dev

echo.
echo 📋 Si les problèmes persistent:
echo - Vérifiez que PostgreSQL est démarré
echo - Vérifiez les paramètres dans backend/.env
echo - Exécutez create-tables.sql pour créer les tables
echo - Consultez les logs du backend pour plus de détails

pause
