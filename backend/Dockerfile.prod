# Dockerfile pour le backend NestJS
FROM node:20-alpine AS base

# Installer les dépendances nécessaires pour Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production && npm cache clean --force

# Générer le client Prisma
RUN npx prisma generate

# Stage de build
FROM node:20-alpine AS build

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier le code source
COPY . .

# Générer le client Prisma
RUN npx prisma generate

# Build de l'application
RUN npm run build

# Stage de production
FROM node:20-alpine AS production

# Installer les dépendances nécessaires pour Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer uniquement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Générer le client Prisma
RUN npx prisma generate

# Copier les fichiers buildés depuis le stage build
COPY --from=build --chown=nestjs:nodejs /app/dist ./dist
COPY --from=build --chown=nestjs:nodejs /app/public ./public

# Changer vers l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 3001

# Variables d'environnement
ENV NODE_ENV=production
ENV PORT=3001

# Commande de démarrage
CMD ["npm", "run", "start:prod"]


