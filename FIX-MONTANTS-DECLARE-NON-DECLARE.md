# 🔧 Correction - Affichage Montant Principal et Autre Montant à 0

## 📋 Problème Identifié

### Symptômes
Dans la page de gestion des ventes, les détails de chaque paiement affichaient :
- **Montant principal : 0 DH**
- **Autre montant : 0 DH**

Même si le montant total du paiement était correct (ex: 452 DH payé), la répartition entre montant principal (déclaré) et autre montant (non déclaré) n'était pas affichée.

### Capture du Problème
```
Paiement #3                                    20 DH
Espèces                                        Payé

Date prévue: 30/09/2025    Date de paiement: 30/09/2025

┌─────────────────────────────────────────────────────┐
│ Montant principal:          Autre montant:          │
│ 0 DH DH                     0 DH DH                 │
└─────────────────────────────────────────────────────┘

Résumé Financier:
┌─────────────────────────────────────────────────────┐
│ 452 DH                748 DH              37.7%     │
│ Montant payé          Montant restant    Progression│
│                                                      │
│ 0 DH DH                     0 DH DH                 │
│ Montant principal           Autre montant           │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Analyse de la Cause

### Fichier Concerné
`src/utils/paymentHistory.ts`

### Fonction Problématique
`createVirtualInitialPaymentPlan(sale: Sale)`

### Cause Racine
La fonction qui crée un **payment plan virtuel** pour l'avance initiale ne définissait PAS les champs :
- `montant_declare` (montant principal)
- `montant_non_declare` (autre montant)

Ces valeurs existent dans l'objet `sale` (`sale.avance_declare` et `sale.avance_non_declare`) mais n'étaient pas copiées dans le payment plan virtuel.

### Code Avant Correction

```typescript
export function createVirtualInitialPaymentPlan(sale: Sale): PaymentPlan | null {
  const totalAvance = (sale.avance_declare || 0) + (sale.avance_non_declare || 0);
  
  if (totalAvance <= 0) {
    return null;
  }
  
  return {
    id: `virtual-initial-${sale.id}`,
    sale_id: sale.id,
    user_id: sale.user_id,
    numero_echeance: 1,
    description: 'Avance initiale (premier paiement)',
    montant_prevu: totalAvance,
    montant_paye: totalAvance,
    date_prevue: sale.created_at.split('T')[0],
    date_paiement: sale.created_at,
    mode_paiement: sale.mode_paiement,
    montant_espece: sale.avance_espece || 0,
    montant_cheque: sale.avance_cheque || 0,
    statut: 'paye' as const,
    notes: 'Avance payée lors de la signature',
    created_at: sale.created_at,
    updated_at: sale.updated_at || sale.created_at
    // ❌ MANQUE: montant_declare et montant_non_declare
  };
}
```

### Problème Secondaire

La fonction `calculateUnifiedPaymentTotals` ne calculait pas non plus les totaux de `montant_declare` et `montant_non_declare`, ce qui empêchait l'affichage correct dans le résumé financier global.

```typescript
export function calculateUnifiedPaymentTotals(sale: Sale, paymentPlans: PaymentPlan[] = []) {
  const enrichedPlans = enrichPaymentPlansWithInitialAdvance(sale, paymentPlans);

  const totalPaid = enrichedPlans.reduce((sum, plan) => sum + (plan.montant_paye || 0), 0);
  const totalDue = sale.prix_total;
  const remainingAmount = totalDue - totalPaid;
  const percentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return {
    totalPaid,
    totalDue,
    remainingAmount,
    percentage,
    enrichedPaymentPlans: enrichedPlans
    // ❌ MANQUE: totalDeclare et totalNonDeclare
  };
}
```

---

## ✅ Solution Appliquée

### Correction 1 : Ajout des Champs dans le Payment Plan Virtuel

**Fichier :** `src/utils/paymentHistory.ts`  
**Lignes :** 3-35

```typescript
export function createVirtualInitialPaymentPlan(sale: Sale): PaymentPlan | null {
  const totalAvance = (sale.avance_declare || 0) + (sale.avance_non_declare || 0);
  
  if (totalAvance <= 0) {
    return null;
  }
  
  return {
    id: `virtual-initial-${sale.id}`,
    sale_id: sale.id,
    user_id: sale.user_id,
    numero_echeance: 1,
    description: 'Avance initiale (premier paiement)',
    montant_prevu: totalAvance,
    montant_paye: totalAvance,
    montant_declare: sale.avance_declare || 0,        // ✅ AJOUTÉ
    montant_non_declare: sale.avance_non_declare || 0, // ✅ AJOUTÉ
    date_prevue: sale.created_at.split('T')[0],
    date_paiement: sale.created_at,
    mode_paiement: sale.mode_paiement,
    montant_espece: sale.avance_espece || 0,
    montant_cheque: sale.avance_cheque || 0,
    statut: 'paye' as const,
    notes: 'Avance payée lors de la signature',
    created_at: sale.created_at,
    updated_at: sale.updated_at || sale.created_at
  };
}
```

### Correction 2 : Calcul des Totaux Déclaré/Non Déclaré

**Fichier :** `src/utils/paymentHistory.ts`
**Lignes :** 69-91

### Correction 3 : Envoi des Champs au Backend (Paiements Ajoutés)

**Fichier :** `src/services/salesServiceNew.ts`
**Lignes :** 250-285

```typescript
export function calculateUnifiedPaymentTotals(sale: Sale, paymentPlans: PaymentPlan[] = []) {
  const enrichedPlans = enrichPaymentPlansWithInitialAdvance(sale, paymentPlans);

  const totalPaid = enrichedPlans.reduce((sum, plan) => sum + (plan.montant_paye || 0), 0);
  const totalDeclare = enrichedPlans.reduce((sum, plan) => sum + (plan.montant_declare || 0), 0);      // ✅ AJOUTÉ
  const totalNonDeclare = enrichedPlans.reduce((sum, plan) => sum + (plan.montant_non_declare || 0), 0); // ✅ AJOUTÉ
  const totalDue = sale.prix_total;
  const remainingAmount = totalDue - totalPaid;
  const percentage = totalDue > 0 ? (totalPaid / totalDue) * 100 : 0;

  return {
    totalPaid,
    totalDeclare,      // ✅ AJOUTÉ
    totalNonDeclare,   // ✅ AJOUTÉ
    totalDue,
    remainingAmount,
    percentage,
    enrichedPaymentPlans: enrichedPlans
  };
}
```

### Correction 3 : Envoi des Champs au Backend

**Code Avant :**
```typescript
static async addPayment(saleId: string, paymentData: PaymentFormData): Promise<PaymentPlan> {
  try {
    const requestData = {
      saleId,
      paymentData: {
        date_paiement: paymentData.date_paiement,
        montant_paye: paymentData.montant_paye,
        mode_paiement: paymentData.mode_paiement,
        montant_espece: paymentData.montant_espece || 0,
        montant_cheque: paymentData.montant_cheque || 0,
        notes: paymentData.notes,
        nom_beneficiaire: paymentData.nom_beneficiaire,
        nom_emetteur: paymentData.nom_emetteur
        // ❌ MANQUE: montant_declare et montant_non_declare
      },
      cheques: paymentData.cheques || []
    };

    const response = await apiClient.post('/payments/complete-payment', requestData);
    return response.data.paymentPlan;
  } catch (error) {
    throw error;
  }
}
```

**Code Après :**
```typescript
static async addPayment(saleId: string, paymentData: PaymentFormData): Promise<PaymentPlan> {
  try {
    const requestData = {
      saleId,
      paymentData: {
        date_paiement: paymentData.date_paiement,
        montant_paye: paymentData.montant_paye,
        montant_declare: paymentData.montant_declare || 0,        // ✅ AJOUTÉ
        montant_non_declare: paymentData.montant_non_declare || 0, // ✅ AJOUTÉ
        mode_paiement: paymentData.mode_paiement,
        montant_espece: paymentData.montant_espece || 0,
        montant_cheque: paymentData.montant_cheque || 0,
        notes: paymentData.notes,
        nom_beneficiaire: paymentData.nom_beneficiaire,
        nom_emetteur: paymentData.nom_emetteur
      },
      cheques: paymentData.cheques || []
    };

    const response = await apiClient.post('/payments/complete-payment', requestData);
    return response.data.paymentPlan;
  } catch (error) {
    throw error;
  }
}
```

---

## 🎯 Impact de la Correction

### Composants Affectés

1. **SaleDetailsModal.tsx**
   - Affichage correct du résumé financier global
   - Affichage correct des montants pour chaque paiement

2. **SalesList.tsx**
   - Affichage correct du détail des montants dans les cartes de vente
   - Affichage correct dans l'historique expandable

3. **PaymentHistoryPrint.tsx**
   - Impression correcte des montants principal/autre montant

### Résultat Attendu Après Correction

```
Paiement #1 - Avance initiale                  432 DH
Espèces                                        Payé

Date prévue: 15/01/2025    Date de paiement: 15/01/2025

┌─────────────────────────────────────────────────────┐
│ Montant principal:          Autre montant:          │
│ 302.40 DH                   129.60 DH               │
└─────────────────────────────────────────────────────┘

Paiement #2                                    20 DH
Espèces                                        Payé

Date prévue: 30/09/2025    Date de paiement: 30/09/2025

┌─────────────────────────────────────────────────────┐
│ Montant principal:          Autre montant:          │
│ 14.00 DH                    6.00 DH                 │
└─────────────────────────────────────────────────────┘

Résumé Financier:
┌─────────────────────────────────────────────────────┐
│ 452 DH                748 DH              37.7%     │
│ Montant payé          Montant restant    Progression│
│                                                      │
│ 316.40 DH                   135.60 DH               │
│ Montant principal           Autre montant           │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Tests à Effectuer

### Test 1 : Vente Existante avec Avance Initiale
1. Ouvrir une vente existante qui a une avance initiale
2. Vérifier que le paiement #1 (Avance initiale) affiche :
   - Montant principal = `sale.avance_declare`
   - Autre montant = `sale.avance_non_declare`

### Test 2 : Vente avec Plusieurs Paiements
1. Ouvrir une vente avec plusieurs paiements
2. Vérifier que chaque paiement affiche ses montants corrects
3. Vérifier que le résumé financier global affiche :
   - Total montant principal = somme de tous les `montant_declare`
   - Total autre montant = somme de tous les `montant_non_declare`

### Test 3 : Nouvelle Vente
1. Créer une nouvelle vente avec une avance
2. Saisir les montants principal et autre montant
3. Vérifier que l'affichage est correct immédiatement

### Test 4 : Ajout de Paiement
1. Ajouter un nouveau paiement à une vente existante
2. Saisir les montants principal et autre montant
3. Vérifier que l'affichage est correct après ajout

### Test 5 : Impression
1. Imprimer l'historique d'une vente
2. Vérifier que les montants principal/autre montant sont corrects dans le PDF

---

## 📊 Flux de Données Corrigé

### Avant (Problématique)

```
Sale (DB)
  ├─ avance_declare: 300
  ├─ avance_non_declare: 132
  └─ payment_plans: []

↓ enrichPaymentPlansWithInitialAdvance()

Virtual Payment Plan
  ├─ montant_paye: 432
  ├─ montant_declare: undefined ❌
  └─ montant_non_declare: undefined ❌

↓ Affichage

Montant principal: 0 DH ❌
Autre montant: 0 DH ❌
```

### Après (Corrigé)

```
Sale (DB)
  ├─ avance_declare: 300
  ├─ avance_non_declare: 132
  └─ payment_plans: []

↓ enrichPaymentPlansWithInitialAdvance()

Virtual Payment Plan
  ├─ montant_paye: 432
  ├─ montant_declare: 300 ✅
  └─ montant_non_declare: 132 ✅

↓ Affichage

Montant principal: 300 DH ✅
Autre montant: 132 DH ✅
```

---

## 🔄 Prochaines Étapes

1. **Tester la correction** sur l'environnement de développement
2. **Vérifier** que toutes les ventes existantes affichent correctement les montants
3. **Valider** que les nouvelles ventes fonctionnent correctement
4. **Tester l'impression** pour s'assurer que les montants sont corrects
5. **Déployer** en production après validation

---

## 📝 Notes Techniques

### Pourquoi un Payment Plan Virtuel ?

L'avance initiale est stockée directement dans la table `sales` (champs `avance_declare`, `avance_non_declare`, etc.) et non dans la table `payment_plans`. 

Pour unifier l'affichage et les calculs, on crée un **payment plan virtuel** qui représente cette avance initiale. Cela permet :
- D'avoir un historique complet des paiements
- De simplifier les calculs de totaux
- D'avoir un affichage cohérent

### Champs Importants

**Dans la table `sales` :**
- `avance_declare` : Montant principal de l'avance
- `avance_non_declare` : Autre montant de l'avance
- `avance_espece` : Montant en espèces
- `avance_cheque` : Montant en chèques
- `mode_paiement` : Mode de paiement de l'avance

**Dans la table `payment_plans` :**
- `montant_declare` : Montant principal du paiement
- `montant_non_declare` : Autre montant du paiement
- `montant_paye` : Montant total payé
- `montant_espece` : Montant en espèces
- `montant_cheque` : Montant en chèques

---

## ✅ Résumé

### Problème 1 : Avance Initiale
**Problème :** Les montants principal et autre montant de l'avance initiale affichaient 0 DH
**Cause :** Champs manquants dans le payment plan virtuel de l'avance initiale
**Solution :** Ajout de `montant_declare` et `montant_non_declare` dans le payment plan virtuel
**Fichier modifié :** `src/utils/paymentHistory.ts`

### Problème 2 : Paiements Ajoutés
**Problème :** Les montants principal et autre montant des paiements ajoutés affichaient 0 DH
**Cause :** Les champs `montant_declare` et `montant_non_declare` n'étaient pas envoyés au backend
**Solution :** Ajout de ces champs dans la requête API
**Fichier modifié :** `src/services/salesServiceNew.ts`

**Impact Global :** Affichage correct dans toute l'application (liste, détails, impression)

