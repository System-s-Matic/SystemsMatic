import { render, screen, fireEvent } from "@testing-library/react";
import QuoteRejectModal from "../QuoteRejectModal";
import { Quote } from "@/lib/backoffice-api";

// Mock alert globally
const mockAlert = jest.fn();
global.alert = mockAlert;

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

describe("QuoteRejectModal", () => {
  const mockOnReject = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockAlert.mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("devrait afficher les informations du devis", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText("Rejeter le devis - Jean Dupont")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Installation de portail automatique")
    ).toBeInTheDocument();
    expect(screen.getByText("Projet rejeté :")).toBeInTheDocument();
  });

  it("devrait afficher le message d'avertissement", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    expect(
      screen.getByText(
        /En rejetant ce devis, un email sera automatiquement envoyé au client/
      )
    ).toBeInTheDocument();
  });

  it("devrait mettre à jour le champ raison du refus", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const rejectionReasonTextarea = screen.getByPlaceholderText(
      "Expliquez pourquoi ce devis ne peut pas être accepté..."
    );
    fireEvent.change(rejectionReasonTextarea, {
      target: { value: "Projet non réalisable" },
    });

    expect(rejectionReasonTextarea).toHaveValue("Projet non réalisable");
  });

  it("devrait appeler onReject avec la raison du refus", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const rejectionReasonTextarea = screen.getByPlaceholderText(
      "Expliquez pourquoi ce devis ne peut pas être accepté..."
    );
    const submitButton = screen.getByText("❌ Rejeter le devis");

    fireEvent.change(rejectionReasonTextarea, {
      target: { value: "Projet non réalisable" },
    });
    fireEvent.click(submitButton);

    expect(mockOnReject).toHaveBeenCalledWith({
      rejectionReason: "Projet non réalisable",
    });
  });

  it("devrait afficher une alerte si la raison est vide", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const form = document.querySelector("form");
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAlert).toHaveBeenCalledWith(
      "Veuillez saisir une raison pour le refus"
    );
    expect(mockOnReject).not.toHaveBeenCalled();
  });

  it("devrait afficher une alerte si la raison ne contient que des espaces", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const rejectionReasonTextarea = screen.getByPlaceholderText(
      "Expliquez pourquoi ce devis ne peut pas être accepté..."
    );
    const form = document.querySelector("form");

    fireEvent.change(rejectionReasonTextarea, {
      target: { value: "   " },
    });
    if (form) {
      fireEvent.submit(form);
    }

    expect(mockAlert).toHaveBeenCalledWith(
      "Veuillez saisir une raison pour le refus"
    );
    expect(mockOnReject).not.toHaveBeenCalled();
  });

  it("devrait trimmer la raison avant de l'envoyer", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const rejectionReasonTextarea = screen.getByPlaceholderText(
      "Expliquez pourquoi ce devis ne peut pas être accepté..."
    );
    const submitButton = screen.getByText("❌ Rejeter le devis");

    fireEvent.change(rejectionReasonTextarea, {
      target: { value: "  Projet non réalisable  " },
    });
    fireEvent.click(submitButton);

    expect(mockOnReject).toHaveBeenCalledWith({
      rejectionReason: "Projet non réalisable",
    });
  });

  it("devrait fermer le modal quand on clique sur le bouton fermer", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByText("×");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("devrait fermer le modal quand on clique sur Annuler", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const cancelButton = screen.getByText("Annuler");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("devrait fermer le modal quand on clique sur l'overlay", () => {
    render(
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
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
      <QuoteRejectModal
        quote={mockQuote}
        onReject={mockOnReject}
        onClose={mockOnClose}
      />
    );

    const modalContent = screen.getByText("Rejeter le devis - Jean Dupont");
    fireEvent.click(modalContent);

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
