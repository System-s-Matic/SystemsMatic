import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dayjs/locale/fr";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.locale("fr");

const GUADELOUPE_TIMEZONE = "America/Guadeloupe";
const TIME_SLOTS_CONFIG = {
  MORNING: { START: 8, END: 12 },
  AFTERNOON: { START: 14, END: 17 },
};

/**
 * Détecte automatiquement la timezone du navigateur de l'utilisateur
 *
 * @returns Identifiant de la timezone (ex: "Europe/Paris", "America/Guadeloupe")
 */
export const getUserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
};

/**
 * Obtient le nom lisible et localisé de la timezone de l'utilisateur
 *
 * @returns Nom complet de la timezone en français (ex: "heure normale d'Europe centrale")
 */
export const getUserTimezoneDisplayName = (): string => {
  const timezone = getUserTimezone();
  const now = new Date();

  try {
    const formatter = new Intl.DateTimeFormat("fr-FR", {
      timeZone: timezone,
      timeZoneName: "long",
    });

    const parts = formatter.formatToParts(now);
    const timeZoneName = parts.find(
      (part) => part.type === "timeZoneName"
    )?.value;

    return timeZoneName || timezone;
  } catch (error) {
    // Fallback sur l'identifiant de la timezone si le formatage échoue
    return timezone;
  }
};

// ====================================================
// FONCTIONS DE FORMATAGE DES DATES
// ====================================================

/**
 * Formate une date en heure locale de Guadeloupe avec format personnalisable
 *
 * @param date - Date à formater (string ou objet Date)
 * @param format - Format souhaité (par défaut: "DD/MM/YYYY à HH:mm")
 * @returns Date formatée en heure de Guadeloupe
 */
export const formatGuadeloupeTime = (
  date: string | Date,
  format: string = "DD/MM/YYYY à HH:mm"
) => {
  return dayjs(date).tz(GUADELOUPE_TIMEZONE).format(format);
};

/**
 * Formate une date locale en préservant exactement les valeurs
 * (pour les dates créées localement qui doivent être affichées telles quelles)
 */
export const formatLocalDateTime = (
  date: Date,
  format: string = "dddd DD MMMM YYYY à HH:mm"
) => {
  // Créer un dayjs directement avec les valeurs de la date locale
  return dayjs()
    .year(date.getFullYear())
    .month(date.getMonth())
    .date(date.getDate())
    .hour(date.getHours())
    .minute(date.getMinutes())
    .second(date.getSeconds())
    .locale("fr")
    .format(format);
};

/**
 * Formate une date en format court pour l'affichage
 */
export const formatShortDate = (date: string | Date) => {
  return dayjs(date).tz(GUADELOUPE_TIMEZONE).format("DD/MM/YYYY");
};

/**
 * Formate une date en format long avec l'heure
 */
export const formatLongDateTime = (date: string | Date) => {
  return dayjs(date)
    .tz(GUADELOUPE_TIMEZONE)
    .format("dddd DD MMMM YYYY à HH:mm");
};

/**
 * Formate une date pour l'affichage dans les tableaux
 */
export const formatTableDateTime = (date: string | Date) => {
  // Si la date est déjà un objet dayjs avec timezone, l'utiliser directement
  if (dayjs.isDayjs(date)) {
    return date.format("DD/MM/YYYY HH:mm");
  }

  // Sinon, traiter comme une date UTC et la convertir
  return dayjs.utc(date).tz(GUADELOUPE_TIMEZONE).format("DD/MM/YYYY HH:mm");
};

/**
 * Fonction UNIVERSELLE d'affichage : force TOUJOURS le timezone Guadeloupe
 * Utiliser partout pour garantir la cohérence
 */
export const formatGuadeloupeDateTime = (date: string | Date) => {
  return dayjs.utc(date).tz(GUADELOUPE_TIMEZONE).format("DD/MM/YYYY HH:mm");
};

/**
 * Fonction pour afficher les dates stockées localement (sans conversion UTC forcée)
 * À utiliser pour les dates qui sont déjà stockées en heure locale
 */
export const formatLocalStoredDateTime = (date: string | Date) => {
  return dayjs(date).tz(GUADELOUPE_TIMEZONE).format("DD/MM/YYYY HH:mm");
};

/**
 * Formate une date pour l'input datetime-local
 */
export const formatForDateTimeInput = (date: string | Date) => {
  return dayjs(date).tz(GUADELOUPE_TIMEZONE).format("YYYY-MM-DDTHH:mm");
};

/**
 * Convertit une date UTC en heure locale de Guadeloupe
 */
export const convertToGuadeloupeTime = (date: string | Date) => {
  return dayjs(date).tz(GUADELOUPE_TIMEZONE);
};

/**
 * Obtient la date/heure actuelle en Guadeloupe
 */
export const getCurrentGuadeloupeTime = () => {
  return dayjs().tz(GUADELOUPE_TIMEZONE);
};

/**
 * Formate une durée relative (ex: "dans 2 heures")
 */
export const formatRelativeTime = (date: string | Date) => {
  return dayjs(date).tz(GUADELOUPE_TIMEZONE).fromNow();
};

/**
 * Calcule la date minimale pour prendre un rendez-vous (lendemain à 8h)
 */
export const getMinimumBookingDate = () => {
  const tomorrow = getCurrentGuadeloupeTime().add(1, "day");
  return tomorrow.hour(8).minute(0).second(0);
};

/**
 * Calcule la date maximale pour prendre un rendez-vous (1 mois à partir d'aujourd'hui)
 */
export const getMaximumBookingDate = () => {
  const oneMonthFromNow = getCurrentGuadeloupeTime().add(1, "month");
  return oneMonthFromNow.hour(23).minute(59).second(59);
};

// ====================================================
// FONCTIONS DE VALIDATION DES CRÉNEAUX
// ====================================================

/**
 * Vérifie si une heure est dans les créneaux autorisés pour les rendez-vous
 *
 * Créneaux autorisés :
 * - Matin : 8h00 à 12h00
 * - Après-midi : 14h00 à 17h00
 *
 * @param date - Date à vérifier
 * @returns true si l'heure est dans un créneau autorisé
 */
export const isValidTimeSlot = (date: string | Date): boolean => {
  const guadeloupeTime = dayjs(date).tz(GUADELOUPE_TIMEZONE);
  const hour = guadeloupeTime.hour();

  return (
    (hour >= TIME_SLOTS_CONFIG.MORNING.START &&
      hour < TIME_SLOTS_CONFIG.MORNING.END) ||
    (hour >= TIME_SLOTS_CONFIG.AFTERNOON.START &&
      hour < TIME_SLOTS_CONFIG.AFTERNOON.END)
  );
};

/**
 * Vérifie si une date de rendez-vous est dans la plage autorisée
 */
export const isValidBookingDate = (date: string | Date) => {
  const targetDate = dayjs(date).tz(GUADELOUPE_TIMEZONE);
  const minDate = getMinimumBookingDate();
  const maxDate = getMaximumBookingDate();

  return targetDate.isAfter(minDate) && targetDate.isBefore(maxDate);
};

/**
 * Génère automatiquement tous les créneaux horaires disponibles pour une date donnée
 *
 * @param date - Date pour laquelle générer les créneaux
 * @returns Tableau des créneaux disponibles (objets dayjs)
 */
export const getAvailableTimeSlots = (date: string | Date) => {
  const slots = [];
  const targetDate = dayjs(date).tz(GUADELOUPE_TIMEZONE);

  // Génération des créneaux du matin (8h-12h)
  for (
    let hour = TIME_SLOTS_CONFIG.MORNING.START;
    hour < TIME_SLOTS_CONFIG.MORNING.END;
    hour++
  ) {
    slots.push(targetDate.hour(hour).minute(0).second(0));
  }

  // Génération des créneaux de l'après-midi (14h-17h)
  for (
    let hour = TIME_SLOTS_CONFIG.AFTERNOON.START;
    hour < TIME_SLOTS_CONFIG.AFTERNOON.END;
    hour++
  ) {
    slots.push(targetDate.hour(hour).minute(0).second(0));
  }

  return slots;
};

// ====================================================
// FONCTIONS DE CONVERSION TIMEZONE
// ====================================================

/**
 * Convertit une date sélectionnée en conservant l'offset timezone de l'utilisateur
 *
 * Cette fonction préserve l'heure choisie par l'utilisateur dans sa timezone locale
 * et retourne une chaîne ISO avec l'offset timezone approprié.
 *
 * @param date - Date à convertir (string ou objet Date)
 * @param userTimezone - Timezone de l'utilisateur (optionnel, détectée automatiquement)
 * @returns Chaîne ISO avec offset timezone
 */
export const convertToUTC = (
  date: string | Date,
  userTimezone?: string
): string => {
  const timezone = userTimezone || getUserTimezone();

  if (typeof date === "string") {
    return dayjs.tz(date, timezone).format();
  }

  // Construire une chaîne de date formatée pour la timezone utilisateur
  const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const userTime = dayjs.tz(dateString, timezone);
  return userTime.format(); // Retourne avec l'offset timezone préservé
};

/**
 * Convertit une date UTC reçue du backend en heure locale de Guadeloupe
 *
 * @param date - Date UTC à convertir
 * @returns Objet dayjs dans la timezone de Guadeloupe
 */
export const convertFromUTC = (date: string | Date) => {
  return dayjs.utc(date).tz(GUADELOUPE_TIMEZONE);
};
