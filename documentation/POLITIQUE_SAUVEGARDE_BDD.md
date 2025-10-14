# 🧩 Politique de Sauvegarde de la Base de Données — Règle 3-2-1

## 🗂️ Sommaire
1. [Objectif](#objectif)  
2. [Principe de la règle 3-2-1](#principe-de-la-règle-3-2-1)  
3. [Stratégie de Sauvegarde](#stratégie-de-sauvegarde)  
   - [Copie principale (production)](#1-copie-principale-production)  
   - [Sauvegarde locale](#2-sauvegarde-locale)  
   - [Sauvegarde distante (hors-site)](#3-sauvegarde-distante-hors-site)  
4. [Procédures de Restauration](#procédures-de-restauration)  
5. [Tests et Vérifications](#tests-et-vérifications)  
6. [Sécurité](#sécurité)  
7. [Conformité et Documentation](#conformité-et-documentation)  
8. [Schéma de la Stratégie 3-2-1](#schéma-de-la-stratégie-3-2-1)  
9. [Conclusion](#conclusion)

---

## 🎯 Objectif

Garantir la sécurité, l’intégrité et la récupération des données critiques de l’application **SystemsMatic**, en appliquant la **règle 3-2-1** de sauvegarde.  
L’objectif est d’assurer la continuité de service et la résilience des données, même en cas de perte, panne ou incident majeur.

---

## 🧮 Principe de la règle 3-2-1

- **3 copies** : les données originales + deux sauvegardes  
- **2 supports différents** : une sauvegarde locale + une distante  
- **1 copie hors site** : stockée sur un espace cloud externe

---

## 🧱 Stratégie de Sauvegarde

### 1. Copie principale (Production)
- **Emplacement** : Base de données **NeonDB (PostgreSQL Cloud)**
- **Type** : Base active utilisée par l’application
- **Rétention** : Gérée automatiquement par Neon (7 jours de rétention transactionnelle)
- **Sauvegarde interne** : snapshots automatiques gérés par le service cloud

### 2. Sauvegarde locale
- **Emplacement** : Conteneur Docker PostgreSQL local (environnement de développement)
- **Type** : Dump complet de la base (`pg_dump`)
- **Fréquence** : Quotidienne via une tâche planifiée (`cron`)
- **Rétention** : 30 jours
- **Objectif** : Permettre une restauration rapide en cas d’incident local ou de test de migration

### 3. Sauvegarde distante (hors-site)
- **Emplacement** : Cloud externe (Google Drive, AWS S3 ou équivalent)
- **Type** : Copie chiffrée du dump quotidien
- **Fréquence** : Hebdomadaire (sauvegarde complète)
- **Rétention** : 6 mois minimum
- **Chiffrement** : AES-256 avant transfert

---

## 🔁 Procédures de Restauration

### 🔹 Restauration complète
1. Arrêter le service de base de données ou l’application concernée  
2. Télécharger la dernière sauvegarde disponible  
3. Exécuter la commande :  
   ```bash
   pg_restore -h localhost -U postgres -d systems_matic backup_latest.sql
   ```  
4. Vérifier la cohérence des données et relancer les services

### 🔹 Restauration à un point précis (PITR)
- Fonctionnalité assurée par **NeonDB**, permettant de revenir à un état antérieur via la restauration transactionnelle.
- Utile pour annuler une erreur ou une suppression accidentelle.

---

## 🧪 Tests et Vérifications

- **Tests de restauration** : effectués chaque mois sur un environnement Docker isolé  
- **Vérification d’intégrité** : contrôle de la décompression du fichier de sauvegarde  
- **Alertes automatiques** : notifications (Discord ou email) en cas d’échec de sauvegarde ou de test  
- **Suivi** : journalisation automatique des opérations de sauvegarde et de restauration  

---

## 🔒 Sécurité

- **Chiffrement des sauvegardes** : AES-256 avant transfert vers le cloud  
- **Transferts sécurisés** : via HTTPS / TLS 1.3  
- **Accès restreint** : réservés aux administrateurs techniques autorisés  
- **Rotation des clés** : clés d’accès renouvelées tous les 3 mois  
- **Authentification forte** : MFA obligatoire pour les accès sensibles  

---

## 📜 Conformité et Documentation

- Respect du **RGPD** : les données personnelles sont anonymisées lors des tests de restauration  
- Conservation des journaux de sauvegarde : **12 mois minimum**  
- Rapports mensuels de test de restauration intégrés à la documentation projet  
- Sauvegardes stockées sur des espaces conformes aux normes de sécurité cloud (ISO/IEC 27001)

---

## 🧭 Schéma de la Stratégie 3-2-1

```
                +----------------------+
                |  Base de données     |
                |  (Production - Neon) |
                +----------+-----------+
                           |
                           | Sauvegarde quotidienne (dump)
                           v
               +-----------+-----------+
               |  Serveur local Docker  |
               |  (Sauvegarde locale)   |
               +-----------+-----------+
                           |
                           | Copie chiffrée hebdomadaire
                           v
                +----------+-----------+
                |   Cloud externe (S3, |
                |   GDrive...)         |
                +----------------------+
```

---

## ✅ Conclusion

Cette stratégie de sauvegarde respecte la **règle 3-2-1** et garantit la sécurité et la disponibilité des données de **SystemsMatic**.  
Elle repose sur :
- **NeonDB** pour la base de production,  
- **Docker Compose** pour les sauvegardes locales,  
- **un stockage cloud externe** pour la redondance hors site.

L’ensemble offre une approche fiable, simple à maintenir et conforme aux bonnes pratiques de sécurité et de continuité d’activité.
