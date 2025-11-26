#!/bin/bash

cd "$(dirname "$0")"

echo "Récupération des dernières modifications (git pull)"
git pull origin main

echo "Construction des images Docker"
docker compose -f docker-compose.prod.yml build

echo "Recréation des conteneurs (mise à jour de la stack)"
docker compose -f docker-compose.prod.yml up -d --force-recreate

echo "Nettoyage des anciennes images Docker"
docker image prune -f

echo "Déploiement terminé avec succès"
