# Guide de Déploiement — SystemsMatic (Full VPS, Version Finale)

Ce guide décrit **l’architecture réelle et définitive** de SystemsMatic telle qu’elle fonctionne aujourd’hui :

- **tout est hébergé dans ton VPS**, en Docker, sans Netlify, sans Render, sans certbot dans la stack.
- Le déploiement passe par **un script deploy.sh** exécuté sur le VPS.
- La seule partie en cloud est : **NeonDB** (PostgreSQL) et **Resend** (emails).

---

# 1. Infrastructure actuelle

- **Frontend** → Next.js (Docker, Node 20) dans le VPS
- **Backend** → NestJS (Docker) dans le VPS
- **Reverse Proxy** → Nginx
- **HTTPS** → Certbot exécuté une fois (hors Docker), certificats stockés dans `/etc/letsencrypt/`
- **Monitoring** → Grafana + Prometheus (dans Docker)
- **Base de données** → NeonDB
- **Emails** → Resend
- **Déploiement** → Script `deploy.sh` sur le VPS
- **CI** → GitHub Actions (lint, tests, build, Sonar). Aucun CD.

---

# 2. Architecture globale

```
                     Utilisateurs
                           │
                     HTTPS + DNS OVH
                           │
                   ┌───────┴────────┐
                   │      VPS       │
                   │   Dockerisé    │
                   └───────┬────────┘
             ┌─────────────┼───────────────┐
             │             │               │
        Frontend       Backend        Monitoring
        Next.js        NestJS       Grafana + Prometheus
             │             │               │
             └─────── Nginx Reverse Proxy ─┘
                           │
                      NeonDB / Resend
```

---

# 3. Développement local

### A. Cloner le repo

```bash
git clone <repo>
cd SystemsMatic
```

### B. Configurer les environnements

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp .env.example .env
```

### C. Lancer toute la stack

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

### D. Services locaux

- Frontend : http://localhost:3000
- Backend : http://localhost:3001
- Grafana : http://localhost:3002
- Prometheus : http://localhost:9090

---

# 4. Infrastructure VPS

## Arborescence recommandée

```
/home/ubuntu/systemsmatic/
 ├── backend/
 ├── frontend/
 ├── docker-compose.prod.yml
 ├── .env.production
 ├── nginx/
 │     ├── api.conf
 │     ├── frontend.conf
 │     └── monitoring.conf
 ├── deploy.sh
```

---

# 5. Nginx (reverse proxy)

## A. Frontend — `kenzocda.fr`

```nginx
server {
    server_name kenzocda.fr www.kenzocda.fr;

    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/kenzocda.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/kenzocda.fr/privkey.pem;
}

server {
    listen 80;
    server_name kenzocda.fr www.kenzocda.fr;
    return 301 https://$host$request_uri;
}
```

## B. Backend — `api.kenzocda.fr`

```nginx
server {
    server_name api.kenzocda.fr;

    location / {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/api.kenzocda.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.kenzocda.fr/privkey.pem;
}

server {
    listen 80;
    server_name api.kenzocda.fr;
    return 301 https://$host$request_uri;
}
```

## C. Monitoring — `monitoring.kenzocda.fr`

```nginx
server {
    server_name monitoring.kenzocda.fr;

    location / {
        proxy_pass http://grafana:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto https;
    }

    listen 443 ssl;
    ssl_certificate     /etc/letsencrypt/live/monitoring.kenzocda.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/monitoring.kenzocda.fr/privkey.pem;
}

server {
    listen 80;
    server_name monitoring.kenzocda.fr;
    return 301 https://$host$request_uri;
}
```

---

# 🔧 6. Déploiement (deploy.sh)

Script :

```bash
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
```

---

# 7. CI/CD (GitHub Actions)

La CI exécute automatiquement :

- Lint
- Tests Jest (backend & frontend)
- Tests Playwright (si des fichiers E2E ont été modifiés)
- Build backend & frontend
- Analyse SonarCloud
- Upload des rapports de couverture
- Notifications Discord

---

## Déploiement (CD)

Le déploiement est **entièrement automatisé** grâce au workflow `cd.yml`.

Lorsqu’un push sur la branche `main` déclenche la CI et que celle-ci se termine avec succès :

1. GitHub Actions déclenche automatiquement le workflow de déploiement.
2. Il se connecte en **SSH au VPS** via `appleboy/ssh-action`.
3. Il exécute automatiquement le script :

```bash
./deploy.sh
```

---

# 8. DNS OVH

### Domaine principal + frontend

```

A kenzocda.fr <IP VPS>
A www <IP VPS>

```

### API

```

A api <IP VPS>

```

### Monitoring

```

A monitoring <IP VPS>

```

### Emails Resend

```

TXT resend.\_domainkey <clé DKIM>
TXT \_dmarc v=DMARC1; p=none;

```

---

# 9. Monitoring (VPS)

- Grafana → https://monitoring.kenzocda.fr
- Prometheus → exposé en interne
- Backend expose `/metrics` pour Prometheus

---

# 10. Commandes de maintenance

```bash
docker compose ps
docker logs backend
docker logs frontend
docker system prune -a
sudo systemctl restart nginx
```

---

# 11. Dépannage

## API KO

- Vérifier Nginx
- Vérifier `docker logs backend`
- Vérifier `.env.production`

## Front KO

- Vérifier `frontend.conf`
- Vérifier build Docker

## HTTPS KO

- Vérifier les certificats :

```
/etc/letsencrypt/live/<domaine>/
```
