# 🚀 Guide de Déploiement Railway

## 📋 Vue d'ensemble

Ce guide vous accompagne pour déployer votre application **Promoteur Immobilier Pro** sur Railway après la migration de Supabase vers PostgreSQL.

### 🎯 Architecture de Déploiement

```
Railway Project
├── 🗄️  PostgreSQL Database
├── 🔧 Backend API (Node.js/Express)
└── 🌐 Frontend (React/Vite)
```

## 🛠️ Étape 1: Préparation

### 1.1 Vérifier la Migration Locale

Avant de déployer, testez votre migration localement :

```bash
# 1. Démarrer le backend
cd backend
npm install
npm run dev

# 2. Dans un autre terminal, tester la migration
cd ..
node test-migration.js
```

### 1.2 Préparer les Fichiers de Configuration

Créez les fichiers nécessaires pour Railway :

**backend/railway.json**
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

**railway.json** (racine du projet)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run preview",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100
  }
}
```

## 🗄️ Étape 2: Déployer PostgreSQL

### 2.1 Créer le Service PostgreSQL

1. Connectez-vous à [Railway](https://railway.app)
2. Créez un nouveau projet : **"Promoteur Immobilier Pro"**
3. Ajoutez un service **PostgreSQL** :
   - Cliquez sur **"+ New"**
   - Sélectionnez **"Database"** → **"PostgreSQL"**
   - Nommez le service : **"promoteur-db"**

### 2.2 Configurer la Base de Données

Une fois PostgreSQL déployé :

1. Récupérez les variables d'environnement :
   - `DATABASE_URL`
   - `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`

2. Notez ces informations pour l'étape suivante.

## 🔧 Étape 3: Déployer le Backend

### 3.1 Préparer le Backend

1. Créez un nouveau service dans Railway :
   - **"+ New"** → **"GitHub Repo"**
   - Connectez votre repository
   - Sélectionnez le dossier **"backend"** comme root directory

### 3.2 Configurer les Variables d'Environnement

Dans les paramètres du service backend, ajoutez :

```env
# Base de données (copiez depuis le service PostgreSQL)
DATABASE_URL=${{promoteur-db.DATABASE_URL}}

# Configuration JWT
JWT_SECRET=votre-secret-jwt-super-securise-ici
JWT_EXPIRES_IN=7d

# Configuration serveur
NODE_ENV=production
PORT=3001

# CORS (remplacez par votre domaine frontend)
CORS_ORIGIN=https://votre-frontend.railway.app
```

### 3.3 Déployer

1. Railway détectera automatiquement le `package.json`
2. Il installera les dépendances et démarrera avec `npm start`
3. Les migrations s'exécuteront automatiquement au démarrage

## 🌐 Étape 4: Déployer le Frontend

### 4.1 Préparer le Frontend

1. Créez un nouveau service pour le frontend :
   - **"+ New"** → **"GitHub Repo"**
   - Même repository, mais root directory = **"/"** (racine)

### 4.2 Configurer les Variables d'Environnement

```env
# API Backend (remplacez par l'URL de votre backend)
VITE_API_BASE_URL=https://votre-backend.railway.app/api

# Configuration de production
VITE_APP_ENV=production
VITE_APP_NAME="Promoteur Immobilier Pro"
VITE_APP_VERSION=2.0.0
```

### 4.3 Déployer

Railway construira automatiquement votre application React avec Vite.

## 🔗 Étape 5: Configuration Finale

### 5.1 Mettre à Jour les CORS

Une fois le frontend déployé, mettez à jour la variable `CORS_ORIGIN` du backend avec l'URL réelle du frontend.

### 5.2 Tester le Déploiement

1. Accédez à votre frontend Railway
2. Testez la connexion avec un compte test
3. Vérifiez toutes les fonctionnalités

## 📊 Étape 6: Migration des Données (Optionnel)

Si vous avez des données existantes dans Supabase :

### 6.1 Exporter depuis Supabase

```sql
-- Connectez-vous à votre base Supabase et exportez :
COPY profiles TO '/tmp/profiles.csv' DELIMITER ',' CSV HEADER;
COPY projets TO '/tmp/projets.csv' DELIMITER ',' CSV HEADER;
COPY ventes TO '/tmp/ventes.csv' DELIMITER ',' CSV HEADER;
-- ... autres tables
```

### 6.2 Importer dans PostgreSQL Railway

```bash
# Connectez-vous à votre base Railway
psql $DATABASE_URL

# Importez les données
\COPY profiles FROM 'profiles.csv' DELIMITER ',' CSV HEADER;
\COPY projets FROM 'projets.csv' DELIMITER ',' CSV HEADER;
-- ... autres tables
```

## 💰 Coûts Estimés

### Railway Pricing (approximatif)

- **PostgreSQL** : ~$5/mois (512MB RAM)
- **Backend API** : ~$5/mois (512MB RAM)
- **Frontend** : ~$5/mois (512MB RAM)

**Total : ~$15/mois** (vs Supabase Pro à $25/mois)

## 🔧 Maintenance

### Sauvegardes Automatiques

Railway effectue des sauvegardes automatiques de PostgreSQL.

### Monitoring

- Surveillez les logs dans le dashboard Railway
- Configurez des alertes pour les erreurs
- Surveillez l'utilisation des ressources

### Mises à Jour

```bash
# Pour mettre à jour l'application
git push origin main  # Railway redéploiera automatiquement
```

## 🆘 Dépannage

### Problèmes Courants

1. **Erreur de connexion DB** : Vérifiez `DATABASE_URL`
2. **CORS Error** : Vérifiez `CORS_ORIGIN`
3. **Build Failed** : Vérifiez les logs de build Railway

### Support

- [Documentation Railway](https://docs.railway.app)
- [Discord Railway](https://discord.gg/railway)

## ✅ Checklist de Déploiement

- [ ] PostgreSQL déployé et accessible
- [ ] Backend déployé avec toutes les variables d'env
- [ ] Frontend déployé et connecté au backend
- [ ] CORS configuré correctement
- [ ] Tests de connexion réussis
- [ ] Données migrées (si applicable)
- [ ] Monitoring configuré

🎉 **Félicitations ! Votre application est maintenant déployée sur Railway !**
