# Guide de Déploiement - SystemsMatic

Ce guide vous accompagne dans le déploiement de l'application SystemsMatic, une solution complète de gestion de rendez-vous avec backend NestJS, frontend Next.js, et base de données PostgreSQL.

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Architecture du projet](#architecture-du-projet)
3. [Développement local](#développement-local)
4. [Déploiement Cloud (Sans VPS)](#déploiement-cloud-sans-vps)
5. [Configuration des variables d'environnement](#configuration-des-variables-denvironnement)
6. [Maintenance et monitoring](#maintenance-et-monitoring)
7. [Dépannage](#dépannage)
8. [Ressources supplémentaires](#ressources-supplémentaires)

## 🔧 Prérequis

### Sur votre machine locale

- **Docker** (version 20.10+) et **Docker Compose** (version 2.0+)
- **Node.js** (version 20.x) et **npm**
- **Git**

### Pour le déploiement en production

- **Netlify** pour le frontend (gratuit)
- **Render.com** pour le backend
- **Nom de domaine** configuré (optionnel)
- **Compte Resend** pour l'envoi d'emails

## 🏗️ Architecture du projet

```
SystemsMatic/
├── backend/          # API NestJS
├── frontend/         # Application Next.js
├── documentation/    # Documentation du projet
├── docker-compose.yml # Configuration Docker
├── netlify.toml     # Configuration Netlify
├── README.md        # Documentation principale
└── .github/         # Configuration GitHub (Actions)
```

### Services inclus :

- **Backend** : API NestJS sur le port 3001
- **Frontend** : Application Next.js sur le port 3000
- **PostgreSQL** : Base de données principale
- **Redis** : Cache et gestion des queues
- **Traefik** : Reverse proxy avec SSL automatique

## 🔧 Développement local

Pour le développement local, vous pouvez utiliser Docker Compose :

```bash
# Cloner le projet
git clone <votre-repo>
cd SystemsMatic

# Copier et configurer les variables d'environnement
cp .env.example .env

# Démarrer les services
docker-compose up -d --build

# Vérifier le statut
docker-compose ps
```

## ☁️ Déploiement Cloud (Sans VPS)

### Netlify + Render.com

#### Frontend sur Netlify

1. **Connecter le repository** :

   - Allez sur [netlify.com](https://netlify.com)
   - Connectez votre compte GitHub
   - Sélectionnez votre repository SystemsMatic
   - Le fichier `netlify.toml` est déjà configuré

2. **Variables d'environnement Netlify** :

   ```
   NEXT_PUBLIC_API_URL=https://votre-backend.onrender.com
   NETLIFY_URL=https://votre-frontend.netlify.app
   NEXT_PUBLIC_SITE_URL=https://votre-domaine.com (optionnel, pour domaine personnalisé)
   NEXT_PUBLIC_DOMAIN=votre-domaine.com
   NEXT_PUBLIC_MAINTENANCE_MODE=false (ou true si en maintenance)
   ```

3. **Déploiement automatique** :
   - Netlify déploiera automatiquement à chaque push
   - SSL automatique inclus

#### Backend sur Render.com

1. **Créer un compte Render** :

   - Allez sur [render.com](https://render.com)
   - Connectez votre compte GitHub

2. **Créer un service Web** :

   - Sélectionnez "New Web Service"
   - Choisissez votre repository
   - Configuration :
     ```
     Build Command: cd backend && npm install && npm run build
     Start Command: cd backend && npm run start:prod
     ```

3. **Base de données PostgreSQL** :

   - Créez un service "PostgreSQL" sur Render
   - Notez l'URL de connexion

4. **Variables d'environnement Render** :

   ```
   ADMIN_EMAIL=admin@votre-domaine.com
   ADMIN_PASSWORD=votre-mot-de-passe-admin
   CORS_ORIGIN=https://votre-site.netlify.app
   DATABASE_URL=postgresql://user:password@host-pooler.region.provider.com/database
   DIRECT_URL=postgresql://user:password@host.region.provider.com/database
   JWT_EXPIRES_IN=24h
   JWT_REFRESH_EXPIRES_IN=7d
   JWT_SECRET=votre-cle-jwt-secrete
   MAIL_FROM=noreply@votre-domaine.com
   MAINTENANCE_MODE=false (ou true si en maintenance)
   NODE_ENV=production
   PRISMA_CLIENT_ENGINE_TYPE=library
   PUBLIC_URL=https://votre-backend.onrender.com
   REDIS_URL=redis://redis:6379
   RESEND_API_KEY=re_votre-cle-resend
   ```

### 🎯 Avantages de cette solution

- **Gratuit** pour commencer (750h/mois sur Render)
- **Configuration simple** et rapide
- **Déploiement automatique** depuis GitHub
- **SSL automatique** inclus
- **Scaling** automatique selon la demande

## ⚙️ Configuration des variables d'environnement

### Variables Render (Backend)

| Variable                 | Description                 | Exemple                        | Obligatoire |
| ------------------------ | --------------------------- | ------------------------------ | ----------- |
| `DATABASE_URL`           | URL base de données         | `postgresql://...`             | ✅          |
| `DIRECT_URL`             | URL directe base de données | `postgresql://...`             | ✅          |
| `JWT_SECRET`             | Clé secrète JWT             | `ma-cle-super-secrete`         | ✅          |
| `ADMIN_EMAIL`            | Email administrateur        | `admin@systemsmatic.com`       | ✅          |
| `ADMIN_PASSWORD`         | Mot de passe admin          | `admin123!`                    | ✅          |
| `RESEND_API_KEY`         | Clé API Resend              | `re_abc123...`                 | ✅          |
| `MAIL_FROM`              | Email expéditeur            | `noreply@systemsmatic.com`     | ✅          |
| `PUBLIC_URL`             | URL publique du backend     | `https://backend.onrender.com` | ✅          |
| `CORS_ORIGIN`            | Origine autorisée           | `https://site.netlify.app`     | ✅          |
| `JWT_EXPIRES_IN`         | Durée JWT                   | `24h`                          | ❌          |
| `JWT_REFRESH_EXPIRES_IN` | Durée refresh JWT           | `7d`                           | ❌          |
| `MAINTENANCE_MODE`       | Mode maintenance            | `false`                        | ❌          |
| `REDIS_URL`              | URL Redis                   | `redis://redis:6379`           | ❌          |

### Variables Netlify (Frontend)

| Variable                       | Description              | Exemple                        | Obligatoire |
| ------------------------------ | ------------------------ | ------------------------------ | ----------- |
| `NEXT_PUBLIC_API_URL`          | URL de l'API backend     | `https://backend.onrender.com` | ✅          |
| `NEXT_PUBLIC_DOMAIN`           | Domaine principal        | `systemsmatic.com`             | ✅          |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Mode maintenance         | `false`                        | ✅          |
| `NETLIFY_URL`                  | URL Netlify par défaut   | `https://site.netlify.app`     | ❌          |
| `NEXT_PUBLIC_SITE_URL`         | URL du site personnalisé | `https://systemsmatic.com`     | ❌          |

## 🔧 Maintenance et monitoring

### Monitoring des services

- **Render.com** : Dashboard avec logs, métriques et health checks
- **Netlify** : Analytics, logs de déploiement et performance
- **Base de données** : Monitoring automatique sur Render

### Mise à jour de l'application

1. **Pousser les changements** sur GitHub
2. **Render** et **Netlify** déploient automatiquement
3. **Vérifier** les logs dans les dashboards respectifs

### Sauvegardes

- **Render** : Sauvegardes automatiques de la base de données
- **Code** : Sauvegardé automatiquement sur GitHub

## 🚨 Dépannage

### Problèmes courants

#### 1. Backend ne démarre pas sur Render

- **Vérifiez les logs** dans le dashboard Render
- **Variables d'environnement** : Assurez-vous que toutes les variables sont correctement configurées
- **Build Command** : Vérifiez que `cd backend && npm install && npm run build` est correct

#### 2. Frontend ne se connecte pas au backend

- **CORS** : Vérifiez que `CORS_ORIGIN` pointe vers votre URL Netlify
- **URL API** : Vérifiez que `NEXT_PUBLIC_API_URL` pointe vers votre backend Render
- **Variables Netlify** : Vérifiez la configuration dans le dashboard Netlify

#### 3. Base de données inaccessible

- **URL de connexion** : Vérifiez que `DATABASE_URL` est correcte
- **Migrations** : Les migrations Prisma s'exécutent automatiquement au démarrage

### Logs utiles

- **Render** : Dashboard → Logs en temps réel
- **Netlify** : Dashboard → Deploy logs
- **GitHub** : Actions pour voir les déploiements

### Support

En cas de problème :

1. **Vérifiez les logs** dans les dashboards Render et Netlify
2. **Variables d'environnement** : Vérifiez la configuration
3. **Documentation** : Consultez les guides Render et Netlify
4. **Support** : Utilisez les systèmes de support des plateformes

## 📚 Ressources supplémentaires

- [Documentation Render.com](https://render.com/docs)
- [Documentation Netlify](https://docs.netlify.com/)
- [Documentation Prisma](https://www.prisma.io/docs/)
- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation NestJS](https://docs.nestjs.com/)

---

**Note** : Ce guide vous accompagne dans le déploiement cloud de SystemsMatic. Pour toute question spécifique, consultez la documentation officielle des plateformes utilisées.
