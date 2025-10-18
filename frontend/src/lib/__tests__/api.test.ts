// Mock du module api
jest.mock("../api", () => ({
  appointmentService: {
    create: jest.fn(),
    confirmByToken: jest.fn(),
    cancelByToken: jest.fn(),
    acceptReschedule: jest.fn(),
    rejectReschedule: jest.fn(),
  },
  quoteService: {
    create: jest.fn(),
  },
}));

import { appointmentService, quoteService } from "../api";
import { AppointmentReason } from "../../types/appointment";

describe("API Services", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("appointmentService", () => {
    describe("create", () => {
      it("devrait créer un rendez-vous avec succès", async () => {
        const mockData = {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          phone: "+33123456789",
          reason: AppointmentReason.INSTALLATION,
          message: "Installation de portail",
          requestedAt: "2024-01-15T10:00:00Z",
          timezone: "Europe/Paris",
          consent: true,
        };

        const mockResponse = { id: "appointment-123", ...mockData };
        (appointmentService.create as jest.Mock).mockResolvedValue(
          mockResponse
        );

        const result = await appointmentService.create(mockData);

        expect(appointmentService.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual(mockResponse);
      });

      it("devrait gérer les erreurs de création", async () => {
        const mockData = {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          requestedAt: "2024-01-15T10:00:00Z",
          timezone: "Europe/Paris",
          consent: true,
        };
        const error = new Error("Network error");
        (appointmentService.create as jest.Mock).mockRejectedValue(error);

        await expect(appointmentService.create(mockData)).rejects.toThrow(
          "Network error"
        );
      });
    });

    describe("confirmByToken", () => {
      it("devrait confirmer un rendez-vous avec token", async () => {
        const mockResponse = { success: true };
        (appointmentService.confirmByToken as jest.Mock).mockResolvedValue(
          mockResponse
        );

        const result = await appointmentService.confirmByToken(
          "appointment-123",
          "token-456"
        );

        expect(appointmentService.confirmByToken).toHaveBeenCalledWith(
          "appointment-123",
          "token-456"
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("cancelByToken", () => {
      it("devrait annuler un rendez-vous avec token", async () => {
        const mockResponse = { success: true };
        (appointmentService.cancelByToken as jest.Mock).mockResolvedValue(
          mockResponse
        );

        const result = await appointmentService.cancelByToken(
          "appointment-123",
          "token-456"
        );

        expect(appointmentService.cancelByToken).toHaveBeenCalledWith(
          "appointment-123",
          "token-456"
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("acceptReschedule", () => {
      it("devrait accepter une reprogrammation", async () => {
        const mockResponse = { success: true };
        (appointmentService.acceptReschedule as jest.Mock).mockResolvedValue(
          mockResponse
        );

        const result = await appointmentService.acceptReschedule(
          "appointment-123",
          "token-456"
        );

        expect(appointmentService.acceptReschedule).toHaveBeenCalledWith(
          "appointment-123",
          "token-456"
        );
        expect(result).toEqual(mockResponse);
      });
    });

    describe("rejectReschedule", () => {
      it("devrait refuser une reprogrammation", async () => {
        const mockResponse = { success: true };
        (appointmentService.rejectReschedule as jest.Mock).mockResolvedValue(
          mockResponse
        );

        const result = await appointmentService.rejectReschedule(
          "appointment-123",
          "token-456"
        );

        expect(appointmentService.rejectReschedule).toHaveBeenCalledWith(
          "appointment-123",
          "token-456"
        );
        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe("quoteService", () => {
    describe("create", () => {
      it("devrait créer un devis avec succès", async () => {
        const mockData = {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          phone: "+33123456789",
          message: "Demande de devis pour portail",
          acceptPhone: true,
          acceptTerms: true,
        };

        const mockResponse = { id: "quote-123", ...mockData };
        (quoteService.create as jest.Mock).mockResolvedValue(mockResponse);

        const result = await quoteService.create(mockData);

        expect(quoteService.create).toHaveBeenCalledWith(mockData);
        expect(result).toEqual(mockResponse);
      });

      it("devrait gérer les erreurs de création de devis", async () => {
        const mockData = {
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          message: "Demande de devis",
          acceptPhone: true,
          acceptTerms: true,
        };
        const error = new Error("Validation error");
        (quoteService.create as jest.Mock).mockRejectedValue(error);

        await expect(quoteService.create(mockData)).rejects.toThrow(
          "Validation error"
        );
      });
    });
  });
});
