#!/bin/bash
set -e

# Project directory
cd /home/ubuntu/SystemsMatic

# Update repository
echo "Mise à jour du repository..."
git pull origin main

# Pull latest images from GHCR
echo "Pull des dernières images..."
docker compose -f docker-compose.prod.yml pull

# Restart containers with new images
echo "Redémarrage des services..."
docker compose -f docker-compose.prod.yml up -d --remove-orphans

# Clean up unused images
echo "Nettoyage des anciennes images..."
docker image prune -f

# Fin du déploiement
echo "Déploiement terminé."
