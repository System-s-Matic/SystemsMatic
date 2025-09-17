/**
 * ====================================================
 * CONSTANTES GLOBALES DE L'APPLICATION
 * ====================================================
 *
 * Ce fichier centralise toutes les constantes utilisées
 * dans l'application pour faciliter la maintenance et
 * assurer la cohérence.
 *
 * @author System's Matic
 * @version 1.0.0
 */

// ====================================================
// CONFIGURATION API ET ENVIRONNEMENT
// ====================================================

/**
 * Configuration de l'API backend
 */
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  TIMEOUT: 10000, // 10 secondes
  RETRIES: 3,
} as const;

/**
 * Configuration de l'authentification
 */
export const AUTH_CONFIG = {
  TOKEN_KEY: "auth_token",
  TOKEN_EXPIRATION: 24 * 60 * 60, // 24 heures en secondes
  PROTECTED_ROUTES: ["/backoffice", "/admin"],
  PUBLIC_ROUTES: ["/", "/login", "/register"],
} as const;

// ====================================================
// CONFIGURATION DES RENDEZ-VOUS
// ====================================================

/**
 * Timezone de référence pour l'application
 */
export const REFERENCE_TIMEZONE = "America/Guadeloupe";

/**
 * Configuration des créneaux horaires
 */
export const TIME_SLOTS = {
  MORNING: { START: 8, END: 12 }, // 8h00 - 12h00
  AFTERNOON: { START: 14, END: 17 }, // 14h00 - 17h00
  SLOT_DURATION: 30, // 30 minutes par créneau
} as const;

/**
 * Délais et contraintes temporelles
 */
export const TIME_CONSTRAINTS = {
  MIN_ADVANCE_HOURS: 24, // Minimum 24h à l'avance
  MAX_BOOKING_MONTHS: 1, // Maximum 1 mois à l'avance
  CANCELLATION_LIMIT_HOURS: 24, // Limite d'annulation : 24h
} as const;

// ====================================================
// MESSAGES ET LIBELLÉS
// ====================================================

/**
 * Messages d'erreur standardisés
 */
export const ERROR_MESSAGES = {
  REQUIRED_FIELD: "Ce champ est requis",
  INVALID_EMAIL: "Adresse email invalide",
  INVALID_DATE: "Date invalide",
  INVALID_TIME_SLOT: "Créneau horaire non autorisé",
  NETWORK_ERROR: "Erreur de connexion au serveur",
  UNEXPECTED_ERROR: "Une erreur inattendue s'est produite",
  INVALID_TOKEN: "Token d'authentification invalide",
} as const;

/**
 * Messages de succès
 */
export const SUCCESS_MESSAGES = {
  APPOINTMENT_CREATED: "Votre demande de rendez-vous a été envoyée avec succès",
  APPOINTMENT_CONFIRMED: "Rendez-vous confirmé avec succès",
  APPOINTMENT_CANCELLED: "Rendez-vous annulé avec succès",
  EMAIL_SENT: "Email envoyé avec succès",
  DATA_UPDATED: "Données mises à jour avec succès",
} as const;

/**
 * Libellés des motifs de rendez-vous
 */
export const APPOINTMENT_REASONS = {
  DIAGNOSTIC: "Diagnostic",
  INSTALLATION: "Installation",
  MAINTENANCE: "Maintenance",
  AUTRE: "Autre",
} as const;

/**
 * Libellés des statuts de rendez-vous
 */
export const APPOINTMENT_STATUSES = {
  PENDING: "En attente",
  CONFIRMED: "Confirmé",
  RESCHEDULED: "Reprogrammé",
  CANCELLED: "Annulé",
  REJECTED: "Rejeté",
  COMPLETED: "Terminé",
} as const;

// ====================================================
// CONFIGURATION UI/UX
// ====================================================

/**
 * Configuration des toasts/notifications
 */
export const TOAST_CONFIG = {
  DURATION: 5000, // 5 secondes
  POSITION: "top-right",
  MAX_TOASTS: 3,
} as const;

/**
 * Breakpoints responsive
 */
export const BREAKPOINTS = {
  SM: 640, // Petits écrans
  MD: 768, // Tablettes
  LG: 1024, // Ordinateurs portables
  XL: 1280, // Grands écrans
} as const;

/**
 * Délais d'animation (en millisecondes)
 */
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ====================================================
// VALIDATION ET REGEX
// ====================================================

/**
 * Expressions régulières pour la validation
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE_FR: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/,
  PHONE_GP: /^0\d{3}\s?\d{2}\s?\d{2}\s?\d{2}$/,
} as const;

/**
 * Limites de caractères pour les champs de texte
 */
export const TEXT_LIMITS = {
  FIRST_NAME: { MIN: 2, MAX: 50 },
  LAST_NAME: { MIN: 2, MAX: 50 },
  MESSAGE: { MIN: 0, MAX: 500 },
  REASON_OTHER: { MIN: 0, MAX: 100 },
} as const;

// ====================================================
// CONFIGURATION DE DÉVELOPPEMENT
// ====================================================

/**
 * Niveaux de logging
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

/**
 * Configuration du développement
 */
export const DEV_CONFIG = {
  ENABLE_LOGS: process.env.NODE_ENV === "development",
  ENABLE_REDUX_DEVTOOLS: process.env.NODE_ENV === "development",
  API_MOCK_DELAY: 1000, // Délai de simulation pour les mocks
} as const;
