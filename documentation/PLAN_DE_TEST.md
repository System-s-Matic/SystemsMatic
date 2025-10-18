# 🧪 Plan de Test — Application _System's Matic_

## 1. Vue d'ensemble

Ce plan de test décrit la stratégie de validation et de contrôle qualité de l'application **System's Matic**, une solution web de **gestion de rendez-vous et de devis** pour un professionnel de l'automatisation de portails en Guadeloupe.

### Architecture concernée

- **Backend** : NestJS + Prisma (PostgreSQL) + Redis (BullMQ)
- **Frontend** : Next.js + React + TypeScript
- **Tests automatisés** : Jest, Supertest, Playwright
- **CI/CD** : GitHub Actions (exécution automatique à chaque commit sur `develop` et `main`)

---

## 2. Objectifs du plan de test

- Vérifier la conformité fonctionnelle et la fiabilité du système.
- Garantir la sécurité, la performance et la stabilité avant mise en production.
- Automatiser les tests dans un pipeline CI/CD.
- Atteindre un **coverage global minimal de 80 %** sur tous les modules.

---

## 3. Types de tests

| Type de test         | Outils           | Objectif principal                                            | Cible de coverage |
| -------------------- | ---------------- | ------------------------------------------------------------- | ----------------- |
| **Unitaires**        | Jest             | Vérifier la logique interne des services et fonctions isolées | ≥ 80 %            |
| **Intégration**      | Jest + Supertest | Tester la communication entre modules et la base de données   | ≥ 80 %            |
| **End-to-End (E2E)** | Playwright       | Vérifier le parcours complet utilisateur (front ↔ back)       | ≥ 75 %            |

---

## 4. Plan détaillé des tests

### 4.1 Tests Unitaires (≈25)

| ID   | Composant testé                             | Description du test                                | Objectif              | Criticité | Status |
| ---- | ------------------------------------------- | -------------------------------------------------- | --------------------- | --------- | ------ |
| TU01 | `AuthService.validateAdmin()`               | Vérifie la validation des identifiants admin       | Sécurité              | Critique  | ✅     |
| TU02 | `AuthService.generateToken()`               | Vérifie la génération et la validité du JWT        | Sécurité              | Critique  | ✅     |
| TU03 | `AppointmentsService.create()`              | Vérifie la création d'un rendez-vous valide        | Logique métier        | Élevée    | ✅     |
| TU04 | `AppointmentsService.validateDate()`        | Empêche la création avec une date passée           | Validation            | Élevée    | ✅     |
| TU05 | `QuotesService.create()`                    | Vérifie la création d'un devis complet             | Logique métier        | Élevée    | ✅     |
| TU06 | `QuotesService.updateStatus()`              | Vérifie le changement de statut d'un devis         | Workflow              | Moyenne   | ✅     |
| TU07 | `MailService.sendAppointmentConfirmation()` | Vérifie l'envoi d'un email de confirmation         | Notification          | Moyenne   | ✅     |
| TU08 | `MailService.sendQuoteToClient()`           | Vérifie l'envoi d'un email de devis                | Notification          | Moyenne   | ✅     |
| TU09 | `date-utils.convertToUTC()`                 | Vérifie la conversion d'une date locale vers UTC   | Gestion horaire       | Moyenne   | ✅     |
| TU10 | `validation.dto`                            | Vérifie la validation des données entrantes (DTOs) | Qualité des données   | Élevée    | ✅     |
| TU11 | `useAppointments` (hooks)                   | Tests des hooks React pour la gestion des RDV      | Interface utilisateur | Élevée    | ✅     |
| TU12 | `useQuotes` (hooks)                         | Tests des hooks React pour la gestion des devis    | Interface utilisateur | Élevée    | ✅     |
| TU13 | `AdminDateTimePicker` (composant)           | Tests du sélecteur de date/heure admin             | Interface utilisateur | Moyenne   | ✅     |
| TU14 | `NativeDateTimePicker` (composant)          | Tests du sélecteur de date/heure natif             | Interface utilisateur | Moyenne   | ✅     |
| TU15 | `ChatBox` (composant)                       | Tests du chatbot d'assistance                      | Interface utilisateur | Moyenne   | ✅     |
| TU16 | `AppointmentForm` (composant)               | Tests du formulaire de rendez-vous                 | Interface utilisateur | Élevée    | ✅     |
| TU17 | `QuotesSection` (composant)                 | Tests de la section de gestion des devis           | Interface utilisateur | Élevée    | 🔄     |
| TU18 | `AppointmentsSection` (composant)           | Tests de la section de gestion des RDV             | Interface utilisateur | Élevée    | ✅     |
| TU19 | `AdminLogin` (composant)                    | Tests du formulaire de connexion admin             | Sécurité              | Critique  | ✅     |
| TU20 | `QuoteAcceptModal` (composant)              | Tests de la modale d'acceptation de devis          | Interface utilisateur | Moyenne   | ✅     |
| TU21 | `QuoteRejectModal` (composant)              | Tests de la modale de rejet de devis               | Interface utilisateur | Moyenne   | ✅     |
| TU22 | `StatsSection` (composant)                  | Tests de l'affichage des statistiques              | Interface utilisateur | Moyenne   | ✅     |
| TU23 | `AppointmentSection` (composant)            | Tests de la section de prise de RDV                | Interface utilisateur | Élevée    | 🔄     |
| TU24 | `validation.ts` (utilitaires)               | Tests des fonctions de validation                  | Qualité des données   | Élevée    | ✅     |
| TU25 | `api.ts` (services)                         | Tests des appels API                               | Communication         | Élevée    | ✅     |

---

### 4.2 Tests d'Intégration (≈8)

| ID   | Modules intégrés                  | Description du test                                 | Objectif                               | Criticité | Status |
| ---- | --------------------------------- | --------------------------------------------------- | -------------------------------------- | --------- | ------ |
| TI01 | AuthController + Service          | Test complet d'authentification admin               | Vérifier l'intégration JWT + DB        | Critique  | ✅     |
| TI02 | AppointmentsController + Prisma   | Création d'un rendez-vous stocké en base            | Vérifier la persistance des données    | Élevée    | ✅     |
| TI03 | QuotesController + MailModule     | Envoi automatique d'un mail après création de devis | Vérifier l'intégration mail            | Élevée    | ✅     |
| TI04 | Backoffice + AuthModule           | Vérifier la protection des routes admin             | Sécurité d'accès                       | Critique  | ✅     |
| TI05 | EmailActionsModule + QuotesModule | Vérifier la gestion d'actions par lien email        | Vérifier les workflows de confirmation | Moyenne   | ✅     |
| TI06 | Appointments + Queue + Redis      | Tests d'intégration avec le système de files        | Vérifier le traitement asynchrone      | Élevée    | ✅     |
| TI07 | Quotes + Email + Templates        | Tests d'intégration des emails de devis             | Vérifier l'envoi d'emails              | Élevée    | ✅     |
| TI08 | Auth + Guards + Middleware        | Tests d'intégration de la sécurité                  | Vérifier la protection des routes      | Critique  | ✅     |

---

### 4.3 Tests End-to-End (≈18)

| ID    | Scénario                      | Description du test                                                | Objectif                                 | Criticité | Status |
| ----- | ----------------------------- | ------------------------------------------------------------------ | ---------------------------------------- | --------- | ------ |
| E2E01 | Création de rendez-vous       | L'utilisateur remplit le formulaire RDV et reçoit une confirmation | Vérifier le parcours complet utilisateur | Critique  | ✅     |
| E2E02 | Création de devis             | L'utilisateur demande un devis depuis le site                      | Vérifier le parcours de devis complet    | Critique  | ✅     |
| E2E03 | Connexion admin               | L'administrateur se connecte et accède à l'interface back-office   | Vérifier le bon fonctionnement du login  | Critique  | ✅     |
| E2E04 | Sécurité / Accès non autorisé | Tentative d'accès à une route protégée sans JWT                    | Vérifier la sécurité de l'application    | Élevée    | ✅     |

**Tests E2E implémentés (18 tests au total) :**

- `appointment-form.spec.ts` (3 tests) : Tests du formulaire de rendez-vous (validation, erreurs, succès)
- `quote-form.spec.ts` (3 tests) : Tests du formulaire de devis (validation, erreurs, succès)
- `admin-login.spec.ts` (5 tests) : Tests de connexion admin (succès, échec, validation, chargement)
- `security-access.spec.ts` (7 tests) : Tests de sécurité (redirections, accès non autorisé, API protégées)

**Endpoints corrigés :**

- Authentification : `/auth/login` (au lieu de `/auth/login*`)
- Rendez-vous : `/appointments` (au lieu de `/appointments*`)
- Devis : `/quotes` (au lieu de `/quotes*`)
- Admin : `/backoffice` (au lieu de `/admin`)
- Messages d'erreur : "Email ou mot de passe incorrect" (au lieu de "Identifiants invalides")

---

## 5. Critères d'acceptation

| Critère                      | Description                               | Seuil    |
| ---------------------------- | ----------------------------------------- | -------- |
| **Coverage global**          | Pourcentage de code couvert par les tests | ≥ 80 %   |
| **Tests critiques réussis**  | Auth, Rendez-vous, Devis, Sécurité        | 100 %    |
| **Tests automatiques CI/CD** | Tous les tests passent sur GitHub Actions | 100 %    |
| **Durée totale des tests**   | Temps d'exécution des tests complets      | < 15 min |

---

## 6. Résultats actuels de couverture

### 6.1 Frontend

- **Coverage global** : 93.9% statements, 84.59% branches, 96.79% functions, 93.91% lines
- **Tests passants** : 322/322 (100%)
- **Composants bien couverts** :
  - AdminDateTimePicker (100%)
  - NativeDateTimePicker (100%)
  - AdminLogin (100%)
  - QuoteAcceptModal (100%)
  - QuoteRejectModal (100%)
  - StatsSection (100%)
  - ChatBox (89.85%)
  - AppointmentForm (100%)
- **Modules critiques** :
  - useAppointments (100%)
  - useQuotes (98.93%)
  - validation (91.52%)
  - date-utils (100%)
  - api (100%)
  - toast (100%)
- **Composants à améliorer** :
  - AppointmentSection (56% - routes d'erreur non testées)
  - AppointmentsSection (94.59% - quelques branches manquantes)
  - QuotesSection (72.09% - modales et callbacks)

### 6.2 Backend

- **Coverage global** : 96.71% statements, 80.68% branches, 95.26% functions, 96.82% lines
- **Tests passants** : 369/384 (96.1%)
- **Services bien couverts** :
  - Auth (100% - controller, service, guards)
  - Appointments (96.26% - service, validation, CRUD)
  - Quotes (99.08% - service, controller, email)
  - Email-actions (95.39% - controller, service)
- **Modules critiques** : Auth, Appointments, Quotes, Email-actions
- **Services à améliorer** :
  - Mail service (87.67% - quelques branches d'erreur)
  - Local strategy (69.23% - validation des credentials)

---

## 6.1 Améliorations prioritaires

### Frontend

1. **AppointmentSection** (56% → 80%) : Ajouter des tests pour les routes d'erreur
2. **QuotesSection** (72.09% → 80%) : Tester les callbacks des modales
3. **AppointmentsSection** (94.59% → 100%) : Couvrir les dernières branches

### Backend

1. **Mail service** (87.67% → 90%) : Tester les cas d'erreur d'envoi
2. **Local strategy** (69.23% → 80%) : Tester la validation des credentials
3. **Email-actions** (95.39% → 100%) : Couvrir les derniers cas d'erreur

### Tests E2E

1. ✅ **Implémentation Playwright** : Tests E2E créés et fonctionnels
2. 🔄 **Pipeline CI/CD** : Intégrer les tests E2E dans GitHub Actions
3. 🔄 **Environnement de test** : Configurer l'environnement de test E2E en production

---

## 7. Configuration des tests

### 7.1 Frontend (Next.js + React)

- **Framework de test** : Jest avec jsdom
- **Seuils de couverture** : 80% (statements, branches, functions, lines)
- **Fichiers couverts** : `src/components/`, `src/hooks/`, `src/lib/`, `src/config/`, `src/middleware.ts`
- **Exclusions** : Types, mocks, configurations, pages Next.js
- **Commandes** : `npm test`, `npm run test:cov`

### 7.2 Backend (NestJS + Prisma)

- **Framework de test** : Jest avec ts-jest
- **Seuils de couverture** : 80% (statements, branches, functions, lines)
- **Fichiers couverts** : `src/**/*.(t|j)s` (services, controllers, DTOs)
- **Exclusions** : Modules, configurations, fichiers de test
- **Commandes** : `npm test`, `npm run test:cov`

### 7.3 Tests E2E (Playwright)

- **Framework** : Playwright pour les tests end-to-end
- **Environnement** : Tests sur navigateurs réels
- **Couverture** : Parcours utilisateur complets

---

## 8. Intégration continue

- Exécution automatique via **GitHub Actions** sur `develop` et `main`.
- Génération de rapport de **coverage Jest** pour frontend et backend.
- Exécution des tests E2E sur **Playwright** avant chaque mise en production.
- Déclenchement automatique lors des **pull requests**.
- **Seuils de couverture** : 80% minimum pour tous les modules.

---

## 9. Maintenance et évolution

- **Révision du plan de test** à chaque évolution majeure du produit.
- **Ajout de nouveaux cas de test** lors de l'introduction de nouvelles fonctionnalités.
- **Analyse trimestrielle** du taux de couverture et de la stabilité des tests.
- **Mise à jour des seuils** selon l'évolution du projet.

---

🧭 **En résumé :**  
Ce plan de test garantit une validation complète et réaliste des fonctionnalités principales de l'application _System's Matic_, avec une couverture équilibrée entre tests unitaires, d'intégration et E2E, tout en s'intégrant dans un pipeline CI/CD automatisé avec des seuils de 80% pour tous les modules.
