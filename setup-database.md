# 🗄️ Configuration de la Base de Données PostgreSQL

## Option 1 : Installation PostgreSQL Locale

### 1. Télécharger et Installer PostgreSQL

**Windows :**
1. Allez sur https://www.postgresql.org/download/windows/
2. Téléchargez PostgreSQL 15 ou 16
3. Lancez l'installateur
4. **Notez bien le mot de passe** que vous définissez pour l'utilisateur `postgres`
5. Port par défaut : `5432`

### 2. Créer la Base de Données

Ouvrez **pgAdmin** ou **SQL Shell (psql)** :

```sql
-- Créer la base de données
CREATE DATABASE promoteur_db;

-- Créer un utilisateur dédié (optionnel)
CREATE USER promoteur_user WITH PASSWORD 'promoteur_password';
GRANT ALL PRIVILEGES ON DATABASE promoteur_db TO promoteur_user;
```

### 3. Configurer la Connexion

Modifiez `backend/.env` avec vos informations :

```env
# Avec l'utilisateur postgres par défaut
DATABASE_URL=postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/promoteur_db

# Ou avec l'utilisateur dédié
DATABASE_URL=postgresql://promoteur_user:promoteur_password@localhost:5432/promoteur_db
```

## Option 2 : PostgreSQL avec Docker (Plus simple)

### 1. Installer Docker Desktop

Téléchargez depuis https://www.docker.com/products/docker-desktop/

### 2. Lancer PostgreSQL

```bash
docker run --name promoteur-postgres \
  -e POSTGRES_DB=promoteur_db \
  -e POSTGRES_USER=promoteur_user \
  -e POSTGRES_PASSWORD=promoteur_password \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Configuration .env

```env
DATABASE_URL=postgresql://promoteur_user:promoteur_password@localhost:5432/promoteur_db
```

## Option 3 : Base de Données Cloud (Gratuite)

### Supabase (Recommandé - Gratuit)

1. Allez sur https://supabase.com
2. Créez un compte gratuit
3. Créez un nouveau projet
4. Dans **Settings > Database**, copiez la **Connection String**
5. Collez dans `backend/.env` :

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```

### Railway (Alternative)

1. Allez sur https://railway.app
2. Créez un compte
3. Créez un nouveau projet
4. Ajoutez PostgreSQL
5. Copiez la `DATABASE_URL`

## Vérification de la Connexion

Une fois configuré, testez :

```bash
cd backend
npm run migrate
```

Si ça fonctionne, vous verrez :
```
✅ Tables créées avec succès
✅ Migrations appliquées
```
