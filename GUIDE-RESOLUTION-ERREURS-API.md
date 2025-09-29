# 🔧 Guide de Résolution des Erreurs API

## 🚨 Problème Identifié

Les erreurs suivantes apparaissent sur la page gestion des chèques :
- `Failed to load resource: the server responded with a status of 500 (Internal Server Error)`
- `Connection terminated due to connection timeout`

## 🔍 Causes Probables

1. **Connexion à la base de données** : PostgreSQL non accessible ou mal configuré
2. **Configuration manquante** : Fichier `.env` manquant ou mal configuré
3. **Tables manquantes** : Base de données non initialisée
4. **Timeouts** : Connexions trop lentes ou bloquées

## 🛠️ Solutions Implémentées

### 1. **Amélioration de la Gestion des Connexions DB**
- ✅ Augmentation des timeouts de connexion (10 secondes)
- ✅ Ajout de `acquireTimeoutMillis` pour éviter les blocages
- ✅ Amélioration de la gestion d'erreur dans la fonction `query`
- ✅ Libération explicite des connexions

### 2. **Scripts de Diagnostic**
- ✅ `backend/test-db-connection.js` - Test de connexion DB
- ✅ `backend/diagnostic-api.js` - API de diagnostic complète
- ✅ `fix-api-errors.js` - Test des routes problématiques
- ✅ `quick-test-backend.js` - Test rapide du backend

### 3. **Configuration d'Environnement**
- ✅ `backend/env-example.txt` - Exemple de configuration
- ✅ `fix-backend-issues.bat` - Script de correction automatique

## 🚀 Étapes de Résolution

### **Étape 1 : Vérification Rapide**
```bash
# Test rapide du backend
node quick-test-backend.js
```

### **Étape 2 : Configuration de la Base de Données**
```bash
# 1. Créer le fichier .env si manquant
copy backend\env-example.txt backend\.env

# 2. Modifier les paramètres dans backend/.env selon votre configuration
# 3. Tester la connexion DB
cd backend
node test-db-connection.js
```

### **Étape 3 : Diagnostic Complet**
```bash
# 1. Démarrer l'API de diagnostic
node backend/diagnostic-api.js

# 2. Dans un autre terminal, lancer le diagnostic
node fix-api-errors.js
```

### **Étape 4 : Redémarrage du Backend**
```bash
# Arrêter le backend actuel (Ctrl+C)
# Puis redémarrer
cd backend
npm run dev
```

## 🔧 Configuration Requise

### **Fichier backend/.env**
```env
# Configuration de la base de données
DB_HOST=localhost
DB_PORT=5433
DB_NAME=promoteur_db
DB_USER=postgres
DB_PASSWORD=password

# Configuration JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Configuration serveur
NODE_ENV=development
PORT=3001

# CORS
CORS_ORIGIN=http://localhost:8080
```

### **Base de Données PostgreSQL**
1. **Démarrer PostgreSQL** sur le port 5433
2. **Créer la base de données** : `promoteur_db`
3. **Exécuter le script** : `create-tables.sql`

## 🧪 Tests de Validation

### **Test 1 : Backend Accessible**
```bash
curl http://localhost:3001/health
# Doit retourner: {"status":"OK",...}
```

### **Test 2 : Connexion DB**
```bash
cd backend
node test-db-connection.js
# Doit afficher: "✅ Connexion à PostgreSQL établie"
```

### **Test 3 : Routes Protégées**
```bash
node quick-test-backend.js
# Les routes doivent retourner 401 (authentification requise)
```

## 🚨 Dépannage Avancé

### **Si PostgreSQL n'est pas accessible :**
1. Vérifiez que PostgreSQL est démarré
2. Vérifiez le port (5433 par défaut)
3. Vérifiez les identifiants dans `.env`

### **Si les tables n'existent pas :**
1. Connectez-vous à PostgreSQL
2. Créez la base : `CREATE DATABASE promoteur_db;`
3. Exécutez : `psql -d promoteur_db -f create-tables.sql`

### **Si les timeouts persistent :**
1. Augmentez les timeouts dans `database.ts`
2. Vérifiez les performances de votre machine
3. Considérez utiliser une base de données locale plus rapide

## 📊 Monitoring

### **Logs à Surveiller**
- `🔧 Configuration PostgreSQL:` - Configuration de connexion
- `✅ Connexion à PostgreSQL établie` - Connexion réussie
- `❌ Erreur PostgreSQL:` - Erreurs de connexion
- `📊 Requête exécutée` - Requêtes réussies
- `❌ Erreur de requête:` - Erreurs de requête

### **Indicateurs de Santé**
- ✅ Backend répond sur `/health`
- ✅ Connexion DB établie
- ✅ Tables accessibles
- ✅ Routes protégées retournent 401 (pas 500)

## 🎯 Résultat Attendu

Après application de ces corrections :
1. **Page gestion des chèques** se charge sans erreurs 500
2. **Dashboard** affiche les statistiques correctement
3. **Toutes les pages** fonctionnent normalement
4. **Logs du backend** montrent des connexions réussies

## 📞 Support

Si les problèmes persistent :
1. Consultez les logs du backend
2. Vérifiez la configuration de PostgreSQL
3. Testez avec l'API de diagnostic
4. Vérifiez que toutes les tables existent

---

**🎉 Une fois ces étapes suivies, votre application devrait fonctionner correctement !**
