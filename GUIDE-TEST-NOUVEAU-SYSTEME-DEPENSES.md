# 🧪 Guide de Test - Nouveau Système de Dépenses

## 🎯 Objectif
Ce guide vous permet de tester le nouveau système de dépenses avec paiements progressifs.

## 📋 Prérequis
- ✅ Migration de la base de données exécutée
- ✅ Backend démarré et fonctionnel
- ✅ Frontend compilé et accessible
- ✅ Compte utilisateur créé
- ✅ Au moins un projet existant

## 🧪 Tests à Effectuer

### **Test 1 : Création d'une Dépense Simple**

#### Étapes :
1. **Naviguer** vers la page "Dépenses"
2. **Cliquer** sur "Ajouter Dépense"
3. **Vérifier** que le nouveau formulaire simplifié s'affiche
4. **Remplir** les champs :
   - Projet : Sélectionner un projet existant
   - Nom : "Plombier"
   - Description : "Travaux de plomberie pour le projet"
5. **Cliquer** sur "Créer la Dépense"

#### Résultats Attendus :
- ✅ Formulaire simplifié (pas de champs de montant)
- ✅ Message de succès affiché
- ✅ Dépense créée avec montant total = 0
- ✅ Retour à la liste des dépenses
- ✅ Nouvelle dépense visible dans la liste

---

### **Test 2 : Ajout du Premier Paiement**

#### Étapes :
1. **Localiser** la dépense créée dans la liste
2. **Cliquer** sur "Voir Détails" ou l'icône d'œil
3. **Vérifier** l'affichage des détails (montant total = 0)
4. **Cliquer** sur "Ajouter Paiement"
5. **Remplir** le formulaire de paiement :
   - Montant payé : 1500
   - Montant déclaré : 1200
   - Montant non déclaré : 300
   - Date : Date du jour
   - Mode : Espèces
   - Description : "Premier paiement - Réparation salle de bain"
6. **Cliquer** sur "Ajouter le Paiement"

#### Résultats Attendus :
- ✅ Modal de paiement s'ouvre
- ✅ Calcul automatique des montants
- ✅ Validation des montants cohérents
- ✅ Message de succès
- ✅ Paiement ajouté à l'historique
- ✅ Total de la dépense mis à jour (1500 DH)

---

### **Test 3 : Ajout d'un Deuxième Paiement**

#### Étapes :
1. **Cliquer** à nouveau sur "Ajouter Paiement"
2. **Remplir** le formulaire :
   - Montant payé : 2000
   - Montant déclaré : 2000
   - Montant non déclaré : 0
   - Date : Date ultérieure
   - Mode : Chèque
   - Référence : "CHQ123456"
   - Description : "Deuxième paiement - Installation cuisine"
3. **Cliquer** sur "Ajouter le Paiement"

#### Résultats Attendus :
- ✅ Champ référence obligatoire pour chèque
- ✅ Paiement ajouté avec succès
- ✅ Total mis à jour (3500 DH)
- ✅ Historique chronologique des paiements
- ✅ Calculs des totaux corrects

---

### **Test 4 : Vérification des Calculs Automatiques**

#### Étapes :
1. **Vérifier** dans les détails de la dépense :
   - Total payé
   - Total déclaré
   - Total non déclaré
   - Nombre de paiements
2. **Retourner** à la liste des dépenses
3. **Vérifier** que les montants sont corrects dans la liste

#### Résultats Attendus :
- ✅ Total payé : 3500 DH (1500 + 2000)
- ✅ Total déclaré : 3200 DH (1200 + 2000)
- ✅ Total non déclaré : 300 DH (300 + 0)
- ✅ Nombre de paiements : 2
- ✅ Cohérence entre détails et liste

---

### **Test 5 : Gestion des Modes de Paiement**

#### Étapes :
1. **Ajouter** un paiement par virement :
   - Mode : Virement
   - Référence : "VIR-2024-001"
2. **Ajouter** un paiement mixte :
   - Mode : Chèque + Espèces
3. **Vérifier** les icônes et labels

#### Résultats Attendus :
- ✅ Champ référence obligatoire pour virement
- ✅ Icônes appropriées pour chaque mode
- ✅ Labels corrects affichés
- ✅ Validation des références

---

### **Test 6 : Suppression d'un Paiement**

#### Étapes :
1. **Localiser** un paiement dans l'historique
2. **Cliquer** sur l'icône de suppression
3. **Confirmer** la suppression
4. **Vérifier** la mise à jour des totaux

#### Résultats Attendus :
- ✅ Demande de confirmation
- ✅ Paiement supprimé de l'historique
- ✅ Totaux recalculés automatiquement
- ✅ Message de succès

---

### **Test 7 : Changement de Statut**

#### Étapes :
1. **Tester** le changement de statut vers "Terminée"
2. **Vérifier** les restrictions sur dépense terminée
3. **Tester** le statut "Annulée"

#### Résultats Attendus :
- ✅ Statut mis à jour
- ✅ Badge de statut affiché
- ✅ Restrictions appropriées appliquées

---

### **Test 8 : Filtres et Recherche**

#### Étapes :
1. **Utiliser** les filtres de la page dépenses
2. **Rechercher** par nom de dépense
3. **Filtrer** par mode de paiement
4. **Tester** les filtres de dates

#### Résultats Attendus :
- ✅ Filtres fonctionnels
- ✅ Résultats cohérents
- ✅ Compteurs mis à jour

---

### **Test 9 : Responsive Design**

#### Étapes :
1. **Tester** sur mobile (ou réduire la fenêtre)
2. **Vérifier** l'affichage des modals
3. **Tester** la navigation

#### Résultats Attendus :
- ✅ Interface adaptée mobile
- ✅ Modals utilisables
- ✅ Navigation fluide

---

### **Test 10 : Compatibilité avec l'Ancien Système**

#### Étapes :
1. **Vérifier** que les anciennes dépenses s'affichent
2. **Contrôler** que les totaux sont corrects
3. **Tester** la modification d'anciennes dépenses

#### Résultats Attendus :
- ✅ Anciennes dépenses visibles
- ✅ Migration transparente
- ✅ Fonctionnalités préservées

---

## 🐛 Problèmes Potentiels et Solutions

### **Problème : Calculs Incorrects**
- **Vérifier** que la migration a été exécutée
- **Contrôler** les triggers de base de données
- **Rafraîchir** la page

### **Problème : Erreurs API**
- **Vérifier** que le backend est à jour
- **Contrôler** les logs du serveur
- **Vérifier** la connexion à la base de données

### **Problème : Interface Non Responsive**
- **Vider** le cache du navigateur
- **Recompiler** le frontend
- **Vérifier** les CSS

---

## ✅ Checklist de Validation

- [ ] Création de dépense simple fonctionne
- [ ] Ajout de paiements progressifs fonctionne
- [ ] Calculs automatiques corrects
- [ ] Tous les modes de paiement supportés
- [ ] Suppression de paiements fonctionne
- [ ] Changement de statut fonctionne
- [ ] Filtres et recherche fonctionnels
- [ ] Interface responsive
- [ ] Compatibilité avec anciennes données
- [ ] Performance acceptable

---

## 📞 Support

En cas de problème :
1. **Consulter** les logs du navigateur (F12)
2. **Vérifier** les logs du serveur backend
3. **Contrôler** la base de données
4. **Contacter** l'équipe de développement

---

**🎉 Félicitations ! Si tous les tests passent, le nouveau système de dépenses est prêt pour la production !**
