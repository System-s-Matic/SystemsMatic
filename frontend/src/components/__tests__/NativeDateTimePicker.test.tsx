import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NativeDateTimePicker from "../NativeDateTimePicker";
import {
  getCurrentGuadeloupeTime,
  getMaximumBookingDate,
} from "../../lib/date-utils";

// Mock dayjs
jest.mock("dayjs", () => {
  const mockDayjs = jest.fn((date) => ({
    isBefore: jest.fn(() => {
      if (
        date &&
        date.getTime &&
        date.getTime() < new Date("2024-01-16").getTime()
      ) {
        return true;
      }
      return false;
    }),
    isAfter: jest.fn(() => {
      if (
        date &&
        date.getTime &&
        date.getTime() > new Date("2024-02-15").getTime()
      ) {
        return true;
      }
      return false;
    }),
  }));
  return mockDayjs;
});

// Mock des dépendances
jest.mock("../../lib/date-utils", () => ({
  getCurrentGuadeloupeTime: jest.fn(() => ({
    add: jest.fn((amount, unit) => {
      if (unit === "day") {
        return { format: () => "2024-01-16" };
      }
      return { format: () => "2024-01-15" };
    }),
    year: jest.fn(() => ({
      month: jest.fn(() => ({
        date: jest.fn(() => ({
          hour: jest.fn(() => ({
            minute: jest.fn(() => ({
              second: jest.fn(() => ({
                millisecond: jest.fn(() => ({
                  format: jest.fn((format) => {
                    if (format === "YYYY-MM-DD") return "2024-01-15";
                    if (format === "HH:mm") return "10:30";
                    return "2024-01-15";
                  }),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
  })),
  getMaximumBookingDate: jest.fn(() => ({
    format: () => "2024-02-15",
  })),
  formatLocalDateTime: jest.fn(() => "lundi 15 janvier 2024 à 10:30"),
}));

describe("NativeDateTimePicker", () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher les champs de date et heure", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    expect(screen.getByLabelText(/Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Heure/i)).toBeInTheDocument();
  });

  it("devrait afficher les créneaux horaires disponibles", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

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

  it("devrait appeler onChange quand la date change", async () => {
    const user = userEvent.setup();
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    await user.selectOptions(timeSelect, "10:00");
    await user.type(dateInput, "2024-01-16");

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("devrait appeler onChange quand l'heure change", async () => {
    const user = userEvent.setup();
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    await user.type(dateInput, "2024-01-16");
    await user.selectOptions(timeSelect, "10:00");

    expect(mockOnChange).toHaveBeenCalled();
  });

  it("devrait initialiser avec une valeur fournie", () => {
    const testDate = new Date("2024-01-15T10:30:00.000Z");
    render(<NativeDateTimePicker value={testDate} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    expect(dateInput).toHaveValue("2024-01-15");
    expect(timeSelect).toHaveValue("10:30");
  });

  it("devrait afficher la date sélectionnée quand value est fournie", () => {
    const testDate = new Date("2024-01-15T10:30:00.000Z");
    render(<NativeDateTimePicker value={testDate} onChange={mockOnChange} />);

    expect(screen.getByText(/Sélectionné :/i)).toBeInTheDocument();
  });

  it("devrait afficher les contraintes de date", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    expect(
      screen.getByText(/Du 2024-01-16 au 2024-02-15/i)
    ).toBeInTheDocument();
  });

  it("devrait avoir les attributs min et max sur le champ date", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    expect(dateInput).toHaveAttribute("min", "2024-01-16");
    expect(dateInput).toHaveAttribute("max", "2024-02-15");
  });

  it("devrait avoir l'attribut required sur les champs", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    expect(dateInput).toHaveAttribute("required");
    expect(timeSelect).toHaveAttribute("required");
  });

  it("devrait appliquer la classe CSS personnalisée", () => {
    const customClass = "custom-picker";
    render(
      <NativeDateTimePicker
        value={null}
        onChange={mockOnChange}
        className={customClass}
      />
    );

    const container = screen
      .getByLabelText(/Date/i)
      .closest(".native-datetime-picker");
    expect(container).toHaveClass("native-datetime-picker", customClass);
  });

  it("devrait appliquer la classe error quand error est true", () => {
    render(
      <NativeDateTimePicker value={null} onChange={mockOnChange} error={true} />
    );

    const container = screen
      .getByLabelText(/Date/i)
      .closest(".native-datetime-picker");
    expect(container).toHaveClass("error");
  });

  it("devrait afficher une erreur quand la date est dans le passé", async () => {
    const user = userEvent.setup();
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    await user.selectOptions(timeSelect, "10:00");
    await user.type(dateInput, "2024-01-14"); // Date dans le passé

    // Attendre que l'erreur soit affichée
    await waitFor(
      () => {
        expect(
          screen.getByText(
            /Les rendez-vous doivent être pris à partir du lendemain/i
          )
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("devrait afficher une erreur quand la date est trop loin dans le futur", async () => {
    const user = userEvent.setup();
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    await user.selectOptions(timeSelect, "10:00");
    await user.type(dateInput, "2024-03-15"); // Date trop loin

    // Attendre que l'erreur soit affichée
    await waitFor(
      () => {
        expect(
          screen.getByText(
            /Les rendez-vous ne peuvent pas être planifiés au-delà d'un mois/i
          )
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("devrait afficher une erreur quand la date est fournie mais pas l'heure", async () => {
    const user = userEvent.setup();
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const dateInput = screen.getByLabelText(/Date/i);

    await user.type(dateInput, "2024-01-16");

    await waitFor(() => {
      expect(
        screen.getByText(/La date et l'heure sont requises/i)
      ).toBeInTheDocument();
    });
  });

  it("devrait afficher une erreur quand l'heure est fournie mais pas la date", async () => {
    const user = userEvent.setup();
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    const timeSelect = screen.getByLabelText(/Heure/i);

    await user.selectOptions(timeSelect, "10:00");

    await waitFor(() => {
      expect(
        screen.getByText(/La date et l'heure sont requises/i)
      ).toBeInTheDocument();
    });
  });

  it("devrait réinitialiser les champs quand value devient null", () => {
    const { rerender } = render(
      <NativeDateTimePicker
        value={new Date("2024-01-15T10:30:00.000Z")}
        onChange={mockOnChange}
      />
    );

    const dateInput = screen.getByLabelText(/Date/i);
    const timeSelect = screen.getByLabelText(/Heure/i);

    // Vérifier que les champs sont initialisés
    expect(dateInput).toHaveValue("2024-01-15");
    expect(timeSelect).toHaveValue("10:30");

    // Réinitialiser avec null
    rerender(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    // Vérifier que les champs sont réinitialisés
    expect(dateInput).toHaveValue("");
    expect(timeSelect).toHaveValue("");
  });

  it("devrait ne pas afficher la date sélectionnée quand value est null", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    expect(screen.queryByText(/Sélectionné :/i)).not.toBeInTheDocument();
  });

  it("devrait générer les bons créneaux horaires", () => {
    render(<NativeDateTimePicker value={null} onChange={mockOnChange} />);

    // Vérifier les créneaux du matin (8h-11h30)
    const morningSlots = [
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ];
    morningSlots.forEach((slot) => {
      expect(screen.getByText(slot)).toBeInTheDocument();
    });

    // Vérifier les créneaux de l'après-midi (14h-17h)
    const afternoonSlots = [
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
    ];
    afternoonSlots.forEach((slot) => {
      expect(screen.getByText(slot)).toBeInTheDocument();
    });

    // Vérifier qu'il n'y a pas de créneaux entre 12h et 14h
    expect(screen.queryByText("12:00")).not.toBeInTheDocument();
    expect(screen.queryByText("13:00")).not.toBeInTheDocument();
  });
});
