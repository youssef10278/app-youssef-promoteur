# 🛠️ SOLUTIONS ALTERNATIVES - CONTOURNEMENT POWERSHELL

## 🎯 Objectif
Démarrer le backend Node.js sur le port 3001 malgré le problème PowerShell

## 🔧 Solution 1 : Git Bash (Recommandée)

```bash
# Ouvrir Git Bash dans le répertoire
cd /c/1-YOUSSEF/6-work/15-promoteur-app-web-01/backend
node dist/server.js
```

## 🔧 Solution 2 : VS Code Terminal

1. Ouvrir VS Code dans le projet
2. Terminal → New Terminal
3. Sélectionner "Command Prompt" ou "Git Bash"
4. Exécuter :
```bash
cd backend
node dist/server.js
```

## 🔧 Solution 3 : CMD Direct

1. Windows + R → `cmd`
2. Naviguer vers le projet :
```cmd
cd C:\1-YOUSSEF\6-work\15-promoteur-app-web-01\backend
node dist/server.js
```

## 🔧 Solution 4 : PowerShell Clean

```powershell
# Nouveau PowerShell sans profil
powershell -NoProfile -NoLogo
cd C:\1-YOUSSEF\6-work\15-promoteur-app-web-01\backend
node dist/server.js
```

## 🔧 Solution 5 : Docker Exec (Alternative)

Si Node.js pose problème, utiliser Docker :
```bash
# Créer un conteneur Node.js temporaire
docker run -it --rm -v C:\1-YOUSSEF\6-work\15-promoteur-app-web-01:/app -p 3001:3001 node:18 bash
cd /app/backend
node dist/server.js
```

## 🔧 Solution 6 : Script Batch Forcé

Double-cliquer sur `DIAGNOSTIC-RAPIDE.bat` qui contourne PowerShell

## 🧪 Tests de Validation

Une fois le backend démarré, tester dans un navigateur :
- http://localhost:3001/health
- http://localhost:3001/ (page d'accueil API)

## 🚀 Démarrage Frontend

Une fois le backend fonctionnel :
```bash
# Dans un autre terminal
npm run dev
# Puis ouvrir http://localhost:5173
```

## 📞 Support

Si aucune solution ne fonctionne :
1. Redémarrer l'ordinateur
2. Utiliser un autre ordinateur
3. Utiliser GitHub Codespaces ou un environnement cloud
