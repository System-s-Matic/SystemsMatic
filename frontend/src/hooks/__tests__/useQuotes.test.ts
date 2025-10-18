import { renderHook, act } from "@testing-library/react";
import { useQuotes } from "../useQuotes";
import { backofficeApi } from "@/lib/backoffice-api";
import { showSuccess, showError } from "@/lib/toast";

// Mock des dépendances
jest.mock("@/lib/backoffice-api");
jest.mock("@/lib/toast");

const mockedBackofficeApi = backofficeApi as jest.Mocked<typeof backofficeApi>;
const mockedShowSuccess = showSuccess as jest.MockedFunction<
  typeof showSuccess
>;
const mockedShowError = showError as jest.MockedFunction<typeof showError>;

describe("useQuotes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("État initial", () => {
    it("devrait avoir un état initial correct", () => {
      const { result } = renderHook(() => useQuotes());

      expect(result.current.quotes).toEqual([]);
      expect(result.current.quotesLoading).toBe(true);
      expect(result.current.quotesStats).toBe(null);
      expect(result.current.quotesFilter).toBe("");
    });
  });

  describe("fetchQuotes", () => {
    it("devrait charger les devis avec succès", async () => {
      const mockQuotes = [
        {
          id: "1",
          firstName: "Jean",
          lastName: "Dupont",
          email: "jean@example.com",
          message: "Demande de devis",
          status: "PENDING" as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = { data: mockQuotes, total: 1, page: 1, limit: 50 };
      mockedBackofficeApi.getQuotes.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.fetchQuotes();
      });

      expect(mockedBackofficeApi.getQuotes).toHaveBeenCalledWith({
        status: undefined,
        page: 1,
        limit: 50,
      });
      expect(result.current.quotes).toEqual(mockQuotes);
      expect(result.current.quotesLoading).toBe(false);
    });

    it("devrait charger les devis avec un filtre", async () => {
      const mockQuotes: any[] = [];
      const mockResponse = { data: mockQuotes, total: 0, page: 1, limit: 50 };
      mockedBackofficeApi.getQuotes.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useQuotes());

      // Définir un filtre
      act(() => {
        result.current.setQuotesFilter("PENDING");
      });

      await act(async () => {
        await result.current.fetchQuotes();
      });

      expect(mockedBackofficeApi.getQuotes).toHaveBeenCalledWith({
        status: "PENDING" as const,
        page: 1,
        limit: 50,
      });
    });

    it("devrait gérer les erreurs lors du chargement", async () => {
      const mockError = new Error("Erreur réseau");
      mockedBackofficeApi.getQuotes.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.fetchQuotes();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors du chargement des devis:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors du chargement des devis"
      );
      expect(result.current.quotesLoading).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("fetchQuotesStats", () => {
    it("devrait charger les statistiques avec succès", async () => {
      const mockStats = {
        total: 10,
        pending: 5,
        accepted: 3,
        rejected: 2,
      };

      mockedBackofficeApi.getQuotesStats.mockResolvedValue(mockStats);

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.fetchQuotesStats();
      });

      expect(mockedBackofficeApi.getQuotesStats).toHaveBeenCalled();
      expect(result.current.quotesStats).toEqual(mockStats);
    });

    it("devrait gérer les erreurs lors du chargement des statistiques", async () => {
      const mockError = new Error("Erreur statistiques");
      mockedBackofficeApi.getQuotesStats.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.fetchQuotesStats();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors du chargement des statistiques des devis:",
        mockError
      );

      consoleSpy.mockRestore();
    });
  });

  describe("updateQuoteStatus", () => {
    it("devrait mettre à jour le statut d'un devis avec succès", async () => {
      mockedBackofficeApi.updateQuoteStatus.mockResolvedValue(undefined);
      mockedBackofficeApi.getQuotes.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });
      mockedBackofficeApi.getQuotesStats.mockResolvedValue({});

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.updateQuoteStatus("quote-1", "ACCEPTED");
      });

      expect(mockedBackofficeApi.updateQuoteStatus).toHaveBeenCalledWith(
        "quote-1",
        "ACCEPTED"
      );
      expect(mockedBackofficeApi.getQuotes).toHaveBeenCalled();
      expect(mockedBackofficeApi.getQuotesStats).toHaveBeenCalled();
    });

    it("devrait gérer les erreurs lors de la mise à jour", async () => {
      const mockError = new Error("Erreur mise à jour");
      mockedBackofficeApi.updateQuoteStatus.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.updateQuoteStatus("quote-1", "ACCEPTED");
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour du statut:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour du statut"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("setQuotesFilter", () => {
    it("devrait changer le filtre des devis", () => {
      const { result } = renderHook(() => useQuotes());

      act(() => {
        result.current.setQuotesFilter("PENDING");
      });

      expect(result.current.quotesFilter).toBe("PENDING");
    });
  });

  describe("handleSaveQuote", () => {
    const mockQuote = {
      id: "quote-1",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@example.com",
      message: "Demande de devis",
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contactId: "contact-1",
      projectDescription: "Description du projet",
      acceptPhone: true,
      acceptTerms: true,
      contact: {
        id: "contact-1",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@example.com",
        phone: "0123456789",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    beforeEach(() => {
      mockedBackofficeApi.getQuotes.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });
      mockedBackofficeApi.getQuotesStats.mockResolvedValue({});
    });

    it("devrait sauvegarder un devis avec succès", async () => {
      const updatedData = {
        status: "PROCESSING",
        quoteValidUntil: "2024-12-31",
        quoteDocument: "document.pdf",
      };

      mockedBackofficeApi.updateQuote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotes());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.handleSaveQuote(
          mockQuote,
          updatedData
        );
      });

      expect(mockedBackofficeApi.updateQuote).toHaveBeenCalledWith(
        "quote-1",
        updatedData
      );
      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Devis mis à jour avec succès"
      );
      expect(mockedBackofficeApi.getQuotes).toHaveBeenCalled();
      expect(mockedBackofficeApi.getQuotesStats).toHaveBeenCalled();
      expect(saveResult).toBe(true);
    });

    it("devrait valider les champs obligatoires pour le statut SENT", async () => {
      const updatedData = {
        status: "SENT",
        quoteValidUntil: "",
        quoteDocument: "",
      };

      const { result } = renderHook(() => useQuotes());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.handleSaveQuote(
          mockQuote,
          updatedData
        );
      });

      expect(mockedShowError).toHaveBeenCalledWith(
        "Pour marquer un devis comme 'Envoyé', vous devez obligatoirement renseigner une date de validité ET un document PDF."
      );
      expect(mockedBackofficeApi.updateQuote).not.toHaveBeenCalled();
      expect(saveResult).toBe(false);
    });

    it("devrait valider que la date de validité est renseignée pour SENT", async () => {
      const updatedData = {
        status: "SENT",
        quoteValidUntil: "",
        quoteDocument: "document.pdf",
      };

      const { result } = renderHook(() => useQuotes());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.handleSaveQuote(
          mockQuote,
          updatedData
        );
      });

      expect(mockedShowError).toHaveBeenCalledWith(
        "Pour marquer un devis comme 'Envoyé', vous devez obligatoirement renseigner une date de validité ET un document PDF."
      );
      expect(saveResult).toBe(false);
    });

    it("devrait valider que le document est renseigné pour SENT", async () => {
      const updatedData = {
        status: "SENT",
        quoteValidUntil: "2024-12-31",
        quoteDocument: "",
      };

      const { result } = renderHook(() => useQuotes());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.handleSaveQuote(
          mockQuote,
          updatedData
        );
      });

      expect(mockedShowError).toHaveBeenCalledWith(
        "Pour marquer un devis comme 'Envoyé', vous devez obligatoirement renseigner une date de validité ET un document PDF."
      );
      expect(saveResult).toBe(false);
    });

    it("devrait filtrer les champs vides", async () => {
      const updatedData = {
        status: "PROCESSING",
        quoteValidUntil: "   ", // espaces seulement
        quoteDocument: "",
        rejectionReason: "   ",
      };

      mockedBackofficeApi.updateQuote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.handleSaveQuote(mockQuote, updatedData);
      });

      expect(mockedBackofficeApi.updateQuote).toHaveBeenCalledWith("quote-1", {
        status: "PROCESSING",
      });
    });

    it("devrait gérer les erreurs lors de la sauvegarde", async () => {
      const updatedData = {
        status: "PROCESSING",
      };

      const mockError = new Error("Erreur sauvegarde");
      mockedBackofficeApi.updateQuote.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useQuotes());

      let saveResult: boolean = false;
      await act(async () => {
        saveResult = await result.current.handleSaveQuote(
          mockQuote,
          updatedData
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour du devis:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors de la mise à jour du devis"
      );
      expect(saveResult).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("confirmAcceptQuote", () => {
    const mockQuote = {
      id: "quote-1",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@example.com",
      message: "Demande de devis",
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contactId: "contact-1",
      projectDescription: "Description du projet",
      acceptPhone: true,
      acceptTerms: true,
      contact: {
        id: "contact-1",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@example.com",
        phone: "0123456789",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    beforeEach(() => {
      mockedBackofficeApi.getQuotes.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });
      mockedBackofficeApi.getQuotesStats.mockResolvedValue({});
    });

    it("devrait accepter un devis avec succès", async () => {
      const acceptData = {
        document: "document.pdf",
        validUntil: "2024-12-31",
      };

      mockedBackofficeApi.acceptQuote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotes());

      let acceptResult: boolean = false;
      await act(async () => {
        acceptResult = await result.current.confirmAcceptQuote(
          mockQuote,
          acceptData
        );
      });

      expect(mockedBackofficeApi.acceptQuote).toHaveBeenCalledWith(
        "quote-1",
        acceptData
      );
      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Devis accepté avec succès. Un email a été envoyé au client."
      );
      expect(mockedBackofficeApi.getQuotes).toHaveBeenCalled();
      expect(mockedBackofficeApi.getQuotesStats).toHaveBeenCalled();
      expect(acceptResult).toBe(true);
    });

    it("devrait filtrer les champs vides lors de l'acceptation", async () => {
      const acceptData = {
        document: "   ", // espaces seulement
        validUntil: "",
      };

      mockedBackofficeApi.acceptQuote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotes());

      await act(async () => {
        await result.current.confirmAcceptQuote(mockQuote, acceptData);
      });

      expect(mockedBackofficeApi.acceptQuote).toHaveBeenCalledWith(
        "quote-1",
        {}
      );
    });

    it("devrait gérer les erreurs lors de l'acceptation", async () => {
      const acceptData = {
        document: "document.pdf",
        validUntil: "2024-12-31",
      };

      const mockError = new Error("Erreur acceptation");
      mockedBackofficeApi.acceptQuote.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useQuotes());

      let acceptResult: boolean = false;
      await act(async () => {
        acceptResult = await result.current.confirmAcceptQuote(
          mockQuote,
          acceptData
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de l'acceptation du devis:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors de l'acceptation du devis"
      );
      expect(acceptResult).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("confirmRejectQuote", () => {
    const mockQuote = {
      id: "quote-1",
      firstName: "Jean",
      lastName: "Dupont",
      email: "jean@example.com",
      message: "Demande de devis",
      status: "PENDING" as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      contactId: "contact-1",
      projectDescription: "Description du projet",
      acceptPhone: true,
      acceptTerms: true,
      contact: {
        id: "contact-1",
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@example.com",
        phone: "0123456789",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };

    beforeEach(() => {
      mockedBackofficeApi.getQuotes.mockResolvedValue({
        data: [],
        total: 0,
        page: 1,
        limit: 50,
      });
      mockedBackofficeApi.getQuotesStats.mockResolvedValue({});
    });

    it("devrait rejeter un devis avec succès", async () => {
      const rejectData = {
        rejectionReason: "Prix trop élevé",
      };

      mockedBackofficeApi.rejectQuote.mockResolvedValue(undefined);

      const { result } = renderHook(() => useQuotes());

      let rejectResult: boolean = false;
      await act(async () => {
        rejectResult = await result.current.confirmRejectQuote(
          mockQuote,
          rejectData
        );
      });

      expect(mockedBackofficeApi.rejectQuote).toHaveBeenCalledWith(
        "quote-1",
        rejectData
      );
      expect(mockedShowSuccess).toHaveBeenCalledWith(
        "Devis rejeté avec succès. Un email a été envoyé au client."
      );
      expect(mockedBackofficeApi.getQuotes).toHaveBeenCalled();
      expect(mockedBackofficeApi.getQuotesStats).toHaveBeenCalled();
      expect(rejectResult).toBe(true);
    });

    it("devrait gérer les erreurs lors du rejet", async () => {
      const rejectData = {
        rejectionReason: "Prix trop élevé",
      };

      const mockError = new Error("Erreur rejet");
      mockedBackofficeApi.rejectQuote.mockRejectedValue(mockError);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const { result } = renderHook(() => useQuotes());

      let rejectResult: boolean = false;
      await act(async () => {
        rejectResult = await result.current.confirmRejectQuote(
          mockQuote,
          rejectData
        );
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors du rejet du devis:",
        mockError
      );
      expect(mockedShowError).toHaveBeenCalledWith(
        "Erreur lors du rejet du devis"
      );
      expect(rejectResult).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe("getQuoteStatusLabel", () => {
    it("devrait retourner les bons labels pour chaque statut", () => {
      const { result } = renderHook(() => useQuotes());

      expect(result.current.getQuoteStatusLabel("PENDING")).toBe("En attente");
      expect(result.current.getQuoteStatusLabel("PROCESSING")).toBe("En cours");
      expect(result.current.getQuoteStatusLabel("SENT")).toBe("Envoyé");
      expect(result.current.getQuoteStatusLabel("ACCEPTED")).toBe("Accepté");
      expect(result.current.getQuoteStatusLabel("REJECTED")).toBe("Refusé");
      expect(result.current.getQuoteStatusLabel("EXPIRED")).toBe("Expiré");
      expect(result.current.getQuoteStatusLabel("UNKNOWN")).toBe("UNKNOWN");
    });
  });

  describe("getQuoteStatusColor", () => {
    it("devrait retourner les bonnes classes CSS pour chaque statut", () => {
      const { result } = renderHook(() => useQuotes());

      expect(result.current.getQuoteStatusColor("PENDING")).toBe(
        "status-pending"
      );
      expect(result.current.getQuoteStatusColor("PROCESSING")).toBe(
        "status-processing"
      );
      expect(result.current.getQuoteStatusColor("SENT")).toBe("status-sent");
      expect(result.current.getQuoteStatusColor("ACCEPTED")).toBe(
        "status-accepted"
      );
      expect(result.current.getQuoteStatusColor("REJECTED")).toBe(
        "status-rejected"
      );
      expect(result.current.getQuoteStatusColor("EXPIRED")).toBe(
        "status-expired"
      );
      expect(result.current.getQuoteStatusColor("UNKNOWN")).toBe("");
    });
  });
});
