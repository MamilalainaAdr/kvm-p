# Backend - Mode Développement
FROM node:20-alpine

# Installation des dépendances système pour Terraform, KVM et build tools
RUN apk add --no-cache \
    wget \
    unzip \
    ca-certificates \
    qemu-img \
    libvirt-client \
    xorriso

ENV LIBVIRT_DEFAULT_URI="qemu:///system"

# Installation de Terraform
RUN wget -O terraform.zip https://releases.hashicorp.com/terraform/1.13.3/terraform_1.13.3_linux_amd64.zip && \
    unzip terraform.zip && \
    mv terraform /usr/local/bin/ && \
    rm terraform.zip

WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation des dépendances Node.js
RUN npm install

# Copie du code source
COPY . .

# Création du répertoire pour Terraform
RUN mkdir -p /app/terraform

# Création de l'utilisateur au groupe libvirt
# LIBVIRT_GID à récupérer via getent group libvirt sur l'hote
ARG LIBVIRT_GID=142
RUN delgroup libvirt 2>/dev/null || true && \
    addgroup -g $LIBVIRT_GID -S libvirt && \
    adduser node libvirt

USER node

# Exposition du port
EXPOSE 4000

# Commande de démarrage en mode développement
CMD ["npm", "run", "dev"]