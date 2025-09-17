/**
 * ====================================================
 * UTILITAIRES DE VALIDATION
 * ====================================================
 *
 * Ce fichier contient toutes les fonctions de validation
 * utilisées dans l'application pour garantir la cohérence
 * et la réutilisabilité.
 *
 * @author System's Matic
 * @version 1.0.0
 */

import { REGEX_PATTERNS, TEXT_LIMITS, ERROR_MESSAGES } from "./constants";
import { isValidTimeSlot, isValidBookingDate } from "./date-utils";

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

  // Nettoyer le numéro (enlever espaces, points, tirets)
  const cleanPhone = phone.replace(/[\s.-]/g, "");

  // Vérifier le format français ou guadeloupéen
  const isFrenchFormat = REGEX_PATTERNS.PHONE_FR.test(phone);
  const isGuadeloupeFormat = REGEX_PATTERNS.PHONE_GP.test(phone);

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
  // Vérifier si requis
  const requiredResult = validateRequired(name, fieldName);
  if (!requiredResult.isValid) {
    return requiredResult;
  }

  // Vérifier la longueur
  const lengthResult = validateTextLength(
    name,
    TEXT_LIMITS.FIRST_NAME.MIN,
    TEXT_LIMITS.FIRST_NAME.MAX
  );
  if (!lengthResult.isValid) {
    return lengthResult;
  }

  // Vérifier les caractères (lettres, espaces, apostrophes, tirets)
  const namePattern = /^[a-zA-ZÀ-ÿ\s'-]+$/;
  if (!namePattern.test(name.trim())) {
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

  return validateTextLength(message, 0, TEXT_LIMITS.MESSAGE.MAX);
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
    return validateTextLength(reasonOther, 0, TEXT_LIMITS.REASON_OTHER.MAX);
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
 * Validateurs exportés pour usage externe
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
