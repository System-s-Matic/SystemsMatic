# Règles de Gestion - SystemsMatic

## 📋 Vue d'ensemble

Ce document définit les règles de gestion pour le système SystemsMatic, une solution de gestion de rendez-vous et devis pour l'automatisation de portes et portails en Guadeloupe.

---

## 👤 Contact/Client

**RG1** : Un contact doit fournir un nom et prénom valides.

**RG2** : Un contact doit fournir une adresse email valide et unique.

**RG3** : Un contact doit donner son consentement explicite pour le traitement des données.

**RG4** : Un contact peut demander des rendez-vous.

**RG5** : Un contact peut demander des devis.

**RG6** : Un contact peut annuler ses rendez-vous (minimum 24h à l'avance).

**RG7** : Un contact peut accepter/refuser les propositions de reprogrammation.

**RG8** : Un contact peut demander des informations complémentaires.

**RG9** : Un contact doit accepter les conditions générales d'utilisation.

**RG10** : Un contact doit fournir des informations de contact valides.

**RG11** : Un contact doit respecter les délais d'annulation.

**RG12** : Un contact doit maintenir ses informations à jour.

---

## 📅 Rendez-vous

**RG13** : Un rendez-vous doit avoir un contact associé.

**RG14** : Un rendez-vous doit avoir une date/heure de demande valide.

**RG15** : Un rendez-vous doit avoir un motif (diagnostic, installation, maintenance, autre).

**RG16** : Un rendez-vous doit avoir un statut (en attente, confirmé, reprogrammé, annulé, rejeté, terminé).

**RG17** : Un rendez-vous doit avoir des tokens de sécurité (confirmation, annulation).

**RG18** : Un rendez-vous doit avoir un timezone valide.

**RG19** : Un rendez-vous peut être confirmé par l'administrateur.

**RG20** : Un rendez-vous peut être reprogrammé (avec accord du client).

**RG21** : Un rendez-vous peut être annulé par le client (24h minimum à l'avance).

**RG22** : Un rendez-vous peut inclure un message personnalisé.

**RG23** : Un rendez-vous peut avoir des rappels automatiques.

**RG24** : Un rendez-vous peut être rejeté par l'administrateur.

**RG25** : Un rendez-vous doit être unique par contact à une date donnée.

**RG26** : Un rendez-vous doit avoir des tokens de sécurité uniques.

**RG27** : Un rendez-vous doit respecter les horaires d'ouverture.

---

## 💰 Devis

**RG28** : Un devis doit avoir un contact associé.

**RG29** : Un devis doit avoir une description du projet.

**RG30** : Un devis doit avoir un statut (en attente, en cours, envoyé, accepté, rejeté, expiré).

**RG31** : Un devis doit avoir l'acceptation des conditions générales.

**RG32** : Un devis doit avoir une date de création.

**RG33** : Un devis peut être accepté avec un document PDF.

**RG34** : Un devis peut être rejeté avec une raison.

**RG35** : Un devis peut avoir une date d'expiration.

**RG36** : Un devis peut inclure l'acceptation d'un contact téléphonique.

**RG37** : Un devis peut être modifié par l'administrateur.

**RG38** : Un devis doit avoir une description de projet détaillée (minimum 10 caractères).

**RG39** : Un devis doit être traité dans les délais.

**RG40** : Un devis doit avoir un statut de suivi.

**RG41** : Un devis doit respecter les conditions générales.

---

## 🛠️ Administrateur

**RG42** : Un administrateur doit avoir un compte valide avec email et mot de passe.

**RG43** : Un administrateur doit être authentifié via JWT.

**RG44** : Un administrateur doit avoir les droits d'accès au backoffice.

**RG45** : Un administrateur doit maintenir ses informations de connexion sécurisées.

**RG46** : Un administrateur peut consulter tous les rendez-vous et devis.

**RG47** : Un administrateur peut modifier les statuts des rendez-vous et devis.

**RG48** : Un administrateur peut envoyer des rappels.

**RG49** : Un administrateur peut proposer des reprogrammations.

**RG50** : Un administrateur peut accéder aux statistiques.

**RG51** : Un administrateur peut gérer les utilisateurs administrateurs.

**RG52** : Un administrateur peut exporter les données.

**RG53** : Un administrateur peut supprimer des éléments (avec confirmation).

**RG54** : Un administrateur doit respecter la confidentialité des données clients.

**RG55** : Un administrateur doit traiter les demandes dans les délais.

**RG56** : Un administrateur doit maintenir la sécurité du système.

**RG57** : Un administrateur doit documenter les actions importantes.

**RG58** : Un administrateur doit respecter le RGPD.

---

## 📧 Système d'Emails

**RG59** : Le système d'emails doit envoyer des confirmations automatiques.

**RG60** : Le système d'emails doit gérer les rappels de rendez-vous.

**RG61** : Le système d'emails doit notifier les changements de statut.

**RG62** : Le système d'emails doit utiliser des templates professionnels.

**RG63** : Le système d'emails doit gérer les bounces et erreurs.

**RG64** : Les emails peuvent contenir des liens d'action sécurisés.

**RG65** : Les emails peuvent être personnalisés selon le contexte.

**RG66** : Les emails peuvent inclure des informations de contact.

**RG67** : Les emails peuvent avoir des pièces jointes (PDF de devis).

**RG68** : Les emails peuvent être traduits en français.

---

## 🔐 Sécurité

**RG69** : Le système doit utiliser des tokens JWT pour l'authentification.

**RG70** : Le système doit chiffrer les mots de passe.

**RG71** : Le système doit valider toutes les entrées utilisateur.

**RG72** : Le système doit protéger contre les attaques CSRF.

**RG73** : Le système doit implémenter un système de rate limiting.

**RG74** : Les données sensibles doivent être stockées de manière sécurisée.

**RG75** : Les données sensibles doivent respecter le RGPD.

**RG76** : Les données sensibles doivent avoir des logs d'audit.

**RG77** : Les données sensibles doivent être chiffrées en transit et au repos.

**RG78** : Les données sensibles doivent avoir une politique de rétention.

---

## 📊 Gestion des Statuts

**RG79** : Les statuts de rendez-vous suivent un workflow : PENDING → CONFIRMED → RESCHEDULED → CANCELLED → REJECTED → COMPLETED.

**RG80** : Les statuts de devis suivent un workflow : PENDING → PROCESSING → SENT → ACCEPTED → REJECTED → EXPIRED.

**RG81** : Un rendez-vous en statut PENDING peut être confirmé ou rejeté.

**RG82** : Un rendez-vous en statut CONFIRMED peut être reprogrammé ou annulé.

**RG83** : Un rendez-vous en statut RESCHEDULED peut être accepté ou refusé.

**RG84** : Un devis en statut PENDING peut être traité ou rejeté.

**RG85** : Un devis en statut SENT peut être accepté ou rejeté par le client.

---

## 🌍 Gestion des Timezones

**RG86** : Le système doit détecter automatiquement le timezone de l'utilisateur.

**RG87** : Le système doit convertir toutes les dates en UTC pour le stockage.

**RG88** : Le système doit afficher les dates dans le timezone local.

**RG89** : Le système doit gérer les changements d'heure (été/hiver).

---

## 📱 Interface Utilisateur

**RG90** : L'interface doit être adaptative (mobile, tablette, desktop).

**RG91** : L'interface doit avoir une navigation intuitive.

**RG92** : L'interface doit afficher des messages d'erreur clairs.

**RG93** : L'interface doit proposer une expérience utilisateur fluide.

**RG94** : L'interface doit respecter les standards d'accessibilité.

**RG95** : L'interface doit être compatible avec les lecteurs d'écran.

**RG96** : L'interface doit avoir des contrastes suffisants.

**RG97** : L'interface doit permettre la navigation au clavier.

---

## 🔄 Intégrations

**RG98** : Le système doit intégrer Resend pour l'envoi d'emails.

**RG99** : Le système doit utiliser Redis pour le cache et les queues.

**RG100** : Le système doit se connecter à PostgreSQL pour la persistance.

**RG101** : Le système doit utiliser Traefik pour le reverse proxy.

---

## 📈 Monitoring et Logs

**RG102** : Le système doit logger toutes les actions importantes.

**RG103** : Le système doit tracer les modifications de statuts.

**RG104** : Le système doit enregistrer les tentatives de connexion.

**RG105** : Le système doit maintenir un audit trail complet.

**RG106** : Le système doit alerter en cas d'erreur critique.

**RG107** : Le système doit notifier les problèmes de performance.

**RG108** : Le système doit signaler les tentatives d'intrusion.

**RG109** : Le système doit monitorer la santé des services.
