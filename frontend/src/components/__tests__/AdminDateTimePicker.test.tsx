import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminDateTimePicker from "../AdminDateTimePicker";

// Mock de la fonction de date
jest.mock("../../lib/date-utils", () => ({
  getCurrentGuadeloupeTime: () => ({
    add: (amount: number, unit: string) => ({
      format: (format: string) => {
        if (format === "YYYY-MM-DD") {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + amount);
          return tomorrow.toISOString().split("T")[0];
        }
        return "2024-01-01";
      },
    }),
  }),
}));

describe("AdminDateTimePicker", () => {
  const mockOnChange = jest.fn();
  const mockOnConfirm = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher les champs de date et heure", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Heure/i)).toBeInTheDocument();
  });

  it("devrait afficher les créneaux horaires disponibles", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const timeSelect = screen.getByLabelText(/Heure/i);
    expect(timeSelect).toBeInTheDocument();

    // Vérifier que les créneaux du matin sont présents
    expect(screen.getByText("08:00")).toBeInTheDocument();
    expect(screen.getByText("08:30")).toBeInTheDocument();
    expect(screen.getByText("11:00")).toBeInTheDocument();
    expect(screen.getByText("11:30")).toBeInTheDocument();

    // Vérifier que les créneaux de l'après-midi sont présents
    expect(screen.getByText("14:00")).toBeInTheDocument();
    expect(screen.getByText("14:30")).toBeInTheDocument();
    expect(screen.getByText("17:00")).toBeInTheDocument();
  });

  it("devrait appeler onChange quand la date change", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getByLabelText(/Date/i);
    fireEvent.change(dateInput, { target: { value: "2024-01-15" } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("devrait appeler onChange quand l'heure change", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const timeSelect = screen.getByLabelText(/Heure/i);
    fireEvent.change(timeSelect, { target: { value: "10:00" } });

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("devrait combiner date et heure dans onChange", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    fireEvent.change(dateInput, { target: { value: "2024-01-15" } });
    fireEvent.change(timeSelect, { target: { value: "10:00" } });

    expect(mockOnChange).toHaveBeenCalledWith("2024-01-15T10:00:00.000");
  });

  it("devrait initialiser avec une valeur fournie", () => {
    const testValue = "2024-01-15T11:30:00.000";
    render(
      <AdminDateTimePicker
        value={testValue}
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    expect(dateInput).toHaveValue("2024-01-15");
    expect(timeSelect).toHaveValue("11:30");
  });

  it("devrait afficher la date sélectionnée quand value est fournie", () => {
    const testValue = "2024-01-15T10:30:00.000Z";
    render(
      <AdminDateTimePicker
        value={testValue}
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Date sélectionnée/i)).toBeInTheDocument();
  });

  it("devrait afficher les contraintes", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    expect(screen.getByText(/Contraintes/i)).toBeInTheDocument();
    expect(screen.getByText(/Minimum 24h à l'avance/i)).toBeInTheDocument();
    expect(screen.getByText(/Créneaux disponibles/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum 1 mois à l'avance/i)).toBeInTheDocument();
  });

  it("devrait appeler onConfirm quand on clique sur Proposer", () => {
    render(
      <AdminDateTimePicker
        value="2024-01-15T10:00:00.000"
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText(/Proposer/i);
    fireEvent.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it("devrait appeler onCancel quand on clique sur Annuler", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const cancelButton = screen.getByText(/Annuler/i);
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("devrait désactiver le bouton Proposer quand value est vide", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText(/Proposer/i);
    expect(confirmButton).toBeDisabled();
  });

  it("devrait activer le bouton Proposer quand value est fournie", () => {
    render(
      <AdminDateTimePicker
        value="2024-01-15T10:00:00.000"
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const confirmButton = screen.getByText(/Proposer/i);
    expect(confirmButton).not.toBeDisabled();
  });

  it("devrait appliquer la classe CSS personnalisée", () => {
    const customClass = "custom-picker";
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        className={customClass}
      />
    );

    const container = screen
      .getByText("Contraintes :")
      .closest(".admin-datetime-picker");
    expect(container).toHaveClass("admin-datetime-picker", customClass);
  });

  it("devrait avoir les attributs min et max sur le champ date", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getByLabelText(/Date/i);
    expect(dateInput).toHaveAttribute("min");
    expect(dateInput).toHaveAttribute("max");
  });

  it("devrait avoir l'attribut required sur les champs", () => {
    render(
      <AdminDateTimePicker
        value=""
        onChange={mockOnChange}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    expect(dateInput).toHaveAttribute("required");
    expect(timeSelect).toHaveAttribute("required");
  });
});
