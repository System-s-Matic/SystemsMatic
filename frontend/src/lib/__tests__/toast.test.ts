import { toast } from "react-toastify";
import {
  toastConfig,
  showSuccess,
  showError,
  showInfo,
  showWarning,
  showLoading,
  updateLoadingToast,
} from "../toast";

// Mock react-toastify
jest.mock("react-toastify", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    loading: jest.fn(),
    update: jest.fn(),
  },
}));

const mockedToast = toast as jest.Mocked<typeof toast>;

describe("Toast Utils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Configuration", () => {
    it("devrait avoir une configuration par défaut", () => {
      expect(toastConfig).toEqual({
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    });

    it("devrait avoir les bonnes valeurs de configuration", () => {
      expect(toastConfig.position).toBe("top-right");
      expect(toastConfig.autoClose).toBe(5000);
      expect(toastConfig.hideProgressBar).toBe(false);
      expect(toastConfig.closeOnClick).toBe(true);
      expect(toastConfig.pauseOnHover).toBe(true);
      expect(toastConfig.draggable).toBe(true);
    });
  });

  describe("showSuccess", () => {
    it("devrait appeler toast.success avec le bon message", () => {
      const message = "Opération réussie";
      showSuccess(message);

      expect(mockedToast.success).toHaveBeenCalledWith(message, toastConfig);
    });

    it("devrait appeler toast.success avec la configuration", () => {
      const message = "Test message";
      showSuccess(message);

      expect(mockedToast.success).toHaveBeenCalledWith(message, toastConfig);
    });
  });

  describe("showError", () => {
    it("devrait appeler toast.error avec le bon message", () => {
      const message = "Une erreur s'est produite";
      showError(message);

      expect(mockedToast.error).toHaveBeenCalledWith(message, toastConfig);
    });
  });

  describe("showInfo", () => {
    it("devrait appeler toast.info avec le bon message", () => {
      const message = "Information importante";
      showInfo(message);

      expect(mockedToast.info).toHaveBeenCalledWith(message, toastConfig);
    });
  });

  describe("showWarning", () => {
    it("devrait appeler toast.warning avec le bon message", () => {
      const message = "Attention requise";
      showWarning(message);

      expect(mockedToast.warning).toHaveBeenCalledWith(message, toastConfig);
    });
  });

  describe("showLoading", () => {
    it("devrait appeler toast.loading avec le bon message", () => {
      const message = "Chargement en cours...";
      const mockToastId = "loading-toast-123";
      mockedToast.loading.mockReturnValue(mockToastId);

      const result = showLoading(message);

      expect(mockedToast.loading).toHaveBeenCalledWith(message, toastConfig);
      expect(result).toBe(mockToastId);
    });
  });

  describe("updateLoadingToast", () => {
    it("devrait appeler toast.update avec les bons paramètres pour un succès", () => {
      const toastId = "loading-toast-123";
      const message = "Opération terminée";
      const type = "success";

      updateLoadingToast(toastId, message, type);

      expect(mockedToast.update).toHaveBeenCalledWith(toastId, {
        render: message,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    });

    it("devrait appeler toast.update avec les bons paramètres pour une erreur", () => {
      const toastId = "loading-toast-123";
      const message = "Erreur lors de l'opération";
      const type = "error";

      updateLoadingToast(toastId, message, type);

      expect(mockedToast.update).toHaveBeenCalledWith(toastId, {
        render: message,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });
    });

    it("devrait appeler toast.update avec les bons paramètres pour une info", () => {
      const toastId = "loading-toast-123";
      const message = "Information";
      const type = "info";

      updateLoadingToast(toastId, message, type);

      expect(mockedToast.update).toHaveBeenCalledWith(toastId, {
        render: message,
        type: "info",
        isLoading: false,
        autoClose: 5000,
      });
    });

    it("devrait utiliser 'success' comme type par défaut", () => {
      const toastId = "loading-toast-123";
      const message = "Message par défaut";

      updateLoadingToast(toastId, message);

      expect(mockedToast.update).toHaveBeenCalledWith(toastId, {
        render: message,
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });
    });
  });

  describe("Types de messages", () => {
    it("devrait gérer des messages vides", () => {
      showSuccess("");
      showError("");
      showInfo("");
      showWarning("");

      expect(mockedToast.success).toHaveBeenCalledWith("", toastConfig);
      expect(mockedToast.error).toHaveBeenCalledWith("", toastConfig);
      expect(mockedToast.info).toHaveBeenCalledWith("", toastConfig);
      expect(mockedToast.warning).toHaveBeenCalledWith("", toastConfig);
    });

    it("devrait gérer des messages avec des caractères spéciaux", () => {
      const specialMessage = "Message avec des caractères spéciaux: éàçù€£";

      showSuccess(specialMessage);
      expect(mockedToast.success).toHaveBeenCalledWith(
        specialMessage,
        toastConfig
      );
    });
  });
});
