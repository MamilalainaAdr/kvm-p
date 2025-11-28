# Frontend - Mode Développement
FROM node:20-alpine

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances Node.js
RUN npm install

# Copie du code source
COPY . .

# Exposition du port Vite
EXPOSE 5173

# Commande de démarrage en mode développement
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]