# 🔧 Maintenance Railway - Promoteur Immobilier Pro

## 📊 Monitoring et Surveillance

### 1. Dashboard Railway
- **URL** : [railway.app/dashboard](https://railway.app/dashboard)
- **Métriques disponibles** :
  - CPU et RAM usage
  - Requêtes par minute
  - Temps de réponse
  - Logs en temps réel

### 2. Surveillance des Services

#### Backend API
```bash
# Test de santé
curl https://votre-backend.railway.app/health

# Test API
curl https://votre-backend.railway.app/api
```

#### Base de Données
- **Connexions actives** : Visible dans Railway Dashboard
- **Taille de la DB** : Surveillée automatiquement
- **Sauvegardes** : Automatiques quotidiennes

### 3. Alertes Recommandées
- **CPU > 80%** pendant 5 minutes
- **RAM > 90%** pendant 5 minutes
- **Erreurs 5xx** > 10 par minute
- **Temps de réponse** > 5 secondes

---

## 🔄 Mises à Jour

### 1. Déploiement Automatique
```bash
# Pousser les changements
git add .
git commit -m "feat: nouvelle fonctionnalité"
git push origin main

# Railway redéploie automatiquement
```

### 2. Déploiement Manuel
1. **Railway Dashboard** → Votre projet
2. **Service concerné** → **Deployments**
3. **"Redeploy"** ou **"Deploy Latest"**

### 3. Rollback
1. **Deployments** → Historique
2. **Sélectionner une version précédente**
3. **"Redeploy"**

---

## 🗄️ Gestion de la Base de Données

### 1. Connexion à PostgreSQL
```bash
# Via Railway CLI
railway connect postgres

# Via psql direct
psql $DATABASE_URL
```

### 2. Sauvegardes
```bash
# Sauvegarde manuelle
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restauration
psql $DATABASE_URL < backup-20241001.sql
```

### 3. Migrations
```bash
# Exécuter les migrations
cd backend
npm run migrate

# Vérifier le schéma
npm run verify:schema
```

---

## 📈 Optimisation des Performances

### 1. Scaling Vertical
- **Railway Dashboard** → **Settings** → **Resources**
- Augmenter RAM/CPU selon les besoins
- Coût : ~$5-20/mois par service

### 2. Optimisation Backend
```javascript
// Monitoring des requêtes lentes
// Dans backend/src/config/database.ts
const slowQueryThreshold = 1000; // 1 seconde

// Cache des requêtes fréquentes
const cache = new Map();
```

### 3. Optimisation Frontend
```bash
# Build optimisé
npm run build

# Analyse du bundle
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer dist/assets/*.js
```

---

## 🔐 Sécurité

### 1. Variables d'Environnement
- **Rotation des secrets** : Tous les 3 mois
- **JWT_SECRET** : Minimum 32 caractères
- **Accès limité** : Seuls les développeurs autorisés

### 2. Monitoring de Sécurité
```bash
# Audit des dépendances
npm audit
npm audit fix

# Mise à jour des dépendances
npm update
```

### 3. HTTPS et Certificats
- **Automatique** avec Railway
- **Renouvellement** : Automatique
- **Vérification** : `curl -I https://votre-app.railway.app`

---

## 💰 Gestion des Coûts

### 1. Monitoring des Coûts
- **Railway Dashboard** → **Usage**
- **Alertes** : Configurer des seuils
- **Optimisation** : Réduire les ressources inutilisées

### 2. Coûts Typiques
| Service | RAM | CPU | Coût/mois |
|---------|-----|-----|-----------|
| PostgreSQL | 512MB | Shared | ~$5 |
| Backend | 512MB | Shared | ~$5 |
| Frontend | 512MB | Shared | ~$5 |
| **Total** | | | **~$15** |

### 3. Optimisation
- **Scaling automatique** : Désactiver si pas nécessaire
- **Environnements** : Séparer dev/prod
- **Ressources** : Ajuster selon l'usage réel

---

## 🆘 Dépannage

### 1. Problèmes Courants

#### Service ne démarre pas
```bash
# Vérifier les logs
railway logs

# Vérifier les variables d'environnement
railway variables

# Redémarrer le service
railway redeploy
```

#### Erreurs de base de données
```bash
# Tester la connexion
railway connect postgres

# Vérifier les migrations
cd backend && npm run verify:schema
```

#### Erreurs CORS
```bash
# Vérifier CORS_ORIGIN
railway variables | grep CORS

# Mettre à jour
railway variables set CORS_ORIGIN=https://votre-frontend.railway.app
```

### 2. Logs et Debugging
```bash
# Logs en temps réel
railway logs --follow

# Logs d'un service spécifique
railway logs --service backend

# Logs avec filtre
railway logs --filter "ERROR"
```

### 3. Support
- **Documentation** : [docs.railway.app](https://docs.railway.app)
- **Discord** : [discord.gg/railway](https://discord.gg/railway)
- **Support** : help@railway.app

---

## 📋 Checklist de Maintenance

### Hebdomadaire
- [ ] Vérifier les métriques de performance
- [ ] Contrôler les logs d'erreur
- [ ] Tester les fonctionnalités critiques

### Mensuel
- [ ] Mettre à jour les dépendances
- [ ] Audit de sécurité
- [ ] Révision des coûts
- [ ] Sauvegarde manuelle de la DB

### Trimestriel
- [ ] Rotation des secrets JWT
- [ ] Optimisation des performances
- [ ] Révision de l'architecture
- [ ] Plan de disaster recovery

---

## 🔗 Liens Utiles

- **Railway Dashboard** : https://railway.app/dashboard
- **Documentation** : https://docs.railway.app
- **Status Page** : https://status.railway.app
- **Pricing** : https://railway.app/pricing

---

## 📞 Contacts d'Urgence

- **Développeur Principal** : [votre-email]
- **Support Railway** : help@railway.app
- **Discord Railway** : https://discord.gg/railway
