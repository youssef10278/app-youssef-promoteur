# 🔧 Guide de Migration - Ajout des Colonnes montant_declare et montant_non_declare

## 📋 Contexte

Cette migration ajoute les colonnes `montant_declare` et `montant_non_declare` à la table `payment_plans` pour permettre la gestion des montants déclarés et non déclarés fiscalement.

## 🎯 Objectif

Résoudre le problème où la modification des paiements échoue silencieusement car les colonnes nécessaires n'existent pas dans la base de données.

## 📁 Fichiers Créés

1. **`src/scripts/add-declared-amounts-migration.sql`** - Script SQL de migration
2. **`src/scripts/run-migration.ts`** - Script TypeScript pour exécuter la migration
3. **`run-migration.bat`** - Script Windows pour faciliter l'exécution
4. **`GUIDE-MIGRATION-DECLARED-AMOUNTS.md`** - Ce guide

## 🚀 Méthodes d'Exécution

### **Méthode 1 : Script Windows (Recommandé pour Windows)**

```bash
# Depuis le dossier backend/
.\run-migration.bat
```

Cette méthode :
- ✅ Vérifie que Node.js et npm sont installés
- ✅ Installe les dépendances si nécessaire
- ✅ Exécute la migration automatiquement
- ✅ Affiche un rapport détaillé

### **Méthode 2 : Script TypeScript**

```bash
# Depuis le dossier backend/
npx ts-node src/scripts/run-migration.ts
```

### **Méthode 3 : Script npm (après ajout dans package.json)**

```bash
# Depuis le dossier backend/
npm run migrate:declared-amounts
```

Pour cette méthode, ajoutez dans `backend/package.json` :
```json
{
  "scripts": {
    "migrate:declared-amounts": "ts-node src/scripts/run-migration.ts"
  }
}
```

### **Méthode 4 : SQL Direct (Manuel)**

Si vous préférez exécuter le SQL manuellement :

```bash
# Se connecter à PostgreSQL
psql -h localhost -p 5433 -U postgres -d promoteur_db

# Exécuter le fichier SQL
\i backend/src/scripts/add-declared-amounts-migration.sql
```

## 📊 Ce que fait la Migration

### **Étape 1 : Ajout des Colonnes**
```sql
ALTER TABLE payment_plans 
ADD COLUMN IF NOT EXISTS montant_declare DECIMAL DEFAULT 0 CHECK (montant_declare >= 0),
ADD COLUMN IF NOT EXISTS montant_non_declare DECIMAL DEFAULT 0 CHECK (montant_non_declare >= 0);
```

### **Étape 2 : Mise à Jour des Données Existantes**
```sql
UPDATE payment_plans 
SET montant_declare = COALESCE(montant_paye, 0), 
    montant_non_declare = 0 
WHERE montant_declare IS NULL OR montant_non_declare IS NULL;
```

### **Étape 3 : Ajout de la Documentation**
```sql
COMMENT ON COLUMN payment_plans.montant_declare IS 'Montant déclaré fiscalement pour ce paiement';
COMMENT ON COLUMN payment_plans.montant_non_declare IS 'Montant non déclaré fiscalement pour ce paiement';
```

### **Étape 4 : Création des Index**
```sql
CREATE INDEX IF NOT EXISTS idx_payment_plans_montant_declare ON payment_plans(montant_declare);
CREATE INDEX IF NOT EXISTS idx_payment_plans_montant_non_declare ON payment_plans(montant_non_declare);
```

## ✅ Vérification Post-Migration

### **1. Vérifier que les Colonnes Existent**

```sql
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'payment_plans' 
AND column_name IN ('montant_declare', 'montant_non_declare')
ORDER BY column_name;
```

**Résultat attendu :**
```
 column_name          | data_type | column_default | is_nullable 
----------------------+-----------+----------------+-------------
 montant_declare      | numeric   | 0              | YES
 montant_non_declare  | numeric   | 0              | YES
```

### **2. Vérifier les Données**

```sql
SELECT 
  id,
  numero_echeance,
  montant_paye,
  montant_declare,
  montant_non_declare
FROM payment_plans
LIMIT 5;
```

### **3. Vérifier les Index**

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payment_plans'
AND indexname LIKE '%montant_%';
```

## 🔄 Rollback (Annulation)

Si vous devez annuler la migration :

```sql
-- Supprimer les index
DROP INDEX IF EXISTS idx_payment_plans_montant_declare;
DROP INDEX IF EXISTS idx_payment_plans_montant_non_declare;

-- Supprimer les colonnes
ALTER TABLE payment_plans 
DROP COLUMN IF EXISTS montant_declare,
DROP COLUMN IF EXISTS montant_non_declare;
```

## 🧪 Test de la Modification des Paiements

Après la migration, testez la modification d'un paiement :

### **1. Via l'Interface**
1. Ouvrir l'application frontend
2. Aller dans "Ventes"
3. Sélectionner une vente avec des paiements
4. Modifier un paiement existant
5. Vérifier que les valeurs sont bien mises à jour

### **2. Via l'API**

```bash
curl -X PUT http://localhost:3001/api/payments/plans/PLAN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "montant_paye": 10000,
    "montant_declare": 7000,
    "montant_non_declare": 3000,
    "date_paiement": "2024-01-20",
    "mode_paiement": "espece"
  }'
```

### **3. Vérification en Base**

```sql
-- Avant modification
SELECT * FROM payment_plans WHERE id = 'PLAN_ID';

-- Après modification (vérifier que les valeurs ont changé)
SELECT * FROM payment_plans WHERE id = 'PLAN_ID';
```

## 📝 Logs et Debugging

Le script de migration affiche des logs détaillés :

```
🚀 Démarrage de la migration...

📡 Connexion à la base de données...
✅ Connexion établie

🔍 Vérification de l'état actuel de la table...
📝 Les colonnes n'existent pas encore. Migration nécessaire.

📖 Lecture du fichier de migration...
✅ Fichier de migration chargé

⚙️  Exécution de la migration...
✅ Requête exécutée { duration: '45ms', rows: 0 }
✅ Migration exécutée avec succès

🔍 Vérification post-migration...
✅ Vérification réussie. Colonnes ajoutées:
   - montant_declare: numeric (default: 0, nullable: YES)
   - montant_non_declare: numeric (default: 0, nullable: YES)

📊 Résumé des données dans payment_plans:
   Total de plans: 15
   Plans avec montant_declare: 15
   Plans avec montant_non_declare: 15
   Total déclaré: 125000 DH
   Total non déclaré: 0 DH

🎉 Migration terminée avec succès!

👋 Connexion fermée

✅ Script terminé avec succès
```

## ⚠️ Précautions

1. **Sauvegarde** : Faites une sauvegarde de la base avant la migration
   ```bash
   pg_dump -h localhost -p 5433 -U postgres promoteur_db > backup_before_migration.sql
   ```

2. **Environnement** : Testez d'abord sur un environnement de développement

3. **Vérification** : Vérifiez que le backend est arrêté pendant la migration

4. **Permissions** : Assurez-vous d'avoir les droits nécessaires sur la base

## 🐛 Résolution de Problèmes

### **Erreur : "relation payment_plans does not exist"**
- La table n'existe pas encore
- Exécutez d'abord le script de migration principal : `npm run migrate`

### **Erreur : "column already exists"**
- Les colonnes existent déjà
- La migration a déjà été exécutée
- Aucune action nécessaire

### **Erreur : "permission denied"**
- Vous n'avez pas les droits sur la base
- Vérifiez les credentials dans le fichier `.env`

### **Erreur : "connection refused"**
- PostgreSQL n'est pas démarré
- Vérifiez que le service PostgreSQL est actif
- Vérifiez le port (5433 par défaut)

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du script de migration
2. Vérifiez les logs du backend
3. Consultez le fichier `CONTEXTE-DEVELOPPEUR-MODIFICATION-PAIEMENTS.md`

## ✨ Prochaines Étapes

Après la migration :
1. ✅ Redémarrer le backend : `npm run dev`
2. ✅ Tester la modification d'un paiement
3. ✅ Vérifier que les données persistent
4. ✅ Vérifier les logs backend pour confirmer l'absence d'erreurs

---

**Date de création** : 2025-01-20  
**Version** : 1.0.0  
**Auteur** : Augment Agent

