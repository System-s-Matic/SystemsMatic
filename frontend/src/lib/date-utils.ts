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

// Créneaux horaires disponibles
const MORNING_START = 8; // 8h
const MORNING_END = 12; // 12h
const AFTERNOON_START = 14; // 14h
const AFTERNOON_END = 17; // 17h

/**
 * Formate une date en heure locale de Guadeloupe
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

/**
 * Vérifie si une heure est dans les créneaux autorisés
 */
export const isValidTimeSlot = (date: string | Date) => {
  const guadeloupeTime = dayjs(date).tz(GUADELOUPE_TIMEZONE);
  const hour = guadeloupeTime.hour();

  return (
    (hour >= MORNING_START && hour < MORNING_END) ||
    (hour >= AFTERNOON_START && hour < AFTERNOON_END)
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
 * Génère les créneaux horaires disponibles pour une date donnée
 */
export const getAvailableTimeSlots = (date: string | Date) => {
  const slots = [];
  const targetDate = dayjs(date).tz(GUADELOUPE_TIMEZONE);

  // Créneaux du matin (8h-12h)
  for (let hour = MORNING_START; hour < MORNING_END; hour++) {
    slots.push(targetDate.hour(hour).minute(0).second(0));
  }

  // Créneaux de l'après-midi (14h-17h)
  for (let hour = AFTERNOON_START; hour < AFTERNOON_END; hour++) {
    slots.push(targetDate.hour(hour).minute(0).second(0));
  }

  return slots;
};

/**
 * Convertit une date sélectionnée en UTC pour stockage (bonne pratique)
 * L'utilisateur sélectionne une heure "intention Guadeloupe" qu'on stocke en UTC
 */
export const convertToUTC = (date: string | Date) => {
  if (typeof date === "string") {
    return dayjs.tz(date, GUADELOUPE_TIMEZONE).utc().toISOString();
  }

  // Traiter la sélection comme une "intention heure Guadeloupe"
  const dateString = `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;

  const guadeloupeTime = dayjs.tz(dateString, GUADELOUPE_TIMEZONE);
  return guadeloupeTime.utc().toISOString();
};

/**
 * Convertit une date UTC du backend en heure locale
 */
export const convertFromUTC = (date: string | Date) => {
  return dayjs.utc(date).tz(GUADELOUPE_TIMEZONE);
};
