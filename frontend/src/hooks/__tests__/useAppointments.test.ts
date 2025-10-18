import { renderHook, act } from "@testing-library/react";
import { useAppointments } from "../useAppointments";
import { backofficeApi } from "@/lib/backoffice-api";
import { showSuccess, showError } from "@/lib/toast";
import { AppointmentStatus } from "@/types/appointment";

// Mock des dépendances
jest.mock("@/lib/backoffice-api");
jest.mock("@/lib/toast");

const mockedBackofficeApi = backofficeApi as jest.Mocked<typeof backofficeApi>;
const mockedShowSuccess = showSuccess as jest.MockedFunction<
  typeof showSuccess
>;
const mockedShowError = showError as jest.MockedFunction<typeof showError>;

describe("useAppointments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("État initial", () => {
    it("devrait avoir un état initial correct", () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.appointments).toEqual([]);
      expect(result.current.loading).toBe(true);
      expect(result.current.filter).toBe("ALL");
      expect(result.current.stats).toBe(null);
    });
  });

  describe("fetchAppointments", () => {
    it("devrait charger les rendez-vous avec succès", async () => {
      const mockAppointments = [
        {
          id: "1",
          contactId: "contact-1",
          status: "PENDING" as AppointmentStatus,
          requestedAt: new Date(),
          timezone: "Europe/Paris",
          confirmationToken: "token-1",
          cancellationToken: "token-1",
          createdAt: new Date(),
          updatedAt: new Date(),
          contact: {
            id: "contact-1",
            firstName: "Jean",
            lastName: "Dupont",
            email: "jean@example.com",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      mockedBackofficeApi.getAppointments.mockResolvedValue(mockAppointments);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(mockedBackofficeApi.getAppointments).toHaveBeenCalledWith("ALL");
      expect(result.current.appointments).toEqual(mockAppointments);
      expect(result.current.loading).toBe(false);
    });

    it("devrait gérer les erreurs lors du chargement", async () => {
      const mockError = new Error("Erreur réseau");
      mockedBackofficeApi.getAppointments.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchAppointments();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors du chargement des rendez-vous:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors du chargement des rendez-vous"
      );
      expect(result.current.loading).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("fetchStats", () => {
    it("devrait charger les statistiques avec succès", async () => {
      const mockStats = {
        total: 10,
        pending: 5,
        confirmed: 3,
        cancelled: 2,
      };

      mockedBackofficeApi.getStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(mockedBackofficeApi.getStats).toHaveBeenCalled();
      expect(result.current.stats).toEqual(mockStats);
    });

    it("devrait gérer les erreurs lors du chargement des statistiques", async () => {
      const mockError = new Error("Erreur statistiques");
      mockedBackofficeApi.getStats.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.fetchStats();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors du chargement des statistiques:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors du chargement des statistiques"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("updateAppointmentStatus", () => {
    it("devrait mettre à jour le statut d'un rendez-vous avec succès", async () => {
      mockedBackofficeApi.updateAppointmentStatus.mockResolvedValue(undefined);
      mockedBackofficeApi.getAppointments.mockResolvedValue([]);
      mockedBackofficeApi.getStats.mockResolvedValue({});

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.CONFIRMED
        );
      });

      expect(mockedBackofficeApi.updateAppointmentStatus).toHaveBeenCalledWith(
        "appointment-1",
        { status: AppointmentStatus.CONFIRMED, scheduledAt: undefined }
      );
      expect(mockedBackofficeApi.getAppointments).toHaveBeenCalled();
      expect(mockedBackofficeApi.getStats).toHaveBeenCalled();
    });

    it("devrait mettre à jour le statut avec une date programmée", async () => {
      mockedBackofficeApi.updateAppointmentStatus.mockResolvedValue(undefined);
      mockedBackofficeApi.getAppointments.mockResolvedValue([]);
      mockedBackofficeApi.getStats.mockResolvedValue({});

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.CONFIRMED,
          "2024-01-15T10:00:00Z"
        );
      });

      expect(mockedBackofficeApi.updateAppointmentStatus).toHaveBeenCalledWith(
        "appointment-1",
        {
          status: AppointmentStatus.CONFIRMED,
          scheduledAt: "2024-01-15T10:00:00Z",
        }
      );
    });

    it("devrait gérer les erreurs lors de la mise à jour", async () => {
      const mockError = new Error("Erreur mise à jour");
      mockedBackofficeApi.updateAppointmentStatus.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.CONFIRMED
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour du statut"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("setFilter", () => {
    it("devrait changer le filtre", () => {
      const { result } = renderHook(() => useAppointments());

      act(() => {
        result.current.setFilter(AppointmentStatus.PENDING);
      });

      expect(result.current.filter).toBe("PENDING");
    });
  });

  describe("deleteAppointment", () => {
    beforeEach(() => {
      mockedBackofficeApi.getAppointments.mockResolvedValue([]);
      mockedBackofficeApi.getStats.mockResolvedValue({});
    });

    it("devrait supprimer un rendez-vous avec succès", async () => {
      // Mock de la fonction confirm pour retourner true
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
      mockedBackofficeApi.deleteAppointment.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.deleteAppointment("appointment-1");
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        "Êtes-vous sûr de vouloir supprimer ce rendez-vous ?"
      );
      expect(mockedBackofficeApi.deleteAppointment).toHaveBeenCalledWith(
        "appointment-1"
      );
      expect(mockedBackofficeApi.getAppointments).toHaveBeenCalled();
      expect(mockedBackofficeApi.getStats).toHaveBeenCalled();
      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Rendez-vous supprimé avec succès"
      );

      confirmSpy.mockRestore();
    });

    it("ne devrait pas supprimer si l'utilisateur annule", async () => {
      // Mock de la fonction confirm pour retourner false
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(false);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.deleteAppointment("appointment-1");
      });

      expect(confirmSpy).toHaveBeenCalledWith(
        "Êtes-vous sûr de vouloir supprimer ce rendez-vous ?"
      );
      expect(mockedBackofficeApi.deleteAppointment).not.toHaveBeenCalled();
      expect(mockedShowSuccess).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it("devrait gérer les erreurs lors de la suppression", async () => {
      const confirmSpy = jest.spyOn(window, "confirm").mockReturnValue(true);
      const mockError = new Error("Erreur suppression");
      mockedBackofficeApi.deleteAppointment.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.deleteAppointment("appointment-1");
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la suppression:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors de la suppression du rendez-vous"
      );

      confirmSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  describe("sendReminder", () => {
    it("devrait envoyer un rappel avec succès", async () => {
      mockedBackofficeApi.sendReminder.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.sendReminder("appointment-1");
      });

      expect(mockedBackofficeApi.sendReminder).toHaveBeenCalledWith(
        "appointment-1"
      );
      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Rappel envoyé avec succès"
      );
    });

    it("devrait gérer les erreurs lors de l'envoi du rappel", async () => {
      const mockError = new Error("Erreur envoi rappel");
      mockedBackofficeApi.sendReminder.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.sendReminder("appointment-1");
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de l'envoi du rappel:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors de l'envoi du rappel"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getStatusLabel", () => {
    it("devrait retourner les bons labels pour chaque statut", () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.getStatusLabel(AppointmentStatus.PENDING)).toBe(
        "En attente"
      );
      expect(result.current.getStatusLabel(AppointmentStatus.CONFIRMED)).toBe(
        "Confirmé"
      );
      expect(result.current.getStatusLabel(AppointmentStatus.RESCHEDULED)).toBe(
        "Demande de reprogrammation en cours"
      );
      expect(result.current.getStatusLabel(AppointmentStatus.CANCELLED)).toBe(
        "Annulé"
      );
      expect(result.current.getStatusLabel(AppointmentStatus.REJECTED)).toBe(
        "Rejeté"
      );
      expect(result.current.getStatusLabel(AppointmentStatus.COMPLETED)).toBe(
        "Terminé"
      );
      expect(
        result.current.getStatusLabel("UNKNOWN" as AppointmentStatus)
      ).toBe("UNKNOWN");
    });
  });

  describe("getStatusColor", () => {
    it("devrait retourner les bonnes classes CSS pour chaque statut", () => {
      const { result } = renderHook(() => useAppointments());

      expect(result.current.getStatusColor(AppointmentStatus.PENDING)).toBe(
        "status-pending"
      );
      expect(result.current.getStatusColor(AppointmentStatus.CONFIRMED)).toBe(
        "status-confirmed"
      );
      expect(result.current.getStatusColor(AppointmentStatus.RESCHEDULED)).toBe(
        "status-rescheduled"
      );
      expect(result.current.getStatusColor(AppointmentStatus.CANCELLED)).toBe(
        "status-cancelled"
      );
      expect(result.current.getStatusColor(AppointmentStatus.REJECTED)).toBe(
        "status-rejected"
      );
      expect(result.current.getStatusColor(AppointmentStatus.COMPLETED)).toBe(
        "status-completed"
      );
      expect(
        result.current.getStatusColor("UNKNOWN" as AppointmentStatus)
      ).toBe("");
    });
  });

  describe("updateAppointmentStatus - Messages de succès", () => {
    beforeEach(() => {
      mockedBackofficeApi.updateAppointmentStatus.mockResolvedValue(undefined);
      mockedBackofficeApi.getAppointments.mockResolvedValue([]);
      mockedBackofficeApi.getStats.mockResolvedValue({});
    });

    it("devrait afficher le bon message pour CONFIRMED", async () => {
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.CONFIRMED
        );
      });

      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Rendez-vous confirmé avec succès"
      );
    });

    it("devrait afficher le bon message pour REJECTED", async () => {
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.REJECTED
        );
      });

      expect(mockedShowSuccess).toHaveBeenCalledWith("Rendez-vous rejeté");
    });

    it("devrait afficher le bon message pour COMPLETED", async () => {
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.COMPLETED
        );
      });

      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Rendez-vous marqué comme terminé"
      );
    });

    it("devrait afficher le message par défaut pour les autres statuts", async () => {
      const { result } = renderHook(() => useAppointments());

      await act(async () => {
        await result.current.updateAppointmentStatus(
          "appointment-1",
          AppointmentStatus.PENDING
        );
      });

      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Statut mis à jour avec succès"
      );
    });
  });
});
