# Frontend Dockerfile
FROM node:18.18.0-alpine

WORKDIR /app

# Copier les fichiers de configuration
COPY package.json .
COPY .npmrc .

# Installer les dépendances sans lockfile
RUN npm install --no-package-lock --legacy-peer-deps

# Copier le code source
COPY . .

# Build de l'application
RUN npm run build

# Exposer le port
EXPOSE 8080

# Démarrer l'application
CMD ["npm", "start"]
