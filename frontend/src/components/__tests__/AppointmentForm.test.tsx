import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentForm from "../AppointmentForm";
import {
  CreateAppointmentDto,
  AppointmentReason,
} from "../../types/appointment";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

// Mock des dépendances
jest.mock("../../lib/date-utils", () => ({
  getUserTimezone: () => "Europe/Paris",
}));

jest.mock("../../lib/validation", () => ({
  sanitizers: {
    // On retourne simplement les données sans les modifier,
    // en gardant une signature compatible avec CreateAppointmentDto
    form: (data: CreateAppointmentDto) => data,
  },
}));

jest.mock("../../lib/toast", () => ({
  showError: jest.fn(),
}));

jest.mock("../NativeDateTimePicker", () => {
  interface MockNativeDateTimePickerProps {
    value: Date | null;
    onChange: (date: Date | null) => void;
    className?: string;
    error?: boolean;
  }

  return function MockNativeDateTimePicker({
    value,
    onChange,
    className,
    error,
  }: MockNativeDateTimePickerProps) {
    return (
      <div
        data-testid="native-datetime-picker"
        className={className}
        data-error={error}
      >
        <input
          type="datetime-local"
          value={value ? new Date(value).toISOString().slice(0, 16) : ""}
          onChange={(e) => onChange(new Date(e.target.value))}
          data-testid="datetime-input"
        />
      </div>
    );
  };
});

describe("AppointmentForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher le formulaire de rendez-vous", () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    expect(
      screen.getByRole("heading", { name: /Demander un rendez-vous/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Choisissez votre créneau préféré et nous vous confirmerons la disponibilité/i
      )
    ).toBeInTheDocument();
  });

  it("devrait afficher tous les champs du formulaire", () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/Prénom/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^Nom$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Téléphone/i)).toBeInTheDocument();
    expect(screen.getByText(/Date et heure souhaitées/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Motif du rendez-vous/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Message/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/J'accepte que mes données/i)
    ).toBeInTheDocument();
  });

  it("devrait afficher les options de motif", () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    const reasonSelect = screen.getByLabelText(/Motif du rendez-vous/i);
    expect(reasonSelect).toBeInTheDocument();

    expect(screen.getByText(/Diagnostic/i)).toBeInTheDocument();
    expect(screen.getByText(/Installation/i)).toBeInTheDocument();
    expect(screen.getByText(/Maintenance/i)).toBeInTheDocument();
    expect(screen.getByText(/Autre/i)).toBeInTheDocument();
  });

  it("devrait afficher le champ 'Autre' quand AUTRE est sélectionné", async () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    const reasonSelect = screen.getByLabelText(/Motif du rendez-vous/i);
    await userEvent.selectOptions(reasonSelect, AppointmentReason.AUTRE);

    expect(screen.getByLabelText(/Précisez le motif/i)).toBeInTheDocument();
  });

  it("devrait masquer le champ 'Autre' quand un autre motif est sélectionné", async () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    const reasonSelect = screen.getByLabelText(/Motif du rendez-vous/i);

    // Sélectionner AUTRE d'abord
    await userEvent.selectOptions(reasonSelect, AppointmentReason.AUTRE);
    expect(screen.getByLabelText(/Précisez le motif/i)).toBeInTheDocument();

    // Puis sélectionner DIAGNOSTIC
    await userEvent.selectOptions(reasonSelect, AppointmentReason.DIAGNOSTIC);
    expect(
      screen.queryByLabelText(/Précisez le motif/i)
    ).not.toBeInTheDocument();
  });

  it("devrait afficher les erreurs de validation", async () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole("button", {
      name: /Envoyer la demande de rendez-vous/i,
    });
    await userEvent.click(submitButton);

    expect(screen.getByText(/Le prénom est requis/i)).toBeInTheDocument();
    expect(screen.getByText(/Le nom est requis/i)).toBeInTheDocument();
    expect(screen.getByText(/L'email est requis/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Vous devez accepter les conditions/i)
    ).toBeInTheDocument();
  });

  it("devrait valider le format email", async () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    const emailInput = screen.getByLabelText(/Email/i);
    await userEvent.type(emailInput, "email-invalide");

    const submitButton = screen.getByRole("button", {
      name: /Envoyer la demande de rendez-vous/i,
    });
    await userEvent.click(submitButton);

    expect(screen.getByText(/Adresse email invalide/i)).toBeInTheDocument();
  });

  it("devrait soumettre le formulaire avec des données valides", async () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    // Remplir le formulaire
    await userEvent.type(screen.getByLabelText(/Prénom/i), "Jean");
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Nom$/i }),
      "Dupont"
    );
    await userEvent.type(screen.getByLabelText(/Email/i), "jean@example.com");
    await userEvent.type(screen.getByLabelText(/Téléphone/i), "0123456789");

    // Sélectionner une date
    const dateTimeInput = screen.getByTestId("datetime-input");
    await userEvent.type(dateTimeInput, "2024-01-15T10:00");

    await userEvent.selectOptions(
      screen.getByLabelText(/Motif du rendez-vous/i),
      AppointmentReason.DIAGNOSTIC
    );
    await userEvent.type(screen.getByLabelText(/Message/i), "Test message");
    await userEvent.click(screen.getByLabelText(/J'accepte que mes données/i));

    const submitButton = screen.getByRole("button", {
      name: /Envoyer la demande de rendez-vous/i,
    });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  it("devrait afficher l'état de chargement pendant la soumission", async () => {
    mockOnSubmit.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    // Remplir le formulaire
    await userEvent.type(screen.getByLabelText(/Prénom/i), "Jean");
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Nom$/i }),
      "Dupont"
    );
    await userEvent.type(screen.getByLabelText(/Email/i), "jean@example.com");
    await userEvent.click(screen.getByLabelText(/J'accepte que mes données/i));

    // Simuler la sélection d'une date
    const dateInput = screen.getByTestId("datetime-input");
    fireEvent.change(dateInput, { target: { value: "2024-01-15T10:00" } });

    const submitButton = screen.getByRole("button", {
      name: /Envoyer la demande de rendez-vous/i,
    });
    await userEvent.click(submitButton);

    expect(screen.getByText(/Envoi en cours\.\.\./i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });

  it("devrait réinitialiser le formulaire après soumission réussie", async () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    // Remplir le formulaire
    await userEvent.type(screen.getByLabelText(/Prénom/i), "Jean");
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Nom$/i }),
      "Dupont"
    );
    await userEvent.type(screen.getByLabelText(/Email/i), "jean@example.com");
    await userEvent.click(screen.getByLabelText(/J'accepte que mes données/i));

    // Simuler la sélection d'une date
    const dateInput = screen.getByTestId("datetime-input");
    fireEvent.change(dateInput, { target: { value: "2024-01-15T10:00" } });

    const submitButton = screen.getByRole("button", {
      name: /Envoyer la demande de rendez-vous/i,
    });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/Prénom/i)).toHaveValue("");
      expect(screen.getByRole("textbox", { name: /^Nom$/i })).toHaveValue("");
      expect(screen.getByLabelText(/Email/i)).toHaveValue("");
    });
  });

  it("devrait afficher les informations d'aide", () => {
    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    expect(
      screen.getByText(
        /Choisissez votre créneau préféré \(à partir du lendemain/i
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/Créneaux disponibles/i)).toBeInTheDocument();
  });

  it("devrait gérer les erreurs de soumission", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    mockOnSubmit.mockRejectedValue(new Error("Erreur de soumission"));

    render(<AppointmentForm onSubmit={mockOnSubmit} />);

    // Remplir le formulaire
    await userEvent.type(screen.getByLabelText(/Prénom/i), "Jean");
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Nom$/i }),
      "Dupont"
    );
    await userEvent.type(screen.getByLabelText(/Email/i), "jean@example.com");
    await userEvent.click(screen.getByLabelText(/J'accepte que mes données/i));

    // Simuler la sélection d'une date
    const dateInput = screen.getByTestId("datetime-input");
    fireEvent.change(dateInput, { target: { value: "2024-01-15T10:00" } });

    const submitButton = screen.getByRole("button", {
      name: /Envoyer la demande de rendez-vous/i,
    });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        "Erreur lors de la soumission du formulaire:",
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });
});
