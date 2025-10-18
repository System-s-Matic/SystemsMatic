/**
 * ====================================================
 * UTILITAIRES DE VALIDATION ET SANITISATION
 * ====================================================
 *
 * Ce fichier contient toutes les fonctions de validation
 * et de sanitisation utilisées dans l'application pour
 * garantir la cohérence, la réutilisabilité et la sécurité.
 *
 * @author System's Matic
 * @version 1.0.0
 */

import {
  REGEX_PATTERNS,
  TEXT_LIMITS,
  ERROR_MESSAGES,
  SANITIZATION_CONFIG,
} from "./constants";
import { isValidTimeSlot, isValidBookingDate } from "./date-utils";
import DOMPurify from "dompurify";

// ====================================================
// TYPES DE VALIDATION
// ====================================================

/**
 * Résultat d'une validation
 */
export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

/**
 * Options de validation pour les champs texte
 */
export interface TextValidationOptions {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customMessage?: string;
}

// ====================================================
// UTILITAIRES DE SANITISATION
// ====================================================

/**
 * Sanitise une chaîne de caractères en supprimant les caractères dangereux
 *
 * @param value - Valeur à sanitiser
 * @param options - Options de sanitisation
 * @returns Valeur sanitizée
 */
export const sanitizeString = (
  value: string,
  options: {
    removeHtml?: boolean;
    removeScripts?: boolean;
    allowOnlyText?: boolean;
    maxLength?: number;
  } = {}
): string => {
  if (!value) return "";

  let sanitized = value.trim();

  // Supprimer les caractères de contrôle dangereux
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Si on veut seulement du texte, supprimer tout HTML
  if (options.allowOnlyText || options.removeHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  }

  // Si on veut supprimer les scripts
  if (options.removeScripts) {
    sanitized = sanitized.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");
  }

  // Limiter la longueur si spécifiée
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
};

/**
 * Sanitise du contenu HTML avec DOMPurify
 *
 * @param html - Contenu HTML à sanitiser
 * @param options - Options de sanitisation DOMPurify
 * @returns HTML sanitizé
 */
export const sanitizeHtml = (
  html: string,
  options: {
    allowTags?: string[];
    allowAttributes?: string[];
    stripTags?: boolean;
  } = {}
): string => {
  if (!html) return "";

  const config = {
    ALLOWED_TAGS: options.allowTags || [...SANITIZATION_CONFIG.ALLOWED_TAGS],
    ALLOWED_ATTR: options.allowAttributes || [
      ...SANITIZATION_CONFIG.ALLOWED_ATTRIBUTES,
    ],
    KEEP_CONTENT: true,
  };

  if (options.stripTags) {
    config.ALLOWED_TAGS = [];
  }

  return DOMPurify.sanitize(html, config);
};

/**
 * Sanitise un nom (prénom/nom) en supprimant les caractères non autorisés
 *
 * @param name - Nom à sanitiser
 * @returns Nom sanitizé
 */
export const sanitizeName = (name: string): string => {
  if (!name) return "";

  // Supprimer les espaces en début/fin
  let sanitized = name.trim();

  // Supprimer les caractères non autorisés (garder seulement lettres, espaces, apostrophes, tirets)
  sanitized = sanitized.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, "");

  // Supprimer les espaces multiples
  sanitized = sanitized.replace(/\s+/g, " ");

  return sanitized;
};

/**
 * Sanitise un numéro de téléphone
 *
 * @param phone - Numéro de téléphone à sanitiser
 * @returns Numéro sanitizé
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return "";

  // Supprimer tous les caractères sauf chiffres, +, -, (, ), espaces
  let sanitized = phone.replace(/[^\d\s\-\+\(\)]/g, "");

  // Supprimer les espaces multiples
  sanitized = sanitized.replace(/\s+/g, " ").trim();

  return sanitized;
};

/**
 * Sanitise un message en supprimant le HTML et les scripts
 *
 * @param message - Message à sanitiser
 * @returns Message sanitizé
 */
export const sanitizeMessage = (message: string): string => {
  if (!message) return "";

  // Supprimer le HTML et les scripts
  let sanitized = sanitizeString(message, {
    removeHtml: true,
    removeScripts: true,
    allowOnlyText: true,
    maxLength: TEXT_LIMITS.MESSAGE.MAX,
  });

  // Supprimer les espaces multiples et les sauts de ligne excessifs
  sanitized = sanitized.replace(/\s+/g, " ");
  sanitized = sanitized.replace(/\n\s*\n\s*\n/g, "\n\n");

  return sanitized.trim();
};

// ====================================================
// VALIDATEURS DE BASE
// ====================================================

/**
 * Valide qu'un champ requis n'est pas vide
 *
 * @param value - Valeur à valider
 * @param fieldName - Nom du champ pour le message d'erreur
 * @returns Résultat de la validation
 */
export const validateRequired = (
  value: string | undefined | null,
  fieldName: string = "Ce champ"
): ValidationResult => {
  if (!value || value.trim().length === 0) {
    return {
      isValid: false,
      message: `${fieldName} est requis`,
    };
  }
  return { isValid: true };
};

/**
 * Valide la longueur d'un texte
 *
 * @param value - Texte à valider
 * @param minLength - Longueur minimale
 * @param maxLength - Longueur maximale
 * @returns Résultat de la validation
 */
export const validateTextLength = (
  value: string,
  minLength: number = 0,
  maxLength: number = Infinity
): ValidationResult => {
  const length = value.trim().length;

  if (length < minLength) {
    return {
      isValid: false,
      message: `Le texte doit contenir au moins ${minLength} caractères`,
    };
  }

  if (length > maxLength) {
    return {
      isValid: false,
      message: `Le texte ne peut pas dépasser ${maxLength} caractères`,
    };
  }

  return { isValid: true };
};

/**
 * Valide un pattern regex
 *
 * @param value - Valeur à valider
 * @param pattern - Expression régulière
 * @param message - Message d'erreur personnalisé
 * @returns Résultat de la validation
 */
export const validatePattern = (
  value: string,
  pattern: RegExp,
  message: string = "Format invalide"
): ValidationResult => {
  if (!pattern.test(value)) {
    return {
      isValid: false,
      message,
    };
  }
  return { isValid: true };
};

/**
 * Valide un numéro de téléphone (version générique)
 *
 * @param phone - Numéro de téléphone à valider
 * @returns Résultat de la validation
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true }; // Optionnel
  }

  // Sanitiser le numéro de téléphone
  const sanitizedPhone = sanitizePhone(phone);

  // Vérifier le format français ou guadeloupéen
  const isFrenchFormat = REGEX_PATTERNS.PHONE_FR.test(sanitizedPhone);
  const isGuadeloupeFormat = REGEX_PATTERNS.PHONE_GP.test(sanitizedPhone);

  if (!isFrenchFormat && !isGuadeloupeFormat) {
    return {
      isValid: false,
      message: "Numéro de téléphone invalide (format français attendu)",
    };
  }

  return { isValid: true };
};

/**
 * Valide un texte avec options personnalisées
 *
 * @param text - Texte à valider
 * @param options - Options de validation
 * @returns Résultat de la validation
 */
export const validateText = (
  text: string,
  options: TextValidationOptions = {}
): ValidationResult => {
  // Vérifier si requis
  if (options.required) {
    const requiredResult = validateRequired(text);
    if (!requiredResult.isValid) {
      return requiredResult;
    }
  }

  // Vérifier la longueur minimale
  if (options.minLength !== undefined) {
    const minLengthResult = validateMinLength(text, options.minLength);
    if (!minLengthResult.isValid) {
      return minLengthResult;
    }
  }

  // Vérifier la longueur maximale
  if (options.maxLength !== undefined) {
    const maxLengthResult = validateMaxLength(text, options.maxLength);
    if (!maxLengthResult.isValid) {
      return maxLengthResult;
    }
  }

  // Vérifier le pattern
  if (options.pattern) {
    const patternResult = validatePattern(
      text,
      options.pattern,
      options.customMessage
    );
    if (!patternResult.isValid) {
      return patternResult;
    }
  }

  return { isValid: true };
};

/**
 * Valide la longueur minimale d'un texte
 *
 * @param value - Texte à valider
 * @param minLength - Longueur minimale
 * @returns Résultat de la validation
 */
export const validateMinLength = (
  value: string,
  minLength: number
): ValidationResult => {
  if (value.length < minLength) {
    return {
      isValid: false,
      message: `Le texte doit contenir au moins ${minLength} caractères`,
    };
  }
  return { isValid: true };
};

/**
 * Valide la longueur maximale d'un texte
 *
 * @param value - Texte à valider
 * @param maxLength - Longueur maximale
 * @returns Résultat de la validation
 */
export const validateMaxLength = (
  value: string,
  maxLength: number
): ValidationResult => {
  if (value.length > maxLength) {
    return {
      isValid: false,
      message: `Le texte ne peut pas dépasser ${maxLength} caractères`,
    };
  }
  return { isValid: true };
};

// ====================================================
// VALIDATEURS SPÉCIALISÉS
// ====================================================

/**
 * Valide une adresse email
 *
 * @param email - Email à valider
 * @returns Résultat de la validation
 */
export const validateEmail = (email: string): ValidationResult => {
  // Vérifier le format
  const patternResult = validatePattern(
    email,
    REGEX_PATTERNS.EMAIL,
    ERROR_MESSAGES.INVALID_EMAIL
  );
  if (!patternResult.isValid) {
    return patternResult;
  }

  // Vérifications supplémentaires
  if (email.length > 254) {
    // Limite RFC 5321
    return {
      isValid: false,
      message: "L'adresse email est trop longue",
    };
  }

  return { isValid: true };
};

/**
 * Valide un numéro de téléphone français
 *
 * @param phone - Numéro de téléphone à valider
 * @returns Résultat de la validation
 */
export const validatePhoneFR = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: true }; // Optionnel
  }

  // Sanitiser le numéro de téléphone
  const sanitizedPhone = sanitizePhone(phone);

  // Vérifier le format français ou guadeloupéen
  const isFrenchFormat = REGEX_PATTERNS.PHONE_FR.test(sanitizedPhone);
  const isGuadeloupeFormat = REGEX_PATTERNS.PHONE_GP.test(sanitizedPhone);

  if (!isFrenchFormat && !isGuadeloupeFormat) {
    return {
      isValid: false,
      message: "Numéro de téléphone invalide (format français attendu)",
    };
  }

  return { isValid: true };
};

/**
 * Valide un prénom ou nom
 *
 * @param name - Nom à valider
 * @param fieldName - Nom du champ (prénom/nom)
 * @returns Résultat de la validation
 */
export const validateName = (
  name: string,
  fieldName: string = "nom"
): ValidationResult => {
  // Sanitiser d'abord le nom
  const sanitizedName = sanitizeName(name);

  // Vérifier si requis
  const requiredResult = validateRequired(sanitizedName, fieldName);
  if (!requiredResult.isValid) {
    return requiredResult;
  }

  // Vérifier la longueur
  const lengthResult = validateTextLength(
    sanitizedName,
    TEXT_LIMITS.FIRST_NAME.MIN,
    TEXT_LIMITS.FIRST_NAME.MAX
  );
  if (!lengthResult.isValid) {
    return lengthResult;
  }

  // Vérifier les caractères (lettres, espaces, apostrophes, tirets)
  const namePattern = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!namePattern.test(sanitizedName)) {
    return {
      isValid: false,
      message: `Le ${fieldName} ne peut contenir que des lettres, espaces, apostrophes et tirets`,
    };
  }

  return { isValid: true };
};

/**
 * Valide une date de rendez-vous
 *
 * @param dateString - Date sous forme de chaîne
 * @param timezone - Timezone de l'utilisateur
 * @returns Résultat de la validation
 */
export const validateAppointmentDate = (
  dateString: string,
  timezone: string
): ValidationResult => {
  if (!dateString) {
    return {
      isValid: false,
      message: "La date et l'heure sont requises",
    };
  }

  try {
    const date = new Date(dateString);

    // Vérifier que la date est valide
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        message: ERROR_MESSAGES.INVALID_DATE,
      };
    }

    // Vérifier que la date est dans la plage autorisée
    if (!isValidBookingDate(date)) {
      return {
        isValid: false,
        message:
          "La date doit être comprise entre demain et un mois à partir d'aujourd'hui",
      };
    }

    // Vérifier que l'heure est dans les créneaux autorisés
    if (!isValidTimeSlot(date)) {
      return {
        isValid: false,
        message:
          "L'heure doit être dans les créneaux autorisés (8h-12h ou 14h-17h)",
      };
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      message: ERROR_MESSAGES.INVALID_DATE,
    };
  }
};

/**
 * Valide un message optionnel
 *
 * @param message - Message à valider
 * @returns Résultat de la validation
 */
export const validateMessage = (message: string): ValidationResult => {
  if (!message) {
    return { isValid: true }; // Optionnel
  }

  // Sanitiser le message
  const sanitizedMessage = sanitizeMessage(message);

  return validateTextLength(sanitizedMessage, 0, TEXT_LIMITS.MESSAGE.MAX);
};

/**
 * Valide la raison "autre" d'un rendez-vous
 *
 * @param reasonOther - Raison personnalisée
 * @param isRequired - Si la raison est requise (quand "Autre" est sélectionné)
 * @returns Résultat de la validation
 */
export const validateReasonOther = (
  reasonOther: string,
  isRequired: boolean = false
): ValidationResult => {
  if (isRequired && (!reasonOther || reasonOther.trim().length === 0)) {
    return {
      isValid: false,
      message: "Veuillez préciser le motif de votre rendez-vous",
    };
  }

  if (reasonOther) {
    // Sanitiser la raison
    const sanitizedReason = sanitizeString(reasonOther, {
      removeHtml: true,
      removeScripts: true,
      allowOnlyText: true,
      maxLength: TEXT_LIMITS.REASON_OTHER.MAX,
    });

    return validateTextLength(sanitizedReason, 0, TEXT_LIMITS.REASON_OTHER.MAX);
  }

  return { isValid: true };
};

// ====================================================
// VALIDATEUR COMPOSÉ POUR FORMULAIRE
// ====================================================

/**
 * Valide toutes les données d'un formulaire de rendez-vous
 *
 * @param data - Données du formulaire
 * @returns Objet avec tous les résultats de validation
 */
export const validateAppointmentForm = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  reason?: string;
  reasonOther?: string;
  message?: string;
  requestedAt: string;
  timezone: string;
  consent: boolean;
}) => {
  const errors: Record<string, string> = {};

  // Validation du prénom
  const firstNameResult = validateName(data.firstName, "prénom");
  if (!firstNameResult.isValid) {
    errors.firstName = firstNameResult.message!;
  }

  // Validation du nom
  const lastNameResult = validateName(data.lastName, "nom");
  if (!lastNameResult.isValid) {
    errors.lastName = lastNameResult.message!;
  }

  // Validation de l'email
  const emailResult = validateEmail(data.email);
  if (!emailResult.isValid) {
    errors.email = emailResult.message!;
  }

  // Validation du téléphone (optionnel)
  if (data.phone) {
    const phoneResult = validatePhoneFR(data.phone);
    if (!phoneResult.isValid) {
      errors.phone = phoneResult.message!;
    }
  }

  // Validation de la date
  const dateResult = validateAppointmentDate(data.requestedAt, data.timezone);
  if (!dateResult.isValid) {
    errors.requestedAt = dateResult.message!;
  }

  // Validation de la raison "autre"
  if (data.reason === "AUTRE") {
    const reasonOtherResult = validateReasonOther(data.reasonOther || "", true);
    if (!reasonOtherResult.isValid) {
      errors.reasonOther = reasonOtherResult.message!;
    }
  }

  // Validation du message (optionnel)
  if (data.message) {
    const messageResult = validateMessage(data.message);
    if (!messageResult.isValid) {
      errors.message = messageResult.message!;
    }
  }

  // Validation du consentement
  if (!data.consent) {
    errors.consent = "Vous devez accepter les conditions pour continuer";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ====================================================
// UTILITAIRES D'EXPORT
// ====================================================

/**
 * Sanitise toutes les données d'un formulaire de rendez-vous
 *
 * @param data - Données du formulaire à sanitiser
 * @returns Données sanitizées
 */
export const sanitizeAppointmentForm = (data: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  reason?: string;
  reasonOther?: string;
  message?: string;
  requestedAt: string;
  timezone: string;
  consent: boolean;
}) => {
  return {
    firstName: sanitizeName(data.firstName),
    lastName: sanitizeName(data.lastName),
    email: data.email.trim().toLowerCase(), // Email déjà validé par regex
    phone: data.phone ? sanitizePhone(data.phone) : undefined,
    reason: data.reason,
    reasonOther: data.reasonOther
      ? sanitizeString(data.reasonOther, {
          removeHtml: true,
          removeScripts: true,
          allowOnlyText: true,
          maxLength: TEXT_LIMITS.REASON_OTHER.MAX,
        })
      : undefined,
    message: data.message ? sanitizeMessage(data.message) : undefined,
    requestedAt: data.requestedAt,
    timezone: data.timezone,
    consent: data.consent,
  };
};

/**
 * Validateurs et sanitiseurs exportés pour usage externe
 */
export const validators = {
  required: validateRequired,
  textLength: validateTextLength,
  pattern: validatePattern,
  email: validateEmail,
  phone: validatePhoneFR,
  name: validateName,
  appointmentDate: validateAppointmentDate,
  message: validateMessage,
  reasonOther: validateReasonOther,
  form: validateAppointmentForm,
} as const;

export const sanitizers = {
  string: sanitizeString,
  html: sanitizeHtml,
  name: sanitizeName,
  phone: sanitizePhone,
  message: sanitizeMessage,
  form: sanitizeAppointmentForm,
} as const;
