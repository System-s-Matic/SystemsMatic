import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChatBox from "../ChatBox";

// Mock des sanitizers
jest.mock("../../lib/validation", () => ({
  sanitizers: {
    html: (content: string) => content,
  },
}));

// Mock scrollIntoView pour jsdom
Object.defineProperty(Element.prototype, "scrollIntoView", {
  value: jest.fn(),
  writable: true,
});

describe("ChatBox", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("devrait afficher le bouton de chat initialement", () => {
    render(<ChatBox />);

    expect(
      screen.getByLabelText(/Ouvrir le chat d'assistance/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Assistant SystemsMatic/i)
    ).not.toBeInTheDocument();
  });

  it("devrait ouvrir le chat quand on clique sur le bouton", () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    expect(screen.getByText(/Assistant SystemsMatic/i)).toBeInTheDocument();
    expect(screen.getByText(/En ligne/i)).toBeInTheDocument();
  });

  it("devrait fermer le chat quand on clique sur le bouton de fermeture", async () => {
    render(<ChatBox />);

    // Ouvrir le chat
    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    expect(screen.getByText(/Assistant SystemsMatic/i)).toBeInTheDocument();

    // Fermer le chat
    const closeButton = screen.getByLabelText(/Fermer le chat d'assistance/i);
    fireEvent.click(closeButton);

    // Attendre la fermeture avec animation
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(
      screen.queryByText(/Assistant SystemsMatic/i)
    ).not.toBeInTheDocument();
  });

  it("devrait afficher le message de bienvenue et les options", () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    expect(
      screen.getByText(/Bonjour ! Je suis l'assistant virtuel/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Quels sont vos horaires/i)).toBeInTheDocument();
    expect(screen.getByText(/Quels sont vos tarifs/i)).toBeInTheDocument();
    expect(screen.getByText(/Comment vous contacter/i)).toBeInTheDocument();
    expect(screen.getByText(/Autre question/i)).toBeInTheDocument();
  });

  it("devrait répondre aux questions sur les horaires", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    const horairesButton = screen.getByText(/Quels sont vos horaires/i);
    fireEvent.click(horairesButton);

    // Attendre la réponse
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(
            /Nos horaires d'ouverture sont du lundi au vendredi/i
          )
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("devrait répondre aux questions sur les tarifs", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    const tarifsButton = screen.getByText(/Quels sont vos tarifs/i);
    fireEvent.click(tarifsButton);

    // Attendre la réponse
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/Nos tarifs varient selon le type de service/i)
        ).toBeInTheDocument();
        expect(screen.getByText(/Diagnostic : 50€/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("devrait répondre aux questions sur le contact", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    const contactButton = screen.getByText(/Comment vous contacter/i);
    fireEvent.click(contactButton);

    // Attendre la réponse
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/Vous pouvez nous contacter de plusieurs façons/i)
        ).toBeInTheDocument();
        expect(
          screen.getByText(/Téléphone : 01 23 45 67 89/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("devrait répondre aux autres questions", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    const autreButton = screen.getByText(/Autre question/i);
    fireEvent.click(autreButton);

    // Attendre la réponse
    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    await waitFor(
      () => {
        expect(
          screen.getByText(/Je suis là pour vous aider/i)
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it("devrait afficher l'indicateur de frappe", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    const horairesButton = screen.getByText(/Quels sont vos horaires/i);
    fireEvent.click(horairesButton);

    // Vérifier que l'indicateur de frappe apparaît
    await waitFor(() => {
      expect(
        screen.getByLabelText(/L'assistant virtuel est en train de taper/i)
      ).toBeInTheDocument();
    });
  });

  it("devrait désactiver les boutons pendant la frappe", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    const horairesButton = screen.getByText(/Quels sont vos horaires/i);
    fireEvent.click(horairesButton);

    // Vérifier que les boutons sont désactivés pendant la frappe
    await waitFor(() => {
      const buttons = screen.getAllByRole("button");
      buttons.forEach((button) => {
        if (
          button.textContent?.includes("Quels sont vos horaires") ||
          button.textContent?.includes("Quels sont vos tarifs") ||
          button.textContent?.includes("Comment vous contacter") ||
          button.textContent?.includes("Autre question")
        ) {
          expect(button).toBeDisabled();
        }
      });
    });
  });

  it("devrait afficher les timestamps des messages", () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    // Vérifier que les timestamps sont affichés
    const timestamps = screen.getAllByText(/\d{2}:\d{2}/);
    expect(timestamps.length).toBeGreaterThan(0);
  });

  it("devrait avoir les bons attributs d'accessibilité", () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    expect(chatButton).toHaveAttribute(
      "aria-label",
      "Ouvrir le chat d'assistance"
    );

    fireEvent.click(chatButton);

    const closeButton = screen.getByLabelText(/Fermer le chat d'assistance/i);
    expect(closeButton).toHaveAttribute(
      "aria-label",
      "Fermer le chat d'assistance"
    );
  });

  it("devrait afficher l'avatar de l'assistant", () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    // Vérifier que l'avatar est présent
    const avatars = screen.getAllByRole("generic");
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("devrait gérer la fermeture avec animation", async () => {
    render(<ChatBox />);

    const chatButton = screen.getByLabelText(/Ouvrir le chat d'assistance/i);
    fireEvent.click(chatButton);

    expect(screen.getByText(/Assistant SystemsMatic/i)).toBeInTheDocument();

    const closeButton = screen.getByLabelText(/Fermer le chat d'assistance/i);
    fireEvent.click(closeButton);

    // Vérifier que la classe de fermeture est appliquée
    const chatbox = screen
      .getByText(/Assistant SystemsMatic/i)
      .closest(".chatbox");
    expect(chatbox).toHaveClass("chatbox--closing");

    // Attendre la fermeture complète
    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(
      screen.queryByText(/Assistant SystemsMatic/i)
    ).not.toBeInTheDocument();
  });
});
