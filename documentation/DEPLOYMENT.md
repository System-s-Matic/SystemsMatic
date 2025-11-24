# Guide de Déploiement — SystemsMatic

Ce guide décrit l’architecture, les flux CI/CD et la configuration requise pour déployer SystemsMatic (backend NestJS, frontend Next.js, base PostgreSQL NeonDB) via GitHub Actions, Render et Netlify.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Architecture & flux DevOps](#architecture--flux-devops)
3. [Développement local](#développement-local)
4. [Déploiement cloud automatisé](#déploiement-cloud-automatisé)
5. [Configuration des variables & secrets](#configuration-des-variables--secrets)
6. [Maintenance & monitoring](#maintenance--monitoring)
7. [Dépannage](#dépannage)
8. [Ressources supplémentaires](#ressources-supplémentaires)

## 🔧 Prérequis

### Outils locaux

- **Docker 20.10+** et **Docker Compose v2**
- **Node.js 20** (utilisé pour Next.js et NestJS)
- **npm** ou **pnpm** (selon vos habitudes, le repo utilise npm)
- **Git** et un accès au dépôt GitHub

### Comptes & services managés

- **GitHub Actions** (CI/CD), avec droits sur les secrets du dépôt
- **Docker Hub** (push de l’image backend `Dockerfile.prod`)
- **Render** (hébergement backend NestJS)
- **Netlify** (hébergement frontend Next.js)
- **NeonDB** (PostgreSQL managé avec pooling/direct)
- **Resend** (Emails transactionnels)
- **Redis managé** (BullMQ en production, ex. Upstash ou Render Redis)
- **Domain registrar / DNS** pour pointer un domaine personnalisé (optionnel)
- **Discord webhook** pour les notifications CI/CD

## 🏗️ Architecture & flux DevOps

```
SystemsMatic/
├── backend/            # API NestJS + Prisma + Dockerfile.prod
├── frontend/           # Next.js 14 (App Router) + Netlify config
├── monitoring/         # Prometheus & Grafana pour l'environnement local
├── documentation/      # Guides (dont celui-ci)
├── docker-compose.yml  # Stack locale complète
├── netlify.toml        # Build Netlify (Next.js + plugin officiel)
└── .github/workflows/  # ci.yml et cd.yml
```

### Services

- **Backend** : NestJS exposé sur `3001`, containers Docker pour dev, Render en prod.
- **Frontend** : Next.js sur `3000`, build statique + SSR sur Netlify via `netlify.toml`.
- **Base de données** :
  - Local : PostgreSQL 15 via Docker Compose.
  - Production : **NeonDB** (cluster + connection pooling).
- **Redis** : service Docker (local) / service managé (prod) pour BullMQ.
- **Observabilité locale** : Prometheus `9090` + Grafana `3002`.

### Flux CI/CD (GitHub Actions)

| Étape  | Workflow                   | Branches                                                                 | Actions clés                                                                                                                                        |
| ------ | -------------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI** | `.github/workflows/ci.yml` | `develop`, `feature/**`, `fix/**`, `hotfix/**`, PR vers `main`/`develop` | Lint + tests + build (backend & frontend), Playwright conditionnel, SonarCloud, artefacts coverage, notification Discord                            |
| **CD** | `.github/workflows/cd.yml` | Déclenché lorsque la CI réussit                                          | Build & push de l’image `backend/Dockerfile.prod` sur Docker Hub, déclenchement du hook Render, déclenchement du hook Netlify, notification Discord |

> **Règle d’équipe** : les merges vers `main` déclenchent automatiquement CI + CD. Les branches `develop` ou `feature/**` n’envoient que la CI sauf déclenchement manuel de la CD via `workflow_dispatch`.

## 💻 Développement local

1. **Cloner le repo**
   ```bash
   git clone <votre-repo>
   cd SystemsMatic
   ```
2. **Préparer les fichiers d’environnement**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   cp .env .env (si nécessaire pour docker-compose)
   ```
   Renseignez vos valeurs locales (`DATABASE_URL`, `NEXT_PUBLIC_API_URL`, `RESEND_API_KEY` de test, etc.).
3. **Démarrer la stack complète**
   ```bash
   docker compose up -d --build
   docker compose ps
   ```
   Les services disponibles :
   - Frontend : http://localhost:3000
   - Backend : http://localhost:3001
   - Grafana : http://localhost:3002 (admin/admin par défaut)
   - Prometheus : http://localhost:9090
4. **Arrêt & nettoyage**
   ```bash
   docker compose down
   docker compose down -v # supprime aussi les volumes si besoin
   ```

## ☁️ Déploiement cloud automatisé

### 1. Préparer les secrets GitHub

Dans `Settings → Secrets and variables → Actions`, ajoutez :

| Secret                                   | Description                                         |
| ---------------------------------------- | --------------------------------------------------- |
| `SONAR_HOST_URL` / `SONAR_TOKEN`         | Analyse qualité (SonarCloud)                        |
| `DOCKERHUB_USERNAME` / `DOCKERHUB_TOKEN` | Push de l’image backend                             |
| `RENDER_DEPLOY_HOOK`                     | URL `Deploy Hook` Render (Web Service)              |
| `NETLIFY_BUILD_HOOK`                     | URL build Netlify (cf. Site settings → Build hooks) |
| `DISCORD_WEBHOOK`                        | Notification CI/CD                                  |
| `NEXT_PUBLIC_API_URL`                    | URL backend utilisée par les tests E2E Playwright   |

> Astuce : stockez les valeurs sensibles au même endroit (GitHub Secrets) afin que les workflows CI/CD restent stateless.

### 2. Provisionner NeonDB

1. Créez un projet sur [Neon](https://neon.tech/).
2. Ajoutez une base (branch `main` + database `systemsmatic`).
3. Récupérez :
   - **Connection string pooling** → `DATABASE_URL`
   - **Connection string directe** → `DIRECT_URL`
4. Forcez `sslmode=require` pour les déploiements Render.
5. Activez les sauvegardes automatiques et configurez un rôle dédié à l’application (ex. `systemsmatic_app`).

### 3. Configurer Render (backend NestJS)

1. Créez un **Web Service** connecté au repo.
2. Paramètres recommandés :
   - Branch : `main`
   - Build command : `cd backend && npm ci && npm run build`
   - Start command : `cd backend && npm run start:prod`
   - Runtime : Node 20
3. Renseignez toutes les variables listées dans [Backend — Render](#backend--render).
4. Copiez l’URL du **Deploy Hook** (Settings → Deploy hooks) et placez-la dans `RENDER_DEPLOY_HOOK`.
5. Activez l’auto-déploiement sur push + redeploy manuel depuis GitHub Actions (CD).

### 4. Configurer Netlify (frontend Next.js)

1. Importez le repo dans Netlify → option “Monorepo” → base directory `frontend`.
2. Le fichier `netlify.toml` définit déjà :
   - `command = "npm run build"`
   - `publish = ".next"`
   - Plugin `@netlify/plugin-nextjs`
3. Ajoutez les variables d’environnement décrites dans [Frontend — Netlify](#frontend--netlify).
4. Créez un **build hook** et collez l’ID dans `NETLIFY_BUILD_HOOK`.
5. Configurez un domaine personnalisé si nécessaire (DNS → CNAME vers `*.netlify.app`).

### 5. Lancer un déploiement

1. Merge vers `main` ou lancez `Actions → Continuous Integration → Run workflow`.
2. La CI doit passer (lint + tests + Sonar). En cas de succès, la CD démarre automatiquement :
   - Build & push image Docker du backend (`backend/Dockerfile.prod`).
   - POST sur `RENDER_DEPLOY_HOOK` pour rebuild/redémarrer le service.
   - POST sur `NETLIFY_BUILD_HOOK` pour relancer le build frontend.
   - Message final sur Discord avec le résultat de chaque étape.
3. Vérifiez ensuite :
   - Logs Render (build/start success).
   - Build Netlify (status “Published”).
   - Tests de fumée : API `GET /health`, page d’accueil.

## ⚙️ Configuration des variables & secrets

### Secrets GitHub Actions

| Nom                                     | Utilisation                                 | Notes                                             |
| --------------------------------------- | ------------------------------------------- | ------------------------------------------------- |
| `SONAR_HOST_URL`, `SONAR_TOKEN`         | Étape SonarCloud de la CI                   | Requis pour agréger la couverture backend/front   |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Authentification `docker/build-push-action` | Créez un token “Access Token” Docker Hub          |
| `RENDER_DEPLOY_HOOK`                    | Déclenchement Render après build image      | URL POST fournie par Render                       |
| `NETLIFY_BUILD_HOOK`                    | Relance du build Netlify                    | Format `https://api.netlify.com/build_hooks/<id>` |
| `DISCORD_WEBHOOK`                       | Notifications CI/CD                         | Chaîne #devops ou #alerts                         |
| `NEXT_PUBLIC_API_URL`                   | Tests Playwright (CI)                       | Pointez vers l’API Render ou un mock              |

### Backend — Render

| Variable                         | Description                          | Exemple                                                  |
| -------------------------------- | ------------------------------------ | -------------------------------------------------------- |
| `NODE_ENV`                       | Toujours `production`                | `production`                                             |
| `PORT`                           | Port d’écoute NestJS                 | `3001`                                                   |
| `PUBLIC_URL`                     | URL publique du backend              | `https://api.systemsmatic.com`                           |
| `CORS_ORIGIN`                    | Origine autorisée (frontend)         | `https://app.systemsmatic.com`                           |
| `MAINTENANCE_MODE`               | Active les pages de maintenance      | `false`                                                  |
| `DATABASE_URL`                   | Neon – connexion via pooler          | `postgresql://...pooler.../systemsmatic?sslmode=require` |
| `DIRECT_URL`                     | Neon – connexion directe pour Prisma | `postgresql://...neon.tech/systemsmatic?sslmode=require` |
| `REDIS_URL`                      | Redis managé (BullMQ)                | `rediss://:<token>@...:6379`                             |
| `MAIL_FROM`                      | Expéditeur des emails                | `noreply@systemsmatic.com`                               |
| `RESEND_API_KEY`                 | API key Resend                       | `re_xxx`                                                 |
| `JWT_SECRET`                     | Secret principal                     | `super-secret`                                           |
| `JWT_EXPIRES_IN`                 | TTL des access tokens                | `24h`                                                    |
| `JWT_REFRESH_EXPIRES_IN`         | TTL des refresh tokens               | `7d`                                                     |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Compte super admin créé au boot      | `admin@systemsmatic.com`                                 |

> Prisma utilise `DATABASE_URL` pour les requêtes runtime et `DIRECT_URL` pour les migrations. Assurez-vous que les deux valeurs pointent vers Neon avec SSL.

### Frontend — Netlify

| Variable                       | Description                    | Exemple                        |
| ------------------------------ | ------------------------------ | ------------------------------ |
| `NEXT_PUBLIC_API_URL`          | URL de l’API Render            | `https://api.systemsmatic.com` |
| `NEXT_PUBLIC_SITE_URL`         | Domaine public (SEO, sitemap)  | `https://systemsmatic.com`     |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Active la bannière maintenance | `false`                        |
| `NEXT_PUBLIC_MAPBOX_TOKEN`     | Carte interactive              | `pk.xxx`                       |
| `NODE_ENV`                     | Aligné sur Netlify             | `production`                   |

### NeonDB

| Variable                                                 | Utilisation                                         |
| -------------------------------------------------------- | --------------------------------------------------- |
| `PGHOST`, `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGPORT` | Fournis par Neon pour les connexions CLI/migrations |
| `DATABASE_URL` (pooler)                                  | Requis par Prisma runtime                           |
| `DIRECT_URL` (primary)                                   | Requis par `prisma migrate deploy`                  |

Gardez un rôle lecture/écriture distinct pour l’application et limitez les privilèges depuis le dashboard Neon.

### Développement local

- `backend/.env` : mêmes clés que Render mais pointant vers `postgres://postgres:postgres@postgres:5432/systemsmatic`.
- `backend/.env.docker` : utilisé par `docker-compose`, déjà versionné.
- `frontend/.env.local` : `NEXT_PUBLIC_API_URL=http://localhost:3001`, `NEXT_PUBLIC_MAPBOX_TOKEN=<token dev>`.
- `.env` (racine) : variables partagées par `docker-compose.yml` (Postgres, domaine).

## 🛠️ Maintenance & monitoring

- **GitHub Actions** : surveillez les workflows `CI` et `CD`. Les artefacts `backend-coverage`, `frontend-coverage` et `playwright-report` sont disponibles 90 jours.
- **Render** : logs temps réel, métriques CPU/RAM, redémarrage manuel.
- **Netlify** : onglet “Deploys” pour les builds, “Analytics” pour les perfs.
- **NeonDB** : monitoring intégré, sauvegardes point-in-time.
- **Redis managé** : vérifiez l’usage mémoire/connexions.
- **Observabilité locale** : Prometheus + Grafana pour reproduire un incident.
- **Notifications** : le webhook Discord reçoit l’état final (succès/échec) des pipelines.

Mises à jour applicatives :

1. Feature branch → PR vers `develop` (CI complète).
2. Merge vers `main` → déclenche CD.
3. Sur Render : validez les health checks avant de communiquer.

## 🚨 Dépannage

| Problème                            | Vérifications                                                                                                                                        |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CI échoue** (lint/tests)          | Consulter l’onglet Actions → job concerné. Reproduire localement avec `npm run lint`, `npm run test:cov`, `npx playwright test`.                     |
| **SonarCloud KO**                   | Vérifier `SONAR_TOKEN`, la présence des artefacts de couverture et l’accessibilité de `sonar-project.properties`.                                    |
| **CD non déclenchée**               | S’assurer que la CI s’est terminée avec `conclusion = success` et qu’aucune règle de branche n’interdit le workflow_run.                             |
| **Backend indisponible sur Render** | Logs Render, variables d’environnement (`DATABASE_URL`, `REDIS_URL`), statut Neon/Redis, redéploiement manuel via Deploy Hook.                       |
| **Frontend ne consomme pas l’API**  | Vérifier `NEXT_PUBLIC_API_URL` (Netlify + secrets GitHub), les en-têtes CORS (`CORS_ORIGIN`) et les DNS du domaine.                                  |
| **Erreurs Prisma**                  | Confirmer que `DATABASE_URL`/`DIRECT_URL` pointent vers la même base Neon et que les migrations ont été déployées (`npm run prisma:migrate-deploy`). |
| **Tests E2E instables**             | Assigner un endpoint de préproduction à `NEXT_PUBLIC_API_URL` et s’assurer que la base contient des données seedées.                                 |

## 📚 Ressources supplémentaires

- [GitHub Actions](https://docs.github.com/en/actions)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Netlify Build Hooks](https://docs.netlify.com/configure-builds/build-hooks/)
- [NeonDB Docs](https://neon.tech/docs/)
- [Docker Buildx](https://docs.docker.com/buildx/)
- [Resend](https://resend.com/docs)
- [Next.js](https://nextjs.org/docs)
- [NestJS](https://docs.nestjs.com/)

---

Ce guide reflète l’état actuel de l’infrastructure SystemsMatic. En cas d’évolution (nouveau provider, changement de pipeline), mettez-le à jour en priorité afin de garder la documentation alignée avec la réalité opérationnelle.
