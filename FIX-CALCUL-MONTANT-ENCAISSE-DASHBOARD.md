# 🐛 FIX: Calcul incorrect du montant encaissé dans le dashboard principal

## 📋 Description du problème

### Symptôme
Dans le **dashboard principal**, la carte "Chiffre d'Affaires" affiche un **montant encaissé sous-estimé** car il ne compte que l'avance initiale et ignore tous les paiements supplémentaires (paiement #2, #3, #4, etc.).

**Note** : C'est le même problème que dans les analytics du projet, mais cette fois dans le dashboard principal.

---

## 🔍 Analyse du problème

### Ancien calcul (INCORRECT)

**Fichier** : `backend/src/routes/sales.ts` (ligne 148)

**Requête SQL** :
```sql
COALESCE(SUM(s.avance_total), 0) as montant_encaisse
```

**Ce qui était pris en compte** :
- ✅ Avance initiale (paiement #1) via `sales.avance_total`

**Ce qui N'ÉTAIT PAS pris en compte** :
- ❌ Paiement #2, #3, #4, etc. stockés dans la table `payment_plans`
- ❌ Champ `montant_paye` de chaque `payment_plan`

---

### Exemple concret du problème

**Situation** :
- **Vente 1** : 100 000 DH
  - Avance : 30 000 DH
  - Paiement #2 : 20 000 DH
  - Paiement #3 : 15 000 DH
  - **Total encaissé réel** : 65 000 DH

- **Vente 2** : 80 000 DH
  - Avance : 25 000 DH
  - Paiement #2 : 10 000 DH
  - **Total encaissé réel** : 35 000 DH

**Ancien calcul (INCORRECT)** :
```
Montant encaissé = 30 000 + 25 000 = 55 000 DH
```

**Nouveau calcul (CORRECT)** :
```
Montant encaissé = 65 000 + 35 000 = 100 000 DH
```

---

## ✅ Solution appliquée

### Modification de la requête SQL

**Fichier modifié** : `backend/src/routes/sales.ts` (lignes 142-186)

**Nouvelle requête SQL** :
```sql
SELECT
  COUNT(*) as total_ventes,
  COUNT(CASE WHEN s.statut = 'termine' THEN 1 END) as ventes_finalisees,
  COUNT(CASE WHEN s.statut = 'en_cours' THEN 1 END) as ventes_en_cours,
  COALESCE(SUM(s.prix_total), 0) as chiffre_affaires_total,
  
  -- ✅ FIX: Montant encaissé incluant tous les paiements
  COALESCE(SUM(
    CASE 
      -- Si un payment_plan #1 existe, utiliser UNIQUEMENT les payment_plans
      WHEN EXISTS (
        SELECT 1 FROM payment_plans pp 
        WHERE pp.sale_id = s.id AND pp.numero_echeance = 1
      ) THEN (
        SELECT COALESCE(SUM(montant_paye), 0) 
        FROM payment_plans 
        WHERE sale_id = s.id
      )
      -- Sinon, utiliser l'avance de la table sales + les payment_plans
      ELSE s.avance_total + (
        SELECT COALESCE(SUM(montant_paye), 0) 
        FROM payment_plans 
        WHERE sale_id = s.id
      )
    END
  ), 0) as montant_encaisse,
  
  -- ✅ FIX: Montant restant recalculé correctement
  COALESCE(SUM(s.prix_total), 0) - COALESCE(SUM(
    CASE 
      WHEN EXISTS (
        SELECT 1 FROM payment_plans pp 
        WHERE pp.sale_id = s.id AND pp.numero_echeance = 1
      ) THEN (
        SELECT COALESCE(SUM(montant_paye), 0) 
        FROM payment_plans 
        WHERE sale_id = s.id
      )
      ELSE s.avance_total + (
        SELECT COALESCE(SUM(montant_paye), 0) 
        FROM payment_plans 
        WHERE sale_id = s.id
      )
    END
  ), 0) as montant_restant
  
FROM sales s
WHERE s.user_id = $1 AND s.statut != 'annule'
```

---

## 🎯 Logique de la correction

### Gestion de la double comptabilisation

Le système stocke l'avance initiale à **deux endroits** :
1. Dans la table `sales` : `avance_total` (= `avance_declare + avance_non_declare`)
2. Dans la table `payment_plans` : paiement avec `numero_echeance = 1`

**Problème** : Si on additionne les deux, on compte l'avance initiale deux fois !

**Solution SQL** : Utiliser un `CASE` pour vérifier si un paiement #1 existe :

```sql
CASE 
  -- Si un payment_plan #1 existe
  WHEN EXISTS (
    SELECT 1 FROM payment_plans pp 
    WHERE pp.sale_id = s.id AND pp.numero_echeance = 1
  ) 
  -- Alors utiliser UNIQUEMENT les payment_plans (qui contient tous les paiements y compris #1)
  THEN (
    SELECT COALESCE(SUM(montant_paye), 0) 
    FROM payment_plans 
    WHERE sale_id = s.id
  )
  -- Sinon utiliser l'avance de la table sales + les paiements supplémentaires
  ELSE s.avance_total + (
    SELECT COALESCE(SUM(montant_paye), 0) 
    FROM payment_plans 
    WHERE sale_id = s.id
  )
END
```

---

## 📁 Fichiers modifiés

### `backend/src/routes/sales.ts`

**Lignes 142-186** : Modification de la route `GET /sales/stats`

**Avant** :
```sql
COALESCE(SUM(s.avance_total), 0) as montant_encaisse,
COALESCE(SUM(s.prix_total - s.avance_total), 0) as montant_restant
```

**Après** :
```sql
COALESCE(SUM(
  CASE 
    WHEN EXISTS (...) THEN (SELECT SUM(montant_paye) FROM payment_plans ...)
    ELSE s.avance_total + (SELECT SUM(montant_paye) FROM payment_plans ...)
  END
), 0) as montant_encaisse,

COALESCE(SUM(s.prix_total), 0) - COALESCE(SUM(...), 0) as montant_restant
```

---

## 🧪 Test de la correction

### Avant la correction

**Dashboard principal** :
- Chiffre d'affaires : 180 000 DH
- Montant encaissé : **55 000 DH** ❌ (seulement les avances)
- Montant restant : **125 000 DH** ❌

### Après la correction

**Dashboard principal** :
- Chiffre d'affaires : 180 000 DH
- Montant encaissé : **100 000 DH** ✅ (avances + paiements supplémentaires)
- Montant restant : **80 000 DH** ✅

---

## 📊 Impact sur le dashboard

Cette correction affecte les métriques suivantes dans le dashboard principal :

1. **Chiffre d'Affaires** : Reste inchangé (déjà correct)
2. **Montant encaissé** : Maintenant correct (inclut tous les paiements)
3. **Montant restant** : Recalculé correctement (CA - Montant encaissé)
4. **Bénéfice net** : Recalculé correctement (CA - Dépenses)

---

## 🎯 Avantages de cette solution

1. **Précision** : Le montant encaissé reflète maintenant la réalité
2. **Performance** : Calcul fait en SQL, pas besoin de requêtes multiples
3. **Cohérence** : Évite la double comptabilisation du paiement #1
4. **Robustesse** : Gère les cas où le paiement #1 existe ou non dans `payment_plans`
5. **Fiabilité** : Les statistiques du dashboard sont maintenant fiables

---

## 🔗 Lien avec les autres corrections

Cette correction est **similaire** à celle appliquée dans :
- `src/services/analyticsServiceNew.ts` (Analytics du projet - Frontend)

**Différence** :
- **Analytics du projet** : Correction côté **frontend** (JavaScript/TypeScript)
- **Dashboard principal** : Correction côté **backend** (SQL)

**Avantage de la correction SQL** :
- Plus performant (calcul fait directement en base de données)
- Pas besoin de requêtes multiples
- Résultat immédiat

---

## ⚠️ Points d'attention

### Performance

La requête SQL utilise des sous-requêtes corrélées :
```sql
SELECT COALESCE(SUM(montant_paye), 0) 
FROM payment_plans 
WHERE sale_id = s.id
```

**Impact** :
- Pour chaque vente, une sous-requête est exécutée
- Si vous avez 100 ventes, 100 sous-requêtes seront exécutées

**Performance attendue** :
- PostgreSQL optimise généralement bien ce type de requête
- Les index sur `sale_id` et `numero_echeance` aident à la performance

**Optimisation future possible** :
- Utiliser une jointure avec agrégation au lieu de sous-requêtes
- Créer une vue matérialisée pour les statistiques

### Filtres de date

La requête supporte les filtres de date basés sur `created_at` :
- `period=all` : Toutes les ventes
- `period=this_month` : Ventes créées ce mois-ci
- `startDate` + `endDate` : Période personnalisée

**Note** : Le filtre utilise `created_at`, pas une date de finalisation.

---

## ✅ Statut

**CORRIGÉ** - 30 septembre 2025

Le calcul du montant encaissé dans le dashboard principal a été corrigé pour inclure tous les paiements (avance initiale + paiements supplémentaires).

---

## 🔗 Fichiers liés

- `backend/src/routes/sales.ts` - Route corrigée
- `src/pages/Dashboard.tsx` - Page du dashboard qui affiche les statistiques
- `src/services/dashboardService.ts` - Service qui appelle l'API
- `src/services/analyticsServiceNew.ts` - Correction similaire pour les analytics du projet
- `FIX-CALCUL-MONTANT-ENCAISSE-ANALYTICS.md` - Documentation de la correction des analytics

