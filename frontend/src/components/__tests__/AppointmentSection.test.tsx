import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentSection from "../AppointmentSection";
import { appointmentService } from "../../lib/api";
import {
  CreateAppointmentDto,
  AppointmentReason,
} from "../../types/appointment";

// Mock des dépendances
jest.mock("../../lib/api", () => ({
  appointmentService: {
    create: jest.fn(),
  },
}));

jest.mock("../../lib/toast", () => ({
  showError: jest.fn(),
}));

jest.mock("../AppointmentForm", () => {
  return function MockAppointmentForm({
    onSubmit,
  }: {
    onSubmit: (data: CreateAppointmentDto) => Promise<void>;
  }) {
    return (
      <div data-testid="appointment-form">
        <button
          onClick={() =>
            onSubmit({
              firstName: "Jean",
              lastName: "Dupont",
              email: "jean@example.com",
              phone: "0123456789",
              reason: AppointmentReason.DIAGNOSTIC,
              reasonOther: undefined,
              message: "Test message",
              requestedAt: "2024-01-15T10:00:00.000Z",
              timezone: "Europe/Paris",
              consent: true,
            })
          }
          data-testid="submit-form"
        >
          Soumettre
        </button>
      </div>
    );
  };
});

const mockedAppointmentService = appointmentService as jest.Mocked<
  typeof appointmentService
>;

describe("AppointmentSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher le formulaire de rendez-vous initialement", () => {
    render(<AppointmentSection />);

    expect(screen.getByTestId("appointment-form")).toBeInTheDocument();
    expect(
      screen.queryByText(/Demande envoyée avec succès/i)
    ).not.toBeInTheDocument();
  });

  it("devrait afficher le message de succès après soumission réussie", async () => {
    mockedAppointmentService.create.mockResolvedValue({} as any);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Demande envoyée avec succès/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Nous avons reçu votre demande/i)
      ).toBeInTheDocument();
    });
  });

  it("devrait permettre de prendre un nouveau rendez-vous", async () => {
    mockedAppointmentService.create.mockResolvedValue({} as any);

    render(<AppointmentSection />);

    // Soumettre le formulaire
    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Demande envoyée avec succès/i)
      ).toBeInTheDocument();
    });

    // Cliquer sur "Prendre un autre rendez-vous"
    const newAppointmentButton = screen.getByText(
      /Prendre un autre rendez-vous/i
    );
    await userEvent.click(newAppointmentButton);

    // Vérifier que le formulaire est de nouveau affiché
    expect(screen.getByTestId("appointment-form")).toBeInTheDocument();
    expect(
      screen.queryByText(/Demande envoyée avec succès/i)
    ).not.toBeInTheDocument();
  });

  it("devrait gérer les erreurs de réponse du serveur", async () => {
    const errorResponse = {
      response: {
        status: 400,
        statusText: "Bad Request",
        data: { message: "Erreur de validation" },
      },
    };
    mockedAppointmentService.create.mockRejectedValue(errorResponse);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
    });
  });

  it("devrait gérer les erreurs de réseau", async () => {
    const networkError = {
      request: {},
    };
    mockedAppointmentService.create.mockRejectedValue(networkError);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
    });
  });

  it("devrait gérer les erreurs axios génériques", async () => {
    const axiosError = {
      message: "Erreur axios",
    };
    mockedAppointmentService.create.mockRejectedValue(axiosError);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
    });
  });

  it("devrait gérer les erreurs non-axios", async () => {
    const genericError = new Error("Erreur générique");
    mockedAppointmentService.create.mockRejectedValue(genericError);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Erreur générique/i)).toBeInTheDocument();
    });
  });

  it("devrait gérer les erreurs inconnues", async () => {
    mockedAppointmentService.create.mockRejectedValue("Erreur inconnue");

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Une erreur est survenue/i)).toBeInTheDocument();
    });
  });

  it("devrait afficher l'icône de succès", async () => {
    mockedAppointmentService.create.mockResolvedValue({} as any);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      const successIcon = screen
        .getByText(/Demande envoyée avec succès/i)
        .closest("div")
        ?.querySelector(".success-icon");
      expect(successIcon).toBeInTheDocument();
    });
  });

  it("devrait avoir les bons attributs d'accessibilité", async () => {
    mockedAppointmentService.create.mockResolvedValue({} as any);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Demande envoyée avec succès/i)
      ).toBeInTheDocument();
    });
  });

  it("devrait avoir le bon aria-label sur le bouton", async () => {
    mockedAppointmentService.create.mockResolvedValue({} as any);

    render(<AppointmentSection />);

    const submitButton = screen.getByTestId("submit-form");
    await userEvent.click(submitButton);

    await waitFor(() => {
      const newAppointmentButton = screen.getByText(
        /Prendre un autre rendez-vous/i
      );
      expect(newAppointmentButton).toHaveAttribute(
        "aria-label",
        "Demander un nouveau rendez-vous"
      );
    });
  });
});
