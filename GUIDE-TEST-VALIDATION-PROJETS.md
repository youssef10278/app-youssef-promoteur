# 🧪 Guide de Test - Validation des Modifications de Projets

## 📋 **Objectif**
Tester la validation préventive qui empêche la modification du nombre d'unités d'un projet si cela créerait une incohérence avec les ventes existantes.

## 🚀 **Fonctionnalité Implémentée**

### **Validation Backend**
- ✅ Vérification du nombre de ventes existantes avant modification
- ✅ Blocage de la modification si elle créerait une incohérence
- ✅ Message d'erreur détaillé avec solutions proposées

### **Validation Frontend**
- ✅ Affichage d'un message d'erreur clair et structuré
- ✅ Toast avec durée prolongée pour les erreurs de validation
- ✅ Gestion différenciée des erreurs de validation vs erreurs générales

## 🧪 **Scénarios de Test**

### **Test 1 : Modification Interdite (Réduction)**
1. **Créer un projet** avec 20 appartements
2. **Vendre 15 appartements** (créer des ventes)
3. **Essayer de modifier** le projet pour n'avoir que 2 appartements
4. **Résultat attendu** : ❌ Modification bloquée avec message d'erreur

### **Test 2 : Modification Autorisée (Augmentation)**
1. **Créer un projet** avec 20 appartements
2. **Vendre 15 appartements** (créer des ventes)
3. **Modifier le projet** pour avoir 25 appartements
4. **Résultat attendu** : ✅ Modification réussie

### **Test 3 : Modification Interdite (Réduction Partielle)**
1. **Créer un projet** avec 20 appartements
2. **Vendre 15 appartements** (créer des ventes)
3. **Essayer de modifier** le projet pour avoir 10 appartements
4. **Résultat attendu** : ❌ Modification bloquée avec message d'erreur

## 🔧 **Comment Tester**

### **Méthode 1 : Test Automatique (Script)**
```bash
# Exécuter le script de test
node test-project-validation.js
```

### **Méthode 2 : Test Manuel (Interface)**
1. **Démarrer l'application**
   ```bash
   npm run dev
   ```

2. **Créer un projet de test**
   - Aller sur la page "Gestion des Projets"
   - Créer un nouveau projet avec 20 appartements

3. **Créer des ventes**
   - Aller sur la page "Gestion des Ventes"
   - Créer 15 ventes d'appartements pour ce projet

4. **Tester la modification**
   - Retourner sur "Gestion des Projets"
   - Cliquer sur "Modifier" pour le projet
   - Essayer de réduire le nombre d'appartements à 2
   - Vérifier que la modification est bloquée

## 📊 **Messages d'Erreur Attendus**

### **Erreur de Validation**
```
Titre: "Modification impossible"
Message: "Impossible de modifier le nombre d'unités car des ventes existent déjà :
• 15 appartement(s) vendu(s) mais seulement 2 disponible(s)

Solutions possibles :
• Annuler les ventes concernées avant de modifier le projet
• Créer un nouveau projet avec la nouvelle configuration
• Augmenter le nombre d'unités au lieu de le diminuer"
```

## ✅ **Critères de Succès**

### **Backend**
- [ ] La modification est bloquée si elle créerait une incohérence
- [ ] Un message d'erreur détaillé est retourné
- [ ] Les solutions alternatives sont proposées
- [ ] L'augmentation du nombre d'unités est autorisée

### **Frontend**
- [ ] Le message d'erreur est affiché clairement
- [ ] Le toast reste affiché suffisamment longtemps
- [ ] L'utilisateur comprend pourquoi la modification est bloquée
- [ ] Les solutions sont visibles et compréhensibles

## 🐛 **Dépannage**

### **Problème : Modification réussie alors qu'elle devrait échouer**
- Vérifier que les ventes sont bien créées dans la base de données
- Vérifier que le projet_id correspond bien
- Vérifier que le type_unite est correct ('appartement', 'garage', 'lot')

### **Problème : Message d'erreur non affiché**
- Vérifier la console du navigateur pour les erreurs
- Vérifier que le backend retourne bien un status 400
- Vérifier que le message d'erreur contient le texte attendu

### **Problème : Test automatique échoue**
- Vérifier la connexion à la base de données
- Vérifier que les tables existent
- Vérifier que l'utilisateur ID 1 existe

## 📝 **Notes Importantes**

1. **Données de Test** : Le script de test crée des données temporaires qui sont supprimées à la fin
2. **Base de Données** : Assurez-vous que la base de données est accessible
3. **Utilisateur** : Le script utilise l'utilisateur ID 1 par défaut
4. **Nettoyage** : Les données de test sont automatiquement supprimées

## 🎯 **Résultat Final**

La validation préventive fonctionne correctement et empêche les modifications incohérentes tout en permettant les modifications logiques (augmentation du nombre d'unités).
