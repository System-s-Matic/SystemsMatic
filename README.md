## SystemsMatic

SystemsMatic est une application web complète pour la gestion de demandes de contact, de devis et de rendez-vous pour une entreprise d'automatisation (portails, portes de garage, etc.).  
Elle combine un **site public moderne** et un **backoffice d’administration** permettant de suivre et traiter efficacement les demandes clients.

---

## 1. Objectifs du projet

- **Centraliser les demandes** : formulaires de contact/devis/prise de rendez-vous sur le site public.
- **Automatiser les échanges** : envoi d’emails transactionnels (confirmations, rappels, notifications internes).
- **Fluidifier l’organisation** : tableau de bord admin pour suivre les demandes, planifier ou reprogrammer les rendez-vous, gérer les devis.
- **Surveiller la plateforme** : exposition de métriques pour Prometheus et dashboards Grafana afin de monitorer la santé du système.

---

## 2. Fonctionnalités principales

- **Site public (Frontend)**

  - Page d’accueil présentant l’entreprise et ses services.
  - Formulaires de prise de rendez-vous et de demande de devis.
  - Pages légales : mentions légales, politique de confidentialité.
  - Système de chat / section de contact orientée conversion.

- **Backoffice (Admin)**

  - Authentification sécurisée pour les administrateurs.
  - Gestion des rendez-vous (création, mise à jour, reprogrammation, annulation).
  - Gestion des demandes de devis (création, acceptation, refus avec motif, suivi de statut).
  - Vue statistiques / suivi d’activité (rendez-vous, devis, contacts).

- **Emails & Automatisations**

  - Envoi d’emails via **Resend** (confirmation de rendez-vous, rappel, annulation, etc.).
  - Templates d’emails en React / HTML prévisualisables.
  - Notifications administrateur lors de nouvelles demandes / changements de statut.

- **Monitoring & Observabilité**
  - Endpoint `/metrics` côté backend pour Prometheus.
  - Dashboards Grafana accessibles via `monitoring.kenzocda.fr`.
  - Logs applicatifs accessibles via Docker / `docker logs`.

---

## 3. Stack technique

- **Frontend**

  - **Next.js** (App Router)
  - TypeScript
  - Tests unitaires & composants via **Jest** + **React Testing Library**
  - Tests E2E via **Playwright**

- **Backend**

  - **NestJS**
  - **Prisma** (ORM) connecté à **NeonDB** (PostgreSQL managé)
  - Exposition de métriques pour Prometheus
  - Tests unitaires/integ via Jest

- **Infrastructure**
  - VPS Linux (Dockerisé)
  - Reverse proxy **Nginx**
  - Certificats **Let’s Encrypt** générés une fois sur l’hôte (hors Docker)
  - Monitoring : **Prometheus + Grafana** (dans Docker)
  - Emails : **Resend**
  - CI : GitHub Actions (lint, tests, build, Sonar, couverture)
  - CD : GitHub Actions + SSH vers le VPS exécutant `deploy.sh`

---

## 4. Architecture globale

Architecture résumée (cf. `documentation/DEPLOYMENT.md` pour le détail) :

```text
Utilisateurs
      │
HTTPS + DNS OVH
      │
   ┌──┴───────────────┐
   │       VPS        │
   │    Dockerisé     │
   └───┬───────┬──────┘
       │       │
  Frontend   Backend      Monitoring
   Next.js    NestJS   Grafana + Prometheus
       │        │             │
       └──── Nginx Reverse Proxy ──┘
                         │
                    NeonDB / Resend
```

Nginx expose :

- `kenzocda.fr` et `www.kenzocda.fr` → service `frontend:3000`
- `api.kenzocda.fr` → service `backend:3001`
- `monitoring.kenzocda.fr` → service `grafana:3000`

Les certificats SSL sont stockés sur l’hôte dans `/etc/letsencrypt/`.

---

## 5. Développement local

### 5.1. Prérequis

- Git
- Docker & Docker Compose
- Node.js (optionnel si tu veux lancer les apps hors Docker)

### 5.2. Cloner le projet

```bash
git clone <repo>
cd SystemsMatic
```

### 5.3. Configuration des environnements

Les exemples de configuration sont fournis pour le backend, le frontend et la racine :

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp .env.example .env
```

Tu peux ensuite adapter les variables (URLs, clés Resend, accès NeonDB, etc.).

### 5.4. Lancer la stack en local

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Services locaux exposés :

- **Frontend** : `http://localhost:3000`
- **Backend** : `http://localhost:3001`
- **Grafana** : `http://localhost:3002`
- **Prometheus** : `http://localhost:9090`

---

## 6. Tests

Les tests sont orchestrés principalement via **npm scripts** et GitHub Actions.

- **Frontend**

  - Tests unitaires & composants : `npm test` (ou équivalent dans `frontend/package.json`)
  - Tests E2E Playwright : `npx playwright test` (dossier `frontend/tests/e2e`)

- **Backend**
  - Tests Jest : `npm test` (ou équivalent dans `backend/package.json`)

La CI exécute automatiquement :

- Lint
- Tests Jest (frontend & backend)
- Tests Playwright (si des tests E2E ont été modifiés)
- Build frontend & backend
- Analyse SonarCloud
- Upload des rapports de couverture

---

## 7. Déploiement en production

Le déploiement se fait sur un **VPS Dockerisé**, avec la structure recommandée suivante (sur le serveur) :

```text
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

### 7.1. Script de déploiement (`deploy.sh`)

Le script (exécuté sur le VPS) :

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

### 7.2. CI/CD GitHub Actions

- La **CI** (workflow principal) exécute lint, tests, build, Sonar, couverture.
- Si la CI sur `main` est OK, le workflow **CD** (`cd.yml`) :
  1. Se connecte en SSH au VPS via `appleboy/ssh-action`.
  2. Exécute `./deploy.sh` sur le serveur.

Ainsi, un push réussi sur `main` déclenche automatiquement un déploiement en production.

---

## 8. DNS & domaines (OVH)

Configuration typique côté OVH (exemple) :

- Domaine principal + frontend :
  - `A kenzocda.fr <IP_VPS>`
  - `A www <IP_VPS>`
- API :
  - `A api <IP_VPS>`
- Monitoring :
  - `A monitoring <IP_VPS>`
- Emails Resend :
  - `TXT resend._domainkey <clé DKIM>`
  - `TXT _dmarc v=DMARC1; p=none;`

---

## 9. Monitoring & maintenance

- **Monitoring**

  - Grafana : `https://monitoring.kenzocda.fr`
  - Prometheus : exposé en interne (scrape du backend `/metrics`)

- **Commandes utiles**

```bash
docker compose ps
docker logs backend
docker logs frontend
docker system prune -a
sudo systemctl restart nginx
```

---

## 10. Dépannage rapide

- **API KO**

  - Vérifier la conf Nginx (`api.conf`).
  - Vérifier `docker logs backend`.
  - Vérifier `.env.production` (base de données, Resend, etc.).

- **Frontend KO**

  - Vérifier `frontend.conf`.
  - Vérifier le build Docker frontend.

- **HTTPS KO**

  - Vérifier les certificats Let’s Encrypt :

    ```bash
    ls /etc/letsencrypt/live/<domaine>/
    ```

---

## 11. Crédits

Projet développé pour automatiser et professionnaliser la gestion des demandes clients de l’entreprise, avec une approche **full Docker sur VPS**, monitoring complet et pipeline CI/CD.
