import dayjs from "dayjs";
import {
  getUserTimezone,
  getUserTimezoneDisplayName,
  formatGuadeloupeTime,
  formatLocalDateTime,
  formatShortDate,
  formatLongDateTime,
  formatTableDateTime,
  formatGuadeloupeDateTime,
  formatLocalStoredDateTime,
  formatForDateTimeInput,
  convertToGuadeloupeTime,
  getCurrentGuadeloupeTime,
  formatRelativeTime,
  getMinimumBookingDate,
  getMaximumBookingDate,
  isValidTimeSlot,
  isValidBookingDate,
  getAvailableTimeSlots,
  convertToUTC,
  convertFromUTC,
} from "../date-utils";

// Mock dayjs
jest.mock("dayjs", () => {
  const originalDayjs = jest.requireActual("dayjs");
  const mockDayjs = jest.fn();

  // Copier toutes les propriétés de l'original
  Object.assign(mockDayjs, originalDayjs);

  // Mock des méthodes spécifiques
  (mockDayjs as any).extend = jest.fn();
  (mockDayjs as any).locale = jest.fn();
  (mockDayjs as any).tz = jest.fn();
  (mockDayjs as any).utc = jest.fn();
  (mockDayjs as any).isDayjs = jest.fn();

  return mockDayjs;
});

const mockedDayjs = dayjs as any;

describe("Date Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserTimezone", () => {
    it("devrait retourner la timezone de l'utilisateur", () => {
      const mockTimezone = "Europe/Paris";
      const originalResolvedOptions =
        Intl.DateTimeFormat.prototype.resolvedOptions;

      Intl.DateTimeFormat.prototype.resolvedOptions = jest
        .fn()
        .mockReturnValue({
          timeZone: mockTimezone,
        });

      const result = getUserTimezone();

      expect(result).toBe(mockTimezone);

      // Restaurer la méthode originale
      Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
    });
  });

  describe("getUserTimezoneDisplayName", () => {
    it("devrait retourner le nom d'affichage de la timezone", () => {
      const mockTimezone = "Europe/Paris";
      const mockDisplayName = "heure normale d'Europe centrale";

      const originalResolvedOptions =
        Intl.DateTimeFormat.prototype.resolvedOptions;
      const originalFormatToParts = Intl.DateTimeFormat.prototype.formatToParts;

      Intl.DateTimeFormat.prototype.resolvedOptions = jest
        .fn()
        .mockReturnValue({
          timeZone: mockTimezone,
        });

      Intl.DateTimeFormat.prototype.formatToParts = jest
        .fn()
        .mockReturnValue([{ type: "timeZoneName", value: mockDisplayName }]);

      const result = getUserTimezoneDisplayName();

      expect(result).toBe(mockDisplayName);

      // Restaurer les méthodes originales
      Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
      Intl.DateTimeFormat.prototype.formatToParts = originalFormatToParts;
    });

    it("devrait retourner l'identifiant de timezone en cas d'erreur", () => {
      const mockTimezone = "Europe/Paris";

      const originalResolvedOptions =
        Intl.DateTimeFormat.prototype.resolvedOptions;
      const originalFormatToParts = Intl.DateTimeFormat.prototype.formatToParts;

      Intl.DateTimeFormat.prototype.resolvedOptions = jest
        .fn()
        .mockReturnValue({
          timeZone: mockTimezone,
        });

      Intl.DateTimeFormat.prototype.formatToParts = jest
        .fn()
        .mockImplementation(() => {
          throw new Error("Format error");
        });

      const result = getUserTimezoneDisplayName();

      expect(result).toBe(mockTimezone);

      // Restaurer les méthodes originales
      Intl.DateTimeFormat.prototype.resolvedOptions = originalResolvedOptions;
      Intl.DateTimeFormat.prototype.formatToParts = originalFormatToParts;
    });
  });

  describe("formatGuadeloupeTime", () => {
    it("devrait formater une date en heure de Guadeloupe", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "15/01/2024 à 06:00";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatGuadeloupeTime(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith(
        "DD/MM/YYYY à HH:mm"
      );
      expect(result).toBe(mockFormatted);
    });

    it("devrait utiliser le format par défaut", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "15/01/2024 à 06:00";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      formatGuadeloupeTime(mockDate);

      expect(mockDayjsInstance.format).toHaveBeenCalledWith(
        "DD/MM/YYYY à HH:mm"
      );
    });

    it("devrait utiliser un format personnalisé", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const customFormat = "YYYY-MM-DD HH:mm";
      const mockFormatted = "2024-01-15 06:00";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatGuadeloupeTime(mockDate, customFormat);

      expect(mockDayjsInstance.format).toHaveBeenCalledWith(customFormat);
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatLocalDateTime", () => {
    it("devrait formater une date locale", () => {
      const mockDate = new Date("2024-01-15T10:00:00");
      const mockFormatted = "lundi 15 janvier 2024 à 10:00";
      const mockDayjsInstance = {
        year: jest.fn().mockReturnThis(),
        month: jest.fn().mockReturnThis(),
        date: jest.fn().mockReturnThis(),
        hour: jest.fn().mockReturnThis(),
        minute: jest.fn().mockReturnThis(),
        second: jest.fn().mockReturnThis(),
        locale: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatLocalDateTime(mockDate);

      expect(mockedDayjs).toHaveBeenCalled();
      expect(mockDayjsInstance.year).toHaveBeenCalledWith(2024);
      expect(mockDayjsInstance.month).toHaveBeenCalledWith(0);
      expect(mockDayjsInstance.date).toHaveBeenCalledWith(15);
      expect(mockDayjsInstance.hour).toHaveBeenCalledWith(10);
      expect(mockDayjsInstance.minute).toHaveBeenCalledWith(0);
      expect(mockDayjsInstance.second).toHaveBeenCalledWith(0);
      expect(mockDayjsInstance.locale).toHaveBeenCalledWith("fr");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith(
        "dddd DD MMMM YYYY à HH:mm"
      );
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatShortDate", () => {
    it("devrait formater une date courte", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "15/01/2024";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatShortDate(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith("DD/MM/YYYY");
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatLongDateTime", () => {
    it("devrait formater une date longue", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "lundi 15 janvier 2024 à 06:00";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatLongDateTime(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith(
        "dddd DD MMMM YYYY à HH:mm"
      );
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatTableDateTime", () => {
    it("devrait formater une date pour tableau avec objet dayjs", () => {
      const mockDayjsObject = {
        format: jest.fn().mockReturnValue("15/01/2024 06:00"),
      };

      mockedDayjs.isDayjs.mockReturnValue(true);

      const result = formatTableDateTime(mockDayjsObject as any);

      expect(mockedDayjs.isDayjs).toHaveBeenCalledWith(mockDayjsObject);
      expect(mockDayjsObject.format).toHaveBeenCalledWith("DD/MM/YYYY HH:mm");
      expect(result).toBe("15/01/2024 06:00");
    });

    it("devrait formater une date pour tableau avec date UTC", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "15/01/2024 06:00";
      const mockDayjsInstance = {
        utc: jest.fn().mockReturnThis(),
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.isDayjs.mockReturnValue(false);
      mockedDayjs.utc.mockReturnValue(mockDayjsInstance as any);

      const result = formatTableDateTime(mockDate);

      expect(mockedDayjs.isDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockedDayjs.utc).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith("DD/MM/YYYY HH:mm");
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatGuadeloupeDateTime", () => {
    it("devrait formater une date en heure de Guadeloupe", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "15/01/2024 06:00";
      const mockDayjsInstance = {
        utc: jest.fn().mockReturnThis(),
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.utc.mockReturnValue(mockDayjsInstance as any);

      const result = formatGuadeloupeDateTime(mockDate);

      expect(mockedDayjs.utc).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith("DD/MM/YYYY HH:mm");
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatLocalStoredDateTime", () => {
    it("devrait formater une date stockée localement", () => {
      const mockDate = "2024-01-15T10:00:00";
      const mockFormatted = "15/01/2024 10:00";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatLocalStoredDateTime(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith("DD/MM/YYYY HH:mm");
      expect(result).toBe(mockFormatted);
    });
  });

  describe("formatForDateTimeInput", () => {
    it("devrait formater une date pour input datetime-local", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "2024-01-15T06:00";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatForDateTimeInput(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.format).toHaveBeenCalledWith("YYYY-MM-DDTHH:mm");
      expect(result).toBe(mockFormatted);
    });
  });

  describe("convertToGuadeloupeTime", () => {
    it("devrait convertir une date en heure de Guadeloupe", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = convertToGuadeloupeTime(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(result).toBe(mockDayjsInstance);
    });
  });

  describe("getCurrentGuadeloupeTime", () => {
    it("devrait retourner l'heure actuelle de Guadeloupe", () => {
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = getCurrentGuadeloupeTime();

      expect(mockedDayjs).toHaveBeenCalled();
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(result).toBe(mockDayjsInstance);
    });
  });

  describe("formatRelativeTime", () => {
    it("devrait formater un temps relatif", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockFormatted = "il y a 2 heures";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        fromNow: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = formatRelativeTime(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.fromNow).toHaveBeenCalled();
      expect(result).toBe(mockFormatted);
    });
  });

  describe("isValidTimeSlot", () => {
    it("devrait valider un créneau du matin", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        hour: jest.fn().mockReturnValue(10),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = isValidTimeSlot(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(mockDayjsInstance.hour).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("devrait valider un créneau de l'après-midi", () => {
      const mockDate = "2024-01-15T15:00:00Z";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        hour: jest.fn().mockReturnValue(15),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = isValidTimeSlot(mockDate);

      expect(result).toBe(true);
    });

    it("devrait rejeter un créneau en dehors des heures autorisées", () => {
      const mockDate = "2024-01-15T13:00:00Z";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        hour: jest.fn().mockReturnValue(13),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = isValidTimeSlot(mockDate);

      expect(result).toBe(false);
    });
  });

  describe("getAvailableTimeSlots", () => {
    it("devrait générer les créneaux disponibles", () => {
      const mockDate = "2024-01-15";
      const mockSlots = [
        {
          hour: jest.fn().mockReturnThis(),
          minute: jest.fn().mockReturnThis(),
          second: jest.fn().mockReturnThis(),
        },
        {
          hour: jest.fn().mockReturnThis(),
          minute: jest.fn().mockReturnThis(),
          second: jest.fn().mockReturnThis(),
        },
      ];

      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        hour: jest.fn().mockReturnThis(),
        minute: jest.fn().mockReturnThis(),
        second: jest.fn().mockReturnThis(),
      };

      mockedDayjs.mockReturnValue(mockDayjsInstance as any);

      const result = getAvailableTimeSlots(mockDate);

      expect(mockedDayjs).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("convertToUTC", () => {
    it("devrait convertir une date en UTC avec timezone utilisateur", () => {
      const mockDate = "2024-01-15T10:00:00";
      const userTimezone = "Europe/Paris";
      const mockFormatted = "2024-01-15T09:00:00Z";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.tz.mockReturnValue(mockDayjsInstance as any);

      const result = convertToUTC(mockDate, userTimezone);

      expect(mockedDayjs.tz).toHaveBeenCalledWith(mockDate, userTimezone);
      expect(mockDayjsInstance.format).toHaveBeenCalled();
      expect(result).toBe(mockFormatted);
    });

    it("devrait utiliser la timezone détectée automatiquement", () => {
      const mockDate = new Date("2024-01-15T10:00:00");
      const mockFormatted = "2024-01-15T09:00:00Z";
      const mockDayjsInstance = {
        tz: jest.fn().mockReturnThis(),
        format: jest.fn().mockReturnValue(mockFormatted),
      };

      mockedDayjs.tz.mockReturnValue(mockDayjsInstance as any);

      const result = convertToUTC(mockDate);

      expect(mockedDayjs.tz).toHaveBeenCalled();
      expect(result).toBe(mockFormatted);
    });
  });

  describe("convertFromUTC", () => {
    it("devrait convertir une date UTC en heure de Guadeloupe", () => {
      const mockDate = "2024-01-15T10:00:00Z";
      const mockDayjsInstance = {
        utc: jest.fn().mockReturnThis(),
        tz: jest.fn().mockReturnThis(),
      };

      mockedDayjs.utc.mockReturnValue(mockDayjsInstance as any);

      const result = convertFromUTC(mockDate);

      expect(mockedDayjs.utc).toHaveBeenCalledWith(mockDate);
      expect(mockDayjsInstance.tz).toHaveBeenCalledWith("America/Guadeloupe");
      expect(result).toBe(mockDayjsInstance);
    });
  });
});
