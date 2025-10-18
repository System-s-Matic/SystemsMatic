import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppointmentsSection from "../AppointmentsSection";
import {
  Appointment,
  AppointmentStatus,
  AppointmentReason,
} from "../../types/appointment";
import { backofficeApi } from "../../lib/backoffice-api";

// Mock des dépendances
jest.mock("../../lib/backoffice-api", () => ({
  backofficeApi: {
    proposeReschedule: jest.fn(),
  },
}));

jest.mock("../../lib/toast", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn(),
}));

jest.mock("../../lib/date-utils", () => ({
  formatGuadeloupeDateTime: (date: string) => `formatted-${date}`,
}));

jest.mock("../AdminDateTimePicker", () => {
  return function MockAdminDateTimePicker({
    value,
    onChange,
    onConfirm,
    onCancel,
  }: any) {
    return (
      <div data-testid="admin-datetime-picker">
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid="datetime-input"
        />
        <button onClick={onConfirm} data-testid="confirm-button">
          Confirmer
        </button>
        <button onClick={onCancel} data-testid="cancel-button">
          Annuler
        </button>
      </div>
    );
  };
});

const mockAppointment: Appointment = {
  id: "appointment-1",
  contactId: "contact-1",
  status: AppointmentStatus.PENDING,
  requestedAt: new Date("2024-01-15T10:00:00.000Z"),
  scheduledAt: undefined,
  timezone: "Europe/Paris",
  confirmationToken: "confirmation-token",
  cancellationToken: "cancellation-token",
  createdAt: new Date("2024-01-15T09:00:00.000Z"),
  updatedAt: new Date("2024-01-15T09:00:00.000Z"),
  contact: {
    id: "contact-1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean@example.com",
    phone: "0123456789",
    createdAt: new Date("2024-01-15T09:00:00.000Z"),
    updatedAt: new Date("2024-01-15T09:00:00.000Z"),
  },
  message: "Test message",
  reason: AppointmentReason.DIAGNOSTIC,
  reasonOther: undefined,
};

const baseProps = {
  appointments: [mockAppointment],
  loading: false,
  updateAppointmentStatus: jest.fn(),
  deleteAppointment: jest.fn(),
  sendReminder: jest.fn(),
  getStatusLabel: (status: AppointmentStatus) => `Label-${status}`,
  getStatusColor: (status: AppointmentStatus) => `color-${status}`,
  refreshAppointments: jest.fn(),
};

describe("AppointmentsSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher le spinner de chargement", () => {
    render(<AppointmentsSection {...baseProps} loading={true} />);

    expect(screen.getByText(/Chargement des rendez-vous/i)).toBeInTheDocument();
  });

  it("devrait afficher le message quand aucun rendez-vous", () => {
    render(<AppointmentsSection {...baseProps} appointments={[]} />);

    expect(screen.getByText(/Aucun rendez-vous trouvé/i)).toBeInTheDocument();
  });

  it("devrait afficher les informations d'un rendez-vous", () => {
    render(<AppointmentsSection {...baseProps} />);

    expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
    expect(screen.getByText(/jean@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/0123456789/i)).toBeInTheDocument();
    expect(screen.getByText(/Test message/i)).toBeInTheDocument();
  });

  it("devrait afficher les boutons d'action pour un rendez-vous PENDING", () => {
    render(<AppointmentsSection {...baseProps} />);

    expect(screen.getByText(/Confirmer/i)).toBeInTheDocument();
    expect(screen.getByText(/Reprogrammer/i)).toBeInTheDocument();
    expect(screen.getByText(/Rejeter/i)).toBeInTheDocument();
    expect(screen.getByText(/Supprimer/i)).toBeInTheDocument();
  });

  it("devrait afficher le bouton 'Marquer comme terminé' pour un rendez-vous CONFIRMED", () => {
    const confirmedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CONFIRMED,
    };
    render(
      <AppointmentsSection
        {...baseProps}
        appointments={[confirmedAppointment]}
      />
    );

    expect(screen.getByText(/Marquer comme terminé/i)).toBeInTheDocument();
  });

  it("devrait afficher le bouton 'Envoyer un rappel' pour un rendez-vous CONFIRMED avec scheduledAt", () => {
    const confirmedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: new Date("2024-01-16T10:00:00.000Z"),
    };
    render(
      <AppointmentsSection
        {...baseProps}
        appointments={[confirmedAppointment]}
      />
    );

    expect(screen.getByText(/Envoyer un rappel/i)).toBeInTheDocument();
  });

  it("devrait appeler updateAppointmentStatus quand on clique sur Confirmer", () => {
    render(<AppointmentsSection {...baseProps} />);

    fireEvent.click(screen.getByText(/Confirmer/i));
    expect(baseProps.updateAppointmentStatus).toHaveBeenCalledWith(
      "appointment-1",
      AppointmentStatus.CONFIRMED
    );
  });

  it("devrait appeler updateAppointmentStatus quand on clique sur Rejeter", () => {
    render(<AppointmentsSection {...baseProps} />);

    fireEvent.click(screen.getByText(/Rejeter/i));
    expect(baseProps.updateAppointmentStatus).toHaveBeenCalledWith(
      "appointment-1",
      AppointmentStatus.REJECTED
    );
  });

  it("devrait appeler updateAppointmentStatus quand on clique sur Marquer comme terminé", () => {
    const confirmedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CONFIRMED,
    };
    render(
      <AppointmentsSection
        {...baseProps}
        appointments={[confirmedAppointment]}
      />
    );

    fireEvent.click(screen.getByText(/Marquer comme terminé/i));
    expect(baseProps.updateAppointmentStatus).toHaveBeenCalledWith(
      "appointment-1",
      AppointmentStatus.COMPLETED
    );
  });

  it("devrait appeler sendReminder quand on clique sur Envoyer un rappel", () => {
    const confirmedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CONFIRMED,
      scheduledAt: new Date("2024-01-16T10:00:00.000Z"),
    };
    render(
      <AppointmentsSection
        {...baseProps}
        appointments={[confirmedAppointment]}
      />
    );

    fireEvent.click(screen.getByText(/Envoyer un rappel/i));
    expect(baseProps.sendReminder).toHaveBeenCalledWith("appointment-1");
  });

  it("devrait appeler deleteAppointment quand on clique sur Supprimer", () => {
    render(<AppointmentsSection {...baseProps} />);

    fireEvent.click(screen.getByText(/Supprimer/i));
    expect(baseProps.deleteAppointment).toHaveBeenCalledWith("appointment-1");
  });

  it("devrait ouvrir le sélecteur de date quand on clique sur Reprogrammer", () => {
    render(<AppointmentsSection {...baseProps} />);

    fireEvent.click(screen.getByText(/Reprogrammer/i));
    expect(screen.getByTestId("admin-datetime-picker")).toBeInTheDocument();
  });

  it("devrait fermer le sélecteur de date quand on clique sur Annuler", () => {
    render(<AppointmentsSection {...baseProps} />);

    // Ouvrir le sélecteur
    fireEvent.click(screen.getByText(/Reprogrammer/i));
    expect(screen.getByTestId("admin-datetime-picker")).toBeInTheDocument();

    // Fermer le sélecteur
    fireEvent.click(screen.getByTestId("cancel-button"));
    expect(
      screen.queryByTestId("admin-datetime-picker")
    ).not.toBeInTheDocument();
  });

  it("devrait proposer une reprogrammation avec succès", async () => {
    const mockedBackofficeApi = backofficeApi as jest.Mocked<
      typeof backofficeApi
    >;
    mockedBackofficeApi.proposeReschedule.mockResolvedValue(undefined);

    render(<AppointmentsSection {...baseProps} />);

    // Ouvrir le sélecteur
    fireEvent.click(screen.getByText(/Reprogrammer/i));

    // Sélectionner une date
    const dateTimeInput = screen.getByTestId("datetime-input");
    fireEvent.change(dateTimeInput, { target: { value: "2024-01-16T14:00" } });

    // Confirmer
    fireEvent.click(screen.getByTestId("confirm-button"));

    await waitFor(() => {
      expect(mockedBackofficeApi.proposeReschedule).toHaveBeenCalledWith(
        "appointment-1",
        "2024-01-16T14:00"
      );
    });
  });

  it("devrait gérer les erreurs lors de la reprogrammation", async () => {
    const mockedBackofficeApi = backofficeApi as jest.Mocked<
      typeof backofficeApi
    >;
    mockedBackofficeApi.proposeReschedule.mockRejectedValue(
      new Error("Erreur de reprogrammation")
    );

    render(<AppointmentsSection {...baseProps} />);

    // Ouvrir le sélecteur
    fireEvent.click(screen.getByText(/Reprogrammer/i));

    // Sélectionner une date
    const dateTimeInput = screen.getByTestId("datetime-input");
    fireEvent.change(dateTimeInput, { target: { value: "2024-01-16T14:00" } });

    // Confirmer
    fireEvent.click(screen.getByTestId("confirm-button"));

    await waitFor(() => {
      expect(mockedBackofficeApi.proposeReschedule).toHaveBeenCalled();
    });
  });

  it("devrait afficher les informations de reprogrammation", () => {
    render(<AppointmentsSection {...baseProps} />);

    // Ouvrir le sélecteur
    fireEvent.click(screen.getByText(/Reprogrammer/i));

    expect(
      screen.getByText(/Proposer une reprogrammation/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Le client recevra un email/i)).toBeInTheDocument();
  });

  it("devrait afficher 'Non renseigné' pour le téléphone quand il est absent", () => {
    const appointmentWithoutPhone = {
      ...mockAppointment,
      contact: { ...mockAppointment.contact, phone: undefined },
    };
    render(
      <AppointmentsSection
        {...baseProps}
        appointments={[appointmentWithoutPhone]}
      />
    );

    expect(screen.getByText(/Non renseigné/i)).toBeInTheDocument();
  });

  it("devrait afficher la date programmée quand elle existe", () => {
    const appointmentWithScheduled = {
      ...mockAppointment,
      scheduledAt: new Date("2024-01-16T10:00:00.000Z"),
    };
    render(
      <AppointmentsSection
        {...baseProps}
        appointments={[appointmentWithScheduled]}
      />
    );

    expect(screen.getByText(/Programmé le/i)).toBeInTheDocument();
  });

  it("devrait ne pas afficher la date programmée quand elle n'existe pas", () => {
    render(<AppointmentsSection {...baseProps} />);

    expect(screen.queryByText(/Programmé le/i)).not.toBeInTheDocument();
  });

  it("devrait appliquer les bonnes classes CSS selon le statut", () => {
    render(<AppointmentsSection {...baseProps} />);

    const appointmentCard = screen
      .getByText(/Jean Dupont/i)
      .closest(".appointment-card");
    expect(appointmentCard).toHaveClass("color-PENDING");
  });
});
