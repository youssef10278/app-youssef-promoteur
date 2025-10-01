# 🚀 Guide de Déploiement Railway - Étape par Étape

## 🎯 Vue d'Ensemble

Ce guide vous accompagne pour déployer votre application **Promoteur Immobilier Pro** sur Railway en 3 services :
- 🗄️ **PostgreSQL** (Base de données)
- 🔧 **Backend API** (Node.js/Express)
- 🌐 **Frontend** (React/Vite)

---

## 📋 Prérequis

### 1. Compte Railway
- Créez un compte sur [railway.app](https://railway.app)
- Connectez votre compte GitHub

### 2. Repository GitHub
- Votre code doit être sur GitHub
- Assurez-vous que tous les fichiers sont commitées

### 3. Railway CLI (Optionnel)
```bash
npm install -g @railway/cli
railway login
```

---

## 🚀 Déploiement Automatique

### Option 1 : Script Automatique
```bash
# Exécutez le script de déploiement
deploy-railway.bat
```

### Option 2 : Déploiement Manuel

---

## 📊 Étape 1 : Créer le Projet Railway

1. **Connectez-vous à Railway**
2. **Nouveau Projet** → "Deploy from GitHub repo"
3. **Sélectionnez votre repository**
4. **Nom du projet** : "promoteur-immobilier-pro"

---

## 🗄️ Étape 2 : Déployer PostgreSQL

### 2.1 Ajouter PostgreSQL
1. Dans votre projet Railway
2. **"+ New"** → **"Database"** → **"PostgreSQL"**
3. **Nom** : "promoteur-db"
4. Attendez que le déploiement soit terminé

### 2.2 Noter les Informations de Connexion
- Allez dans l'onglet **"Variables"** du service PostgreSQL
- Notez la valeur de `DATABASE_URL`

---

## 🔧 Étape 3 : Déployer le Backend

### 3.1 Créer le Service Backend
1. **"+ New"** → **"GitHub Repo"**
2. **Sélectionnez votre repository**
3. **Root Directory** : `backend`
4. **Nom** : "promoteur-backend"

### 3.2 Configurer les Variables d'Environnement

Allez dans **Settings** → **Variables** et ajoutez :

```env
# Base de données
DATABASE_URL=${{promoteur-db.DATABASE_URL}}

# JWT (CHANGEZ CES VALEURS !)
JWT_SECRET=votre-secret-jwt-super-securise-production-2024
JWT_EXPIRES_IN=7d

# Configuration
NODE_ENV=production
PORT=3001

# CORS (temporaire, sera mis à jour)
CORS_ORIGIN=*
```

### 3.3 Déployer
1. Railway détectera automatiquement `package.json`
2. Il exécutera `npm install` puis `npm start`
3. Les migrations s'exécuteront automatiquement

### 3.4 Tester le Backend
- Attendez que le déploiement soit terminé
- Cliquez sur l'URL générée
- Vous devriez voir : `{"message": "API Promoteur Immobilier Pro"}`

---

## 🌐 Étape 4 : Déployer le Frontend

### 4.1 Créer le Service Frontend
1. **"+ New"** → **"GitHub Repo"**
2. **Même repository**
3. **Root Directory** : `/` (racine)
4. **Nom** : "promoteur-frontend"

### 4.2 Configurer les Variables d'Environnement

```env
# API Backend (remplacez par l'URL réelle de votre backend)
VITE_API_BASE_URL=https://promoteur-backend-production.railway.app/api

# Configuration
VITE_APP_ENV=production
VITE_APP_NAME=Promoteur Immobilier Pro
```

### 4.3 Déployer
Railway construira automatiquement avec Vite.

---

## 🔗 Étape 5 : Configuration Finale

### 5.1 Mettre à Jour les CORS
1. **Copiez l'URL du frontend** (ex: `https://promoteur-frontend-production.railway.app`)
2. **Allez dans le service backend** → **Variables**
3. **Modifiez `CORS_ORIGIN`** avec l'URL du frontend

### 5.2 Redémarrer le Backend
- Allez dans le service backend
- **Settings** → **Redeploy**

---

## 🧪 Étape 6 : Tests

### 6.1 Test de Connexion
1. Ouvrez l'URL du frontend
2. Créez un compte test
3. Testez la création d'un projet
4. Vérifiez que tout fonctionne

### 6.2 Test des APIs
```bash
# Test de santé du backend
curl https://votre-backend.railway.app/health

# Test d'authentification
curl -X POST https://votre-backend.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","nom":"Test User"}'
```

---

## 💰 Coûts Estimés

- **PostgreSQL** : ~$5/mois
- **Backend** : ~$5/mois  
- **Frontend** : ~$5/mois
- **Total** : ~$15/mois

---

## 🔧 Maintenance

### Mises à Jour
```bash
# Pousser les changements
git push origin main

# Railway redéploiera automatiquement
```

### Monitoring
- Surveillez les logs dans Railway Dashboard
- Configurez des alertes pour les erreurs

---

## 🆘 Dépannage

### Problèmes Courants

1. **Build Failed**
   - Vérifiez les logs de build
   - Assurez-vous que `npm run build` fonctionne localement

2. **Database Connection Error**
   - Vérifiez `DATABASE_URL`
   - Assurez-vous que PostgreSQL est démarré

3. **CORS Error**
   - Vérifiez `CORS_ORIGIN`
   - Redémarrez le backend après modification

4. **Frontend ne charge pas**
   - Vérifiez `VITE_API_BASE_URL`
   - Testez l'URL du backend directement

---

## ✅ Checklist Final

- [ ] PostgreSQL déployé et accessible
- [ ] Backend déployé avec toutes les variables
- [ ] Frontend déployé et connecté
- [ ] CORS configuré correctement
- [ ] Tests de connexion réussis
- [ ] URLs mises à jour dans les variables

🎉 **Félicitations ! Votre application est déployée sur Railway !**
