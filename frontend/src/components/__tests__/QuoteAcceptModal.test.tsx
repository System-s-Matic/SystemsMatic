import { render, screen, fireEvent } from "@testing-library/react";
import QuoteAcceptModal from "../QuoteAcceptModal";
import { Quote } from "@/lib/backoffice-api";

const mockQuote: Quote = {
  id: "1",
  contactId: "contact-1",
  contact: {
    id: "contact-1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean@example.com",
  },
  projectDescription: "Installation de portail automatique",
  status: "PENDING",
  acceptPhone: true,
  acceptTerms: true,
  createdAt: "2024-01-15T10:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
};

describe("QuoteAcceptModal", () => {
  const mockOnAccept = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("devrait afficher les informations du devis", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText("Accepter le devis - Jean Dupont")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Installation de portail automatique")
    ).toBeInTheDocument();
    expect(screen.getByText("Résumé du projet :")).toBeInTheDocument();
  });

  it("devrait afficher le message d'avertissement", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(
        /En acceptant ce devis, un email sera automatiquement envoyé au client/
      )
    ).toBeInTheDocument();
  });

  it("devrait mettre à jour le champ document", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const documentInput = screen.getByPlaceholderText(
      "https://exemple.com/devis.pdf"
    );
    fireEvent.change(documentInput, {
      target: { value: "https://example.com/devis.pdf" },
    });

    expect(documentInput).toHaveValue("https://example.com/devis.pdf");
  });

  it("devrait mettre à jour le champ validUntil", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const validUntilInput = document.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    fireEvent.change(validUntilInput, { target: { value: "2024-12-31" } });

    expect(validUntilInput).toHaveValue("2024-12-31");
  });

  it("devrait appeler onAccept avec les données du formulaire", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const documentInput = screen.getByPlaceholderText(
      "https://exemple.com/devis.pdf"
    );
    const validUntilInput = document.querySelector(
      'input[type="date"]'
    ) as HTMLInputElement;
    const submitButton = screen.getByText("✅ Accepter le devis");

    fireEvent.change(documentInput, {
      target: { value: "https://example.com/devis.pdf" },
    });
    fireEvent.change(validUntilInput, { target: { value: "2024-12-31" } });
    fireEvent.click(submitButton);

    expect(mockOnAccept).toHaveBeenCalledWith({
      document: "https://example.com/devis.pdf",
      validUntil: "2024-12-31",
    });
  });

  it("devrait appeler onAccept avec des champs vides si non remplis", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const submitButton = screen.getByText("✅ Accepter le devis");
    fireEvent.click(submitButton);

    expect(mockOnAccept).toHaveBeenCalledWith({
      document: "",
      validUntil: "",
    });
  });

  it("devrait fermer le modal quand on clique sur le bouton fermer", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("devrait fermer le modal quand on clique sur Annuler", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText("Annuler");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("devrait fermer le modal quand on clique sur l'overlay", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    // Utiliser la classe CSS pour cibler l'overlay
    const overlay = document.querySelector(".quote-modal-overlay");
    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("ne devrait pas fermer le modal quand on clique sur le contenu", () => {
    render(
      <QuoteAcceptModal
        quote={mockQuote}
        onAccept={mockOnAccept}
        onClose={mockOnClose}
      />
    );

    const modalContent = screen.getByText("Accepter le devis - Jean Dupont");
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
