# 🧪 Guide de Test - Modification des Paiements

## 🎯 Objectif

Tester le nouveau système de modification des paiements pour s'assurer qu'il fonctionne correctement.

---

## 📋 Prérequis

1. ✅ Backend démarré sur `http://localhost:3001`
2. ✅ Frontend démarré sur `http://localhost:5173`
3. ✅ Base de données PostgreSQL opérationnelle
4. ✅ Utilisateur connecté avec des ventes existantes

---

## 🚀 Démarrage Rapide

### **1. Démarrer le Backend**

```bash
cd backend
npm run dev
```

**Vérification** : Le serveur doit afficher :
```
✅ Serveur démarré sur le port 3001
✅ Base de données connectée
```

### **2. Démarrer le Frontend**

```bash
# Dans un nouveau terminal, à la racine du projet
npm run dev
```

**Vérification** : Le navigateur doit s'ouvrir sur `http://localhost:5173`

---

## 🧪 Scénarios de Test

### **Test 1 : Accéder à la Modification**

**Étapes** :
1. Se connecter à l'application
2. Aller sur la page "Gestion des Ventes"
3. Sélectionner un projet avec des ventes
4. Cliquer sur "Voir détails" pour une vente
5. Dans la section "Historique des paiements", cliquer sur le bouton **"Modifier"** d'un paiement

**Résultat attendu** :
- ✅ Le modal "Modifier le Paiement #X" s'ouvre
- ✅ Les informations actuelles du paiement sont affichées
- ✅ Le formulaire est pré-rempli avec les valeurs existantes

**Capture d'écran** :
```
┌─────────────────────────────────────────────────────┐
│ Modifier le Paiement #2                             │
├─────────────────────────────────────────────────────┤
│ Informations actuelles                              │
│ Montant actuel: 50 000,00 DH                        │
│ Mode de paiement: espece                            │
│ Date: 15/01/2025                                    │
├─────────────────────────────────────────────────────┤
│ Nouveau montant: [50000]  Date: [2025-01-15]       │
│ Mode de paiement: [Espèces ▼]                       │
│ Notes: [                                    ]       │
├─────────────────────────────────────────────────────┤
│                    [Annuler] [Modifier le paiement] │
└─────────────────────────────────────────────────────┘
```

---

### **Test 2 : Modifier le Montant**

**Étapes** :
1. Ouvrir le modal de modification (voir Test 1)
2. Changer le montant de `50000` à `60000`
3. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Toast de succès : "Paiement modifié - Le paiement de 60 000,00 DH a été modifié avec succès"
- ✅ Le modal se ferme automatiquement
- ✅ Le montant dans la liste est mis à jour à `60 000,00 DH`
- ✅ La barre de progression de la vente est mise à jour

**Vérification dans la console** :
```javascript
// Frontend
✅ Paiement modifié avec succès

// Backend
PUT /api/payments/plans/[id] 200 OK
```

---

### **Test 3 : Changer le Mode de Paiement**

**Étapes** :
1. Ouvrir le modal de modification
2. Changer le mode de paiement de "Espèces" à "Chèque"
3. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Toast de succès
- ✅ Le mode de paiement affiché change de 💵 (Espèces) à 💳 (Chèque)
- ✅ Les montants sont automatiquement répartis (montant_cheque = montant_paye, montant_espece = 0)

---

### **Test 4 : Mode Mixte (Chèque + Espèces)**

**Étapes** :
1. Ouvrir le modal de modification
2. Sélectionner "Chèque + Espèces" dans le mode de paiement
3. Une section "Répartition Espèces/Chèques" apparaît
4. Entrer :
   - Montant espèces : `30000`
   - Montant chèques : `20000`
5. Vérifier que le total = montant du paiement (50000)
6. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Toast de succès
- ✅ Dans les détails du paiement, la répartition s'affiche :
  ```
  Espèces: 30 000,00 DH
  Chèques: 20 000,00 DH
  ```

**Test d'erreur** :
- Entrer une répartition incorrecte (ex: 25000 + 20000 = 45000 ≠ 50000)
- ✅ Message d'erreur : "La répartition espèces/chèques doit égaler le montant total"
- ✅ Le bouton "Modifier le paiement" reste actif pour corriger

---

### **Test 5 : Modifier la Date**

**Étapes** :
1. Ouvrir le modal de modification
2. Changer la date de paiement (ex: de 15/01/2025 à 20/01/2025)
3. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Toast de succès
- ✅ La nouvelle date s'affiche dans l'historique des paiements
- ✅ La date prévue est également mise à jour (synchronisation automatique)

---

### **Test 6 : Ajouter/Modifier des Notes**

**Étapes** :
1. Ouvrir le modal de modification
2. Ajouter ou modifier le texte dans le champ "Notes"
   - Ex: "Paiement modifié suite à négociation client"
3. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Toast de succès
- ✅ Les notes sont sauvegardées (vérifiable en rouvrant le modal)

---

### **Test 7 : Validation des Erreurs**

#### **7.1 Montant Invalide**

**Étapes** :
1. Ouvrir le modal de modification
2. Entrer un montant de `0` ou laisser vide
3. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Message d'erreur sous le champ : "Le montant doit être supérieur à 0"
- ✅ Le formulaire ne se soumet pas

#### **7.2 Date Manquante**

**Étapes** :
1. Ouvrir le modal de modification
2. Effacer la date de paiement
3. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Message d'erreur : "La date de paiement est requise"
- ✅ Le formulaire ne se soumet pas

#### **7.3 Répartition Incorrecte (Mode Mixte)**

**Étapes** :
1. Ouvrir le modal de modification
2. Sélectionner "Chèque + Espèces"
3. Entrer une répartition qui ne correspond pas au total
   - Ex: Montant total = 50000, Espèces = 30000, Chèques = 15000 (total = 45000)
4. Cliquer sur "Modifier le paiement"

**Résultat attendu** :
- ✅ Message d'erreur : "La répartition espèces/chèques doit égaler le montant total"
- ✅ Le formulaire ne se soumet pas

---

### **Test 8 : Vérification de la Persistance**

**Étapes** :
1. Modifier un paiement (ex: changer le montant de 50000 à 60000)
2. Fermer le modal de détails de la vente
3. Rafraîchir la page (F5)
4. Rouvrir les détails de la même vente

**Résultat attendu** :
- ✅ Le montant modifié (60000) est toujours affiché
- ✅ Toutes les modifications sont persistées dans la base de données

---

### **Test 9 : Rechargement Automatique**

**Étapes** :
1. Ouvrir les détails d'une vente
2. Modifier un paiement
3. Observer la mise à jour de l'interface

**Résultat attendu** :
- ✅ Le modal de modification se ferme
- ✅ Les données dans `SaleDetailsModal` sont rechargées automatiquement
- ✅ La liste des ventes dans `Sales.tsx` est également mise à jour
- ✅ La barre de progression reflète le nouveau montant

---

### **Test 10 : Restrictions d'Accès**

#### **10.1 Paiements Virtuels**

**Étapes** :
1. Ouvrir les détails d'une vente
2. Chercher l'avance initiale (paiement virtuel)

**Résultat attendu** :
- ✅ Le bouton "Modifier" n'est PAS affiché pour les paiements virtuels
- ✅ Seuls les paiements réels (avec montant_paye > 0) ont le bouton "Modifier"

#### **10.2 Ventes Annulées**

**Étapes** :
1. Ouvrir les détails d'une vente annulée

**Résultat attendu** :
- ✅ Le bouton "Modifier" est désactivé (grisé)
- ✅ Impossible de modifier les paiements d'une vente annulée

---

## 🔍 Vérifications dans la Base de Données

### **Requête SQL pour Vérifier les Modifications**

```sql
-- Voir les détails d'un paiement spécifique
SELECT 
  id,
  sale_id,
  numero_echeance,
  montant_paye,
  montant_prevu,
  date_paiement,
  date_prevue,
  mode_paiement,
  montant_espece,
  montant_cheque,
  notes,
  statut,
  updated_at
FROM payment_plans
WHERE id = 'ID_DU_PAIEMENT'
ORDER BY updated_at DESC;
```

**Vérifications** :
- ✅ `montant_paye` = nouveau montant
- ✅ `montant_prevu` = `montant_paye` (synchronisé)
- ✅ `date_paiement` = nouvelle date
- ✅ `date_prevue` = `date_paiement` (synchronisé)
- ✅ `mode_paiement` = nouveau mode
- ✅ `montant_espece` et `montant_cheque` = répartition correcte
- ✅ `statut` = 'paye'
- ✅ `updated_at` = timestamp de la modification

---

## 📊 Logs à Surveiller

### **Frontend (Console du Navigateur)**

```javascript
// Lors de l'ouverture du modal
🔄 [SaleDetailsModal] Rechargement des données de paiement pour la vente: [ID]

// Lors de la soumission
Envoi de la modification du paiement...

// En cas de succès
✅ Paiement modifié avec succès
🔄 Déclenchement du rafraîchissement parent...
```

### **Backend (Terminal)**

```bash
# Requête reçue
PUT /api/payments/plans/[ID] - Body: { montant_paye: 60000, ... }

# Validation
✅ Plan de paiement trouvé
✅ Données validées

# Mise à jour
UPDATE payment_plans SET montant_paye = 60000, ...

# Réponse
200 OK - { success: true, data: {...}, message: "Paiement modifié avec succès" }
```

---

## ❌ Problèmes Courants et Solutions

### **Problème 1 : Le bouton "Modifier" n'apparaît pas**

**Causes possibles** :
- Le paiement est virtuel (ID commence par "virtual-")
- Le montant payé est 0
- La vente est annulée

**Solution** :
- Vérifier que le paiement est réel et a un montant > 0
- Vérifier le statut de la vente

### **Problème 2 : Erreur 404 lors de la modification**

**Cause** :
- Le backend n'est pas démarré
- La route n'est pas correctement configurée

**Solution** :
```bash
# Redémarrer le backend
cd backend
npm run dev
```

### **Problème 3 : Les modifications ne sont pas sauvegardées**

**Cause** :
- Problème de connexion à la base de données
- Erreur de validation côté serveur

**Solution** :
- Vérifier les logs du backend
- Vérifier la connexion PostgreSQL
- Vérifier que les données envoyées sont valides

### **Problème 4 : L'interface ne se met pas à jour**

**Cause** :
- Le rechargement automatique ne fonctionne pas

**Solution** :
- Vérifier que `onSuccess` appelle bien `reloadPaymentData()`
- Rafraîchir manuellement la page (F5)

---

## ✅ Checklist de Validation

Avant de considérer le système comme validé, vérifier :

- [ ] Le modal s'ouvre correctement
- [ ] Les données actuelles sont affichées
- [ ] Le formulaire est pré-rempli
- [ ] La modification du montant fonctionne
- [ ] Le changement de mode de paiement fonctionne
- [ ] Le mode mixte (Chèque + Espèces) fonctionne
- [ ] La modification de la date fonctionne
- [ ] Les notes sont sauvegardées
- [ ] Les validations d'erreur fonctionnent
- [ ] Les données persistent après rafraîchissement
- [ ] L'interface se met à jour automatiquement
- [ ] Les paiements virtuels ne sont pas modifiables
- [ ] Les ventes annulées ne sont pas modifiables
- [ ] Les logs sont corrects (frontend et backend)
- [ ] Les données en base de données sont correctes

---

## 🎉 Conclusion

Si tous les tests passent, le système de modification des paiements est **opérationnel** et prêt pour la production ! 🚀

**Date de test** : _____________  
**Testé par** : _____________  
**Résultat** : ✅ Validé / ❌ À corriger

