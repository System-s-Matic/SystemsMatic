# Documentation CI/CD — System’s Matic

## Table des matières

1. [Vue d’ensemble](#vue-densemble)
2. [Architecture globale](#1-architecture-globale)
   - [Outils et services utilisés](#11-outils-et-services-utilisés)
   - [Principe général](#12-principe-général)
3. [Pipeline CI — Continuous Integration](#2-pipeline-ci--continuous-integration)
   - [Déclencheurs](#21-déclencheurs)
   - [Jobs exécutés](#22-jobs-exécutés)
   - [Exemple de message Discord](#23-exemple-de-message-discord)
   - [Artefacts produits](#24-artefacts-produits)
4. [Pipeline CD — Continuous Deployment](#3-pipeline-cd--continuous-deployment)
   - [Déclencheurs](#31-déclencheurs)
   - [Jobs exécutés](#32-jobs-exécutés)
   - [Variables et secrets utilisés](#33-variables-et-secrets-utilisés)
5. [Chaîne d’exécution complète](#4-chaîne-dexécution-complète)
6. [Sécurité et bonnes pratiques](#5-sécurité-et-bonnes-pratiques)
7. [Maintenance](#6-maintenance)
8. [Évolutions possibles](#7-évolutions-possibles)
9. [Références](#8-références)

---

## Vue d’ensemble

Ce document décrit l’architecture et le fonctionnement des pipelines **CI (Continuous Integration)** et **CD (Continuous Deployment)** utilisés dans le projet **System’s Matic**.

L’objectif est d’assurer une **intégration continue fiable** et un **déploiement automatisé** des composants **backend** (NestJS) et **frontend** (Next.js), tout en garantissant la qualité du code, la reproductibilité et la traçabilité des déploiements.

---

## 1. Architecture globale

### 1.1. Outils et services utilisés

| Composant        | Outil / Service                       |
| ---------------- | ------------------------------------- |
| CI/CD            | GitHub Actions                        |
| Conteneurisation | Docker & Docker Hub                   |
| Backend          | Render (hébergement NestJS)           |
| Frontend         | Netlify (hébergement Next.js)         |
| Base de données  | NeonDB (PostgreSQL)                   |
| Notifications    | Discord (webhook)                     |
| Gestion de code  | GitHub (branches `develop` et `main`) |

### 1.2. Principe général

1. **CI (Intégration Continue)**

   - Lint, build et tests automatisés sur chaque push ou pull request.
   - Génération de rapports de couverture et artefacts.
   - Notification du statut dans Discord.

2. **CD (Déploiement Continu)**
   - Build et push des images Docker sur Docker Hub.
   - Déclenchement du déploiement automatique du backend sur Render.
   - Relance du build frontend sur Netlify via webhook.
   - Notification du statut de déploiement sur Discord.

---

## 2. Pipeline CI — Continuous Integration

### 2.1. Déclencheurs

Le workflow CI (`.github/workflows/ci.yml`) s’exécute sur :

- `push` ou `pull_request` vers `main` et `develop`
- Déclenchement manuel via `workflow_dispatch`

### 2.2. Jobs exécutés

#### a. **Backend — Lint, Tests & Coverage**

- Vérifie la qualité du code (`npm run lint`)
- Exécute les tests unitaires et fonctionnels Jest avec couverture (`npm run test:cov`)
- Génére un rapport HTML de couverture
- Build l’application NestJS (`npm run build`)
- Base PostgreSQL temporaire injectée via `services.postgres`
- Les tests utilisent :  
  `DATABASE_URL=postgresql://test_user:test_pass@localhost:5432/test_db`

#### b. **Frontend — Lint, Type-check, Build & Coverage**

- Installation et cache NPM optimisé
- Lint (`npm run lint`)
- Vérification des types TypeScript (`npm run type-check`)
- Build Next.js (`npm run build`)
- Tests Jest front-end avec couverture

#### c. **E2E — Playwright**

- Exécuté uniquement sur la branche `main` (ou PR vers `main`)
- Installation des navigateurs Playwright
- Tests end-to-end avec rapport HTML
- Variable d’environnement :
  ```
  NEXT_PUBLIC_API_URL: ${{ secrets.NEXT_PUBLIC_API_URL }}
  ```

#### d. **Notifications Discord**

- Exécuté systématiquement (`if: always()`)
- Affiche dynamiquement le résultat de chaque job (backend, frontend, e2e)
- Message clair et textuel, avec lien vers les logs GitHub Actions

### 2.3. Exemple de message Discord

```
Intégration continue réussie — System's Matic

Résultats des modules :
- Backend : success
- Frontend : success
- E2E : success

Consulter les logs détaillés :
https://github.com/Kenlark/Systemsmatic/actions/runs/XXXXXXXXX
```

### 2.4. Artefacts produits

| Nom                 | Contenu                       | Emplacement                   |
| ------------------- | ----------------------------- | ----------------------------- |
| `backend-coverage`  | Rapport Jest HTML du backend  | `backend/coverage/`           |
| `frontend-coverage` | Rapport Jest HTML du frontend | `frontend/coverage/`          |
| `playwright-report` | Rapport E2E Playwright        | `frontend/playwright-report/` |

---

## 3. Pipeline CD — Continuous Deployment

### 3.1. Déclencheurs

Le workflow CD (`.github/workflows/cd.yml`) s’exécute automatiquement :

- À chaque `push` sur `main`
- Après réussite du workflow CI (`workflow_run`)
- Sur commits contenant un message comportant :  
  `feat`, `fix`, `refactor`, `style`, `perf`, `build`

### 3.2. Jobs exécutés

#### a. **Build & Push Backend**

- Build Docker avec Buildx et cache GitHub
- Push sur Docker Hub avec deux tags :
  ```
  latest
  ${{ github.sha }}
  ```
- Exemple d’image publiée :  
  `kenzokerachi/systemsmatic-backend:latest`

#### b. **Déploiement Render (Backend)**

- Déclenchement via webhook `RENDER_DEPLOY_HOOK`
- Render reconstruit et redémarre le service NestJS
- Exemple d’URL :  
  `https://api.render.com/deploy/srv-xxxxxxxx?key=AbCdEfGhIjKl`

#### c. **Déploiement Netlify (Frontend)**

- Déclenchement via `NETLIFY_BUILD_HOOK`
- Netlify relance le build du site à partir du repo GitHub
- Exemple d’URL :  
  `https://api.netlify.com/build_hooks/1234567890abcdef12345678`

#### d. **Notification Discord (Déploiement)**

- Envoi d’un message de synthèse sur Discord
- Résumé des statuts de Render et Netlify
- Lien direct vers les logs GitHub Actions

### 3.3. Variables et secrets utilisés

| Nom du secret         | Description                                               |
| --------------------- | --------------------------------------------------------- |
| `DOCKERHUB_USERNAME`  | Identifiant Docker Hub                                    |
| `DOCKERHUB_TOKEN`     | Token Docker Hub généré depuis Docker Hub Security        |
| `RENDER_DEPLOY_HOOK`  | URL du webhook de déploiement Render                      |
| `NETLIFY_BUILD_HOOK`  | URL du webhook de build Netlify                           |
| `DISCORD_WEBHOOK`     | URL du webhook Discord pour notifications                 |
| `NEXT_PUBLIC_API_URL` | URL publique de l’API (Render) utilisée par les tests E2E |

---

## 4. Chaîne d’exécution complète

```
Git push → CI (lint + tests + build) → Notification Discord CI
        ↳ si succès → CD (build Docker + Render + Netlify) → Notification Discord CD
```

---

## 5. Sécurité et bonnes pratiques

- Aucune clé de production n’est utilisée dans la CI.
- Les secrets sont stockés uniquement dans **GitHub Actions Secrets**.
- Les bases utilisées en CI sont temporaires (conteneurs Postgres éphémères).
- Les déploiements Render/Netlify sont déclenchés via des **hooks sécurisés**.
- Les commits non pertinents (docs, README, etc.) sont ignorés dans la CD (`paths-ignore`).

---

## 6. Maintenance

- Les pipelines sont définis dans :  
  `.github/workflows/ci.yml`  
  `.github/workflows/cd.yml`

- En cas d’erreur :
  - Vérifier les logs GitHub Actions (`Actions → Workflow runs`)
  - Vérifier les webhooks Render et Netlify

---

## 7. Évolutions possibles

- Intégration de **SonarQube** ou **CodeQL** pour l’analyse statique.
- Ajout d’un **badge de couverture** (Codecov ou Coveralls).

---

## 8. Références

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Render Deploy Hooks](https://render.com/docs/deploy-hooks)
- [Netlify Build Hooks](https://docs.netlify.com/configure-builds/build-hooks/)
- [Docker Buildx](https://docs.docker.com/buildx/working-with-buildx/)
- [Playwright Testing](https://playwright.dev/)
