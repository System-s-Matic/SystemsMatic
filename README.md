# System's Matic

Application moderne avec frontend Next.js/TypeScript et backend NestJS/TypeScript avec base de données PostgreSQL, le tout containerisé avec Docker.

## 🚀 Technologies utilisées

### Frontend

- **Next.js 14** avec App Router
- **TypeScript**
- **Tailwind CSS** pour le styling
- **React Hook Form** pour la gestion des formulaires
- **Axios** pour les requêtes HTTP

### Backend

- **NestJS** avec TypeScript
- **TypeORM** pour l'ORM
- **PostgreSQL** comme base de données
- **JWT** pour l'authentification
- **Swagger** pour la documentation API
- **Passport** pour l'authentification

### Infrastructure

- **Docker** et **Docker Compose** pour la containerisation
- **PostgreSQL 15** Alpine

## 📁 Structure du projet

```
System's Matic/
├── docker-compose.yml          # Configuration Docker Compose
├── backend/                    # Application NestJS
│   ├── src/
│   │   ├── auth/              # Module d'authentification
│   │   ├── users/             # Module utilisateurs
│   │   ├── app.controller.ts
│   │   ├── app.service.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── frontend/                   # Application Next.js
│   ├── src/
│   │   └── app/
│   │       ├── globals.css
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── Dockerfile
└── README.md
```

## 🛠️ Installation et démarrage

### Prérequis

- Docker et Docker Compose installés
- Node.js 18+ (pour le développement local)

### Démarrage rapide (Option hybride recommandée)

1. **Cloner le projet**

```bash
git clone <repository-url>
cd "System's Matic"
```

2. **Démarrer PostgreSQL avec Docker**

```bash
# Windows
start-dev.bat

# Linux/Mac
./start-dev.sh
```

3. **Installer et démarrer le backend**

```bash
cd backend
npm install
npm run start:dev
```

4. **Installer et démarrer le frontend (nouveau terminal)**

```bash
cd frontend
npm install
npm run dev
```

5. **Accéder aux applications**

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Documentation Swagger: http://localhost:3001/api
- Base de données PostgreSQL: localhost:5432

### Option Docker complète (alternative)

Si vous préférez utiliser Docker pour tout :

```bash
# Reconstruire les images avec les Dockerfiles
docker-compose -f docker-compose.full.yml up -d
```

### Développement local (recommandé)

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Configuration

### Variables d'environnement

#### Backend (.env)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/system_matic_db
JWT_SECRET=your-secret-key
NODE_ENV=development
```

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📚 API Documentation

L'API est documentée avec Swagger et accessible à l'adresse : http://localhost:3001/api

### Endpoints principaux

#### Authentification

- `POST /auth/login` - Connexion utilisateur
- `GET /auth/profile` - Profil utilisateur connecté

#### Utilisateurs

- `POST /users` - Créer un utilisateur
- `GET /users` - Liste des utilisateurs
- `GET /users/:id` - Détails d'un utilisateur
- `PATCH /users/:id` - Mettre à jour un utilisateur
- `DELETE /users/:id` - Supprimer un utilisateur

## 🎨 Fonctionnalités

### Frontend

- Interface moderne et responsive avec Tailwind CSS
- Formulaires de connexion et d'inscription
- Gestion d'état avec React Hooks
- Validation des formulaires
- Messages d'erreur et de succès

### Backend

- API RESTful avec NestJS
- Authentification JWT
- Validation des données avec class-validator
- Documentation automatique avec Swagger
- Gestion des erreurs centralisée
- Hashage sécurisé des mots de passe

## 🐳 Commandes Docker utiles

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Arrêter tous les services
docker-compose down

# Reconstruire les images
docker-compose build --no-cache

# Supprimer les volumes (attention: supprime les données)
docker-compose down -v
```

## 🔍 Développement

### Ajouter de nouvelles fonctionnalités

1. **Backend** : Créer de nouveaux modules NestJS dans `backend/src/`
2. **Frontend** : Ajouter de nouvelles pages dans `frontend/src/app/`
3. **Base de données** : Les migrations sont automatiques en mode développement

### Tests

```bash
# Backend
cd backend
npm run test

# Frontend
cd frontend
npm run lint
npm run type-check
```

## 📝 Notes importantes

- En mode développement, la base de données se synchronise automatiquement
- Les mots de passe sont hashés avec bcrypt
- L'authentification utilise JWT avec expiration de 24h
- CORS est configuré pour permettre les requêtes depuis le frontend

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT.
