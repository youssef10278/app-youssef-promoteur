# Guide de Test - Chèques dans les Dépenses

## Problème Résolu

Quand on ajoute une dépense avec un chèque, le chèque doit maintenant apparaître automatiquement dans la page chèques, section "chèques donnés".

## Modifications Apportées

### 1. Système d'Événements (EventBus)

**Fichier créé :** `src/utils/eventBus.ts`
- Système de communication entre composants
- Permet aux pages de s'informer mutuellement des changements
- Événements disponibles : CHECK_CREATED, CHECK_UPDATED, CHECK_DELETED, etc.

### 2. Page Dépenses (src/pages/Expenses.tsx)

**Modifications :**
- Import de l'EventBus
- Émission d'un événement `CHECK_CREATED` après création d'un chèque
- Données transmises : informations du chèque + source ('expense')

**Code ajouté :**
```typescript
// Après création réussie du chèque
eventBus.emit(EVENTS.CHECK_CREATED, {
  check: checkResponse.data,
  source: 'expense'
});
```

### 3. Page Chèques (src/pages/Checks.tsx)

**Modifications :**
- Import de l'EventBus
- Écoute de l'événement `CHECK_CREATED`
- Rafraîchissement automatique de la liste des chèques
- Notification toast quand un chèque vient d'une dépense

**Code ajouté :**
```typescript
// Écouter les événements de création de chèques
useEffect(() => {
  const unsubscribe = eventBus.on(EVENTS.CHECK_CREATED, (data) => {
    fetchChecks(); // Rafraîchir la liste
    if (data?.source === 'expense') {
      toast({
        title: "Chèque ajouté",
        description: "Un nouveau chèque a été créé via une dépense",
      });
    }
  });
  return unsubscribe;
}, []);
```

## ✅ RÉSULTAT DU TEST

**Date du test :** 29 septembre 2025
**Statut :** ✅ **SUCCÈS COMPLET**

### Fonctionnalités Testées et Validées

1. ✅ **Création de dépense avec chèque** - Fonctionne parfaitement
2. ✅ **Émission d'événement CHECK_CREATED** - Événement émis avec succès
3. ✅ **Réception d'événement dans la page chèques** - Événement reçu et traité
4. ✅ **Affichage automatique du chèque** - Chèque visible immédiatement
5. ✅ **Données complètes et correctes** - Toutes les informations présentes
6. ✅ **Mention de la dépense source** - "• Dépense: [nom]" affiché correctement

### Données de Test Utilisées

- **Projet :** Résidence Test Playwright
- **Dépense :** Dépense Test avec Chèque (1500 DH)
- **Chèque :** CHQ-TEST-001, Fournisseur Test → Promoteur Test
- **Date d'émission :** 29/09/2025
- **Date d'encaissement :** 15/10/2025

### Résultat Visuel

Le chèque apparaît dans la page chèques avec :
- Badge "DONNÉ"
- Montant : 1500 DH
- Mention : "• Dépense: Dépense Test avec Chèque"
- Toutes les informations du chèque correctement affichées

## Comment Tester

### Test 1 : Création de Chèque via Dépense

1. **Aller sur la page Dépenses**
   - Cliquer sur "Ajouter une dépense"
   - Remplir les informations de base
   - Choisir mode de paiement "Chèque" ou "Chèque et Espèces"

2. **Ajouter un chèque**
   - Cliquer sur "Ajouter Chèque"
   - Remplir les informations du chèque :
     - Numéro de chèque
     - Nom du bénéficiaire
     - Nom de l'émetteur
     - Date d'émission
     - Montant
     - Description

3. **Soumettre la dépense**
   - Cliquer sur "Ajouter la dépense"
   - Vérifier le message de succès

4. **Vérifier dans la page Chèques**
   - Aller sur la page "Gestion des Chèques"
   - Aller dans l'onglet "Chèques Donnés"
   - Le chèque doit apparaître avec :
     - Le montant correct
     - Le numéro de chèque
     - La mention "Dépense: [nom de la dépense]"
     - Le statut "DONNÉ"

### Test 2 : Notification en Temps Réel

1. **Ouvrir deux onglets**
   - Onglet 1 : Page Dépenses
   - Onglet 2 : Page Chèques (onglet "Chèques Donnés")

2. **Créer une dépense avec chèque dans l'onglet 1**
   - Suivre les étapes du Test 1

3. **Vérifier l'onglet 2**
   - Le chèque doit apparaître automatiquement
   - Une notification toast doit s'afficher
   - Le compteur des chèques donnés doit se mettre à jour

### Test 3 : Vérification des Données

1. **Créer une dépense avec chèque**
2. **Dans la page Chèques, vérifier que :**
   - Le type est bien "donne" (chèque donné)
   - Le montant correspond
   - Le projet est correct
   - La description mentionne la dépense
   - Toutes les informations du chèque sont présentes

## Vérifications Techniques

### Console du Navigateur

Ouvrir les outils de développement (F12) et vérifier :

1. **Lors de la création d'une dépense avec chèque :**
   ```
   📤 Envoi du chèque: {données du chèque}
   ✅ Chèque créé avec succès
   ```

2. **Dans la page Chèques :**
   ```
   🔄 Événement CHECK_CREATED reçu: {données de l'événement}
   ```

### Base de Données

Vérifier que dans la table `checks` :
- Le champ `type_cheque` est bien "donne"
- Le champ `expense_id` référence la bonne dépense
- Tous les autres champs sont correctement remplis

## Dépannage

### Le chèque n'apparaît pas dans la page Chèques

1. **Vérifier la console :** Y a-t-il des erreurs ?
2. **Rafraîchir manuellement :** F5 sur la page Chèques
3. **Vérifier les filtres :** S'assurer qu'aucun filtre ne cache le chèque
4. **Vérifier le projet :** S'assurer que le bon projet est sélectionné

### L'événement n'est pas émis

1. **Vérifier la création du chèque :** Y a-t-il une erreur lors de la création ?
2. **Vérifier les imports :** EventBus correctement importé ?
3. **Vérifier la console :** Messages d'erreur ?

### La notification n'apparaît pas

1. **Vérifier que la page Chèques est ouverte**
2. **Vérifier les useEffect :** L'écoute d'événements est-elle active ?
3. **Tester avec le composant de test :** Utiliser EventBusTest.tsx

## Composant de Test

Un composant de test est disponible : `src/components/test/EventBusTest.tsx`

Pour l'utiliser :
1. L'importer dans une page
2. L'afficher temporairement
3. Tester la communication entre pages

## Améliorations Futures

1. **Persistance des événements :** Sauvegarder les événements pour les pages non ouvertes
2. **WebSocket :** Communication en temps réel entre utilisateurs
3. **Historique des événements :** Log des actions pour audit
4. **Notifications push :** Notifications système pour les événements importants
