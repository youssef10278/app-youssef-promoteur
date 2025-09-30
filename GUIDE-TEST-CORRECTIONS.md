# 🧪 Guide de test des corrections - 30 septembre 2025

## 📋 Vue d'ensemble

Ce guide vous permet de tester les deux corrections apportées au système :
1. **Correction du bug de duplication du paiement #1**
2. **Correction du calcul du montant encaissé dans les analytics**

---

## ⚙️ Préparation

### 1. Rafraîchir l'application

Avant de commencer les tests, assurez-vous que le code JavaScript est rechargé :

1. **Ouvrir votre navigateur**
2. **Appuyer sur `Ctrl + Shift + R`** (Windows/Linux) ou **`Cmd + Shift + R`** (Mac) pour forcer le rechargement
3. **Vider le cache** si nécessaire (Ctrl + Shift + Delete)

### 2. Ouvrir la console du navigateur

Pour voir les logs de débogage :
1. **Appuyer sur `F12`** pour ouvrir les outils de développement
2. **Aller dans l'onglet "Console"**
3. **Garder la console ouverte** pendant les tests

---

## 🧪 TEST #1 : Modification du paiement #1 (Avance initiale)

### Objectif
Vérifier que la modification du paiement #1 ne crée plus de paiement #2 fantôme.

### Étapes

#### 1. Sélectionner une vente existante

1. Aller dans **"Gestion des ventes"**
2. Choisir un projet
3. Cliquer sur une vente qui a déjà un paiement #1

#### 2. Noter les valeurs actuelles

Avant de modifier, notez :
- **Montant du paiement #1** : __________ DH
- **Nombre total de paiements** : __________
- **Numéros des paiements** : #1, #2, #3, etc.

#### 3. Modifier le paiement #1

1. Cliquer sur le bouton **"Modifier"** du paiement #1
2. Changer le montant (par exemple, de 30 000 DH à 35 000 DH)
3. Cliquer sur **"Enregistrer"**

#### 4. Vérifier le résultat

**✅ RÉSULTAT ATTENDU (CORRECT)** :
- Le paiement #1 affiche le nouveau montant (35 000 DH)
- Aucun paiement #2 n'est créé
- Le nombre total de paiements reste le même
- Les numéros des paiements restent cohérents (#1, #2, #3, etc.)

**❌ RÉSULTAT INCORRECT (BUG)** :
- Le paiement #1 affiche l'ancien montant (30 000 DH)
- Un nouveau paiement #2 apparaît avec le nouveau montant (35 000 DH)
- Le nombre total de paiements augmente de 1
- Les numéros des paiements sont décalés (#1, #2, #3 devient #1, #2, #3, #4)

#### 5. Vérifier dans la console

Dans la console du navigateur, vous devriez voir :
```
🔄 Nouveaux plans récupérés: [{…}]
```

Développez cet objet et vérifiez :
- **Nombre de paiements** : Doit être le même qu'avant la modification
- **Paiement #1** : Doit avoir le nouveau montant

---

## 🧪 TEST #2 : Calcul du montant encaissé dans les analytics

### Objectif
Vérifier que le montant encaissé dans les analytics inclut tous les paiements (avance + paiements supplémentaires).

### Scénario de test

Nous allons créer une vente avec plusieurs paiements et vérifier que le montant encaissé est correct.

### Étapes

#### 1. Créer une nouvelle vente (ou utiliser une existante)

**Données de la vente** :
- **Prix total** : 100 000 DH
- **Avance initiale** : 30 000 DH
- **Type** : Appartement

#### 2. Ajouter des paiements supplémentaires

1. Ouvrir la vente
2. Ajouter un **paiement #2** : 20 000 DH
3. Ajouter un **paiement #3** : 15 000 DH

**Total encaissé attendu** : 30 000 + 20 000 + 15 000 = **65 000 DH**

#### 3. Ouvrir les analytics du projet

1. Aller dans **"Gestion des ventes"**
2. Sélectionner le projet de la vente
3. Cliquer sur **"Analytics du projet"** ou développer la section analytics

#### 4. Vérifier le montant encaissé

**✅ RÉSULTAT ATTENDU (CORRECT)** :
- **Montant encaissé** : 65 000 DH
- **Montant restant** : 35 000 DH (100 000 - 65 000)
- **Progression** : 65%

**❌ RÉSULTAT INCORRECT (BUG)** :
- **Montant encaissé** : 30 000 DH (seulement l'avance)
- **Montant restant** : 70 000 DH
- **Progression** : 30%

#### 5. Vérifier les montants déclaré/non déclaré

Si vous avez réparti les paiements entre déclaré et non déclaré :

**Exemple** :
- Paiement #1 : 30 000 DH (20 000 déclaré + 10 000 non déclaré)
- Paiement #2 : 20 000 DH (15 000 déclaré + 5 000 non déclaré)
- Paiement #3 : 15 000 DH (10 000 déclaré + 5 000 non déclaré)

**✅ RÉSULTAT ATTENDU** :
- **Montant principal (déclaré)** : 45 000 DH (20 000 + 15 000 + 10 000)
- **Autre montant (non déclaré)** : 20 000 DH (10 000 + 5 000 + 5 000)
- **Total encaissé** : 65 000 DH

---

## 🧪 TEST #3 : Modification du paiement #1 avec description vide

### Objectif
Vérifier que la correction fonctionne même si le paiement #1 a une description vide.

### Étapes

#### 1. Vérifier la description du paiement #1

Vous pouvez utiliser le script de diagnostic :
```bash
node backend/check-payment-description.cjs
```

Ou vérifier directement dans la base de données.

#### 2. Modifier un paiement #1 avec description vide

1. Trouver une vente dont le paiement #1 a une description vide
2. Modifier le montant du paiement #1
3. Vérifier que le paiement est mis à jour correctement (pas de duplication)

**✅ RÉSULTAT ATTENDU** :
- Le paiement #1 est mis à jour
- Aucun paiement #2 n'est créé
- La description reste vide (ou peut être modifiée)

---

## 🧪 TEST #4 : Analytics avec une seule avance (sans paiements supplémentaires)

### Objectif
Vérifier que le calcul fonctionne aussi pour les ventes qui n'ont que l'avance initiale.

### Étapes

#### 1. Créer une vente avec seulement une avance

**Données de la vente** :
- **Prix total** : 100 000 DH
- **Avance initiale** : 30 000 DH
- **Pas de paiements supplémentaires**

#### 2. Vérifier les analytics

**✅ RÉSULTAT ATTENDU** :
- **Montant encaissé** : 30 000 DH
- **Montant restant** : 70 000 DH
- **Progression** : 30%

---

## 🧪 TEST #5 : Analytics avec paiement #1 dans payment_plans

### Objectif
Vérifier que la double comptabilisation est évitée quand le paiement #1 existe dans `payment_plans`.

### Contexte

Certaines ventes ont le paiement #1 stocké à deux endroits :
1. Dans la table `sales` : `avance_declare` + `avance_non_declare`
2. Dans la table `payment_plans` : paiement avec `numero_echeance = 1`

### Étapes

#### 1. Identifier une vente avec paiement #1 dans payment_plans

Vérifier dans la console du navigateur lors de l'ouverture d'une vente :
```
🔄 Nouveaux plans récupérés: [{numero_echeance: 1, ...}, {numero_echeance: 2, ...}]
```

#### 2. Vérifier les analytics

**✅ RÉSULTAT ATTENDU** :
- Le montant encaissé ne compte le paiement #1 qu'une seule fois
- Pas de double comptabilisation

**Exemple** :
- Paiement #1 : 30 000 DH (dans `payment_plans`)
- Avance dans `sales` : 30 000 DH (même montant)
- **Montant encaissé** : 30 000 DH (pas 60 000 DH)

---

## 📊 Tableau de suivi des tests

| Test | Description | Résultat | Notes |
|------|-------------|----------|-------|
| 1 | Modification paiement #1 | ☐ Réussi ☐ Échoué | |
| 2 | Montant encaissé avec plusieurs paiements | ☐ Réussi ☐ Échoué | |
| 3 | Modification paiement #1 avec description vide | ☐ Réussi ☐ Échoué | |
| 4 | Analytics avec seulement avance | ☐ Réussi ☐ Échoué | |
| 5 | Éviter double comptabilisation | ☐ Réussi ☐ Échoué | |

---

## 🐛 En cas de problème

### Si le test #1 échoue (duplication du paiement #1)

1. **Vérifier que le fichier a été modifié** :
   - Ouvrir `src/utils/paymentHistory.ts`
   - Vérifier la ligne 45 : doit être `const hasInitialPaymentPlan = paymentPlans.some(plan => plan.numero_echeance === 1);`

2. **Vider le cache du navigateur** :
   - Ctrl + Shift + Delete
   - Cocher "Fichiers en cache"
   - Cliquer sur "Effacer les données"

3. **Redémarrer le serveur de développement** :
   - Arrêter le serveur (Ctrl + C)
   - Relancer `npm run dev`

### Si le test #2 échoue (montant encaissé incorrect)

1. **Vérifier que le fichier a été modifié** :
   - Ouvrir `src/services/analyticsServiceNew.ts`
   - Vérifier les lignes 46-99, 134-206, 251-304

2. **Vérifier les logs dans la console** :
   - Chercher des erreurs lors de la récupération des `payment_plans`
   - Vérifier que les `payment_plans` sont bien récupérés pour chaque vente

3. **Vérifier l'API backend** :
   - Tester manuellement : `GET /payments/plans/sale/{saleId}`
   - Vérifier que l'API retourne bien les payment_plans

---

## ✅ Validation finale

Une fois tous les tests réussis :

1. **Cocher tous les tests** dans le tableau de suivi
2. **Noter les observations** dans la colonne "Notes"
3. **Confirmer que les corrections fonctionnent** comme attendu

---

## 📝 Rapport de test

**Date** : _______________  
**Testeur** : _______________  
**Version** : 30 septembre 2025

**Résumé** :
- Tests réussis : _____ / 5
- Tests échoués : _____ / 5
- Problèmes rencontrés : _____________________________
- Commentaires : _____________________________________

---

## 🔗 Liens utiles

- Documentation du bug #1 : `FIX-BUG-MODIFICATION-PAIEMENT-1.md`
- Documentation du bug #2 : `FIX-CALCUL-MONTANT-ENCAISSE-ANALYTICS.md`
- Résumé des corrections : `RESUME-CORRECTIONS-30-SEPT-2025.md`

