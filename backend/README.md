# 🏗️ Backend API - Promoteur Immobilier Pro

API REST complète pour l'application de gestion immobilière, remplaçant Supabase par une solution auto-hébergée.

## 🚀 Technologies

- **Node.js** + **Express** + **TypeScript**
- **PostgreSQL** avec **pg**
- **JWT** pour l'authentification
- **Joi** pour la validation
- **bcryptjs** pour le hachage des mots de passe

## 📁 Structure du Projet

```
backend/
├── src/
│   ├── config/          # Configuration (DB, etc.)
│   ├── middleware/      # Middlewares Express
│   ├── routes/          # Routes API
│   ├── scripts/         # Scripts de migration/seed
│   ├── types/           # Types TypeScript
│   ├── utils/           # Utilitaires
│   └── server.ts        # Point d'entrée
├── dist/                # Code compilé
└── package.json
```

## 🛠️ Installation

1. **Installer les dépendances**
```bash
cd backend
npm install
```

2. **Configurer l'environnement**
```bash
cp .env.example .env
# Éditer .env avec vos paramètres
```

3. **Configurer PostgreSQL**
```bash
# Créer la base de données
createdb promoteur_db

# Ou via psql
psql -c "CREATE DATABASE promoteur_db;"
```

4. **Exécuter les migrations**
```bash
npm run migrate
```

## 🏃‍♂️ Développement

```bash
# Démarrer en mode développement
npm run dev

# Compiler TypeScript
npm run build

# Démarrer en production
npm start
```

## 📡 API Endpoints

### 🔐 Authentification (`/api/auth`)
- `POST /register` - Inscription
- `POST /login` - Connexion
- `GET /profile` - Profil utilisateur
- `PUT /profile` - Mise à jour profil
- `GET /verify` - Vérification token
- `POST /logout` - Déconnexion

### 🏢 Projets (`/api/projects`)
- `GET /` - Liste des projets
- `GET /:id` - Détails d'un projet
- `POST /` - Créer un projet
- `PUT /:id` - Modifier un projet
- `DELETE /:id` - Supprimer un projet
- `GET /:id/stats` - Statistiques du projet

### 🏠 Ventes (`/api/sales`)
- `GET /` - Liste des ventes (avec filtres)
- `GET /project/:projectId` - Ventes d'un projet
- `GET /:id` - Détails d'une vente
- `POST /` - Créer une vente
- `PUT /:id` - Modifier une vente
- `DELETE /:id` - Supprimer une vente

### 💰 Paiements (`/api/payments`)
- `GET /plans/sale/:saleId` - Plans de paiement d'une vente
- `POST /plans` - Créer un plan de paiement
- `PUT /plans/:id` - Modifier un plan
- `POST /pay/:planId` - Enregistrer un paiement
- `GET /history/sale/:saleId` - Historique des paiements
- `GET /stats/summary` - Statistiques des paiements
- `DELETE /plans/:id` - Supprimer un plan

### 💸 Dépenses (`/api/expenses`)
- `GET /` - Liste des dépenses
- `GET /project/:projectId` - Dépenses d'un projet
- `GET /:id` - Détails d'une dépense
- `POST /` - Créer une dépense
- `PUT /:id` - Modifier une dépense
- `DELETE /:id` - Supprimer une dépense
- `GET /stats/project/:projectId` - Statistiques des dépenses

### 📄 Chèques (`/api/checks`)
- `GET /` - Liste des chèques (avec filtres)
- `GET /:id` - Détails d'un chèque
- `POST /` - Créer un chèque
- `PUT /:id` - Modifier un chèque
- `DELETE /:id` - Supprimer un chèque
- `PATCH /:id/encaisser` - Marquer comme encaissé
- `GET /stats/summary` - Statistiques des chèques

## 🔒 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification :

```javascript
// Headers requis pour les routes protégées
Authorization: Bearer <your-jwt-token>
```

## 📊 Filtres et Pagination

Les endpoints de liste supportent les paramètres de requête :

```
GET /api/sales?page=1&limit=20&sortBy=created_at&sortOrder=desc&search=client&statut=en_cours
```

## 🗄️ Base de Données

### Tables Principales
- `users` - Utilisateurs
- `projects` - Projets immobiliers
- `sales` - Ventes
- `payment_plans` - Plans de paiement
- `expenses` - Dépenses
- `checks` - Chèques

### Types ENUM
- `property_type` : 'appartement', 'garage'
- `sale_status` : 'en_cours', 'termine', 'annule'
- `payment_mode` : 'espece', 'cheque', 'cheque_espece', 'virement'
- `payment_plan_status` : 'en_attente', 'paye', 'en_retard', 'annule'
- `check_type` : 'recu', 'donne'
- `check_status` : 'emis', 'encaisse', 'annule'

## 🚀 Déploiement sur Railway

1. **Créer un projet Railway**
2. **Ajouter PostgreSQL**
3. **Configurer les variables d'environnement**
4. **Déployer le code**

Variables d'environnement pour Railway :
```
DATABASE_URL=<railway-postgres-url>
JWT_SECRET=<your-secret>
NODE_ENV=production
PORT=3001
```

## 🧪 Tests

```bash
# Exécuter les tests
npm test

# Tests en mode watch
npm run test:watch
```

## 📝 Logs

L'API utilise Morgan pour les logs HTTP et console.log pour les logs applicatifs.

En production, les logs sont structurés et les erreurs sont tracées sans exposer les détails sensibles.

## 🔧 Maintenance

### Migrations
```bash
# Exécuter les migrations
npm run migrate

# Ajouter des données de test
npm run seed
```

### Monitoring
- Health check : `GET /health`
- Métriques de base de données dans les logs
- Gestion des erreurs centralisée

## 🆘 Dépannage

### Erreurs courantes
1. **Erreur de connexion DB** : Vérifier DATABASE_URL
2. **Token invalide** : Vérifier JWT_SECRET
3. **Erreur de migration** : Vérifier les permissions PostgreSQL

### Debug
```bash
# Logs détaillés en développement
NODE_ENV=development npm run dev
```
