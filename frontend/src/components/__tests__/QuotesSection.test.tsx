import { render, screen, fireEvent } from "@testing-library/react";
import QuotesSection from "../QuotesSection";
import { Quote } from "@/lib/backoffice-api";

// Mock de la fonction de formatage de date
jest.mock("@/lib/date-utils", () => ({
  formatGuadeloupeDateTime: (date: string) => `formatted-${date}`,
}));

const mockQuote: Quote = {
  id: "q1",
  status: "PENDING",
  createdAt: "2025-10-18T00:00:00Z",
  updatedAt: "2025-10-18T00:00:00Z",
  projectDescription: "Installation de porte automatique",
  acceptPhone: false,
  acceptTerms: true,
  contactId: "c1",
  contact: {
    id: "c1",
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean@exemple.com",
    phone: "0600000000",
  },
};

const baseProps = {
  quotes: [],
  quotesLoading: false,
  quotesStats: {},
  quotesFilter: "",
  setQuotesFilter: jest.fn(),
  updateQuoteStatus: jest.fn(),
  handleSaveQuote: jest.fn(),
  confirmAcceptQuote: jest.fn(),
  confirmRejectQuote: jest.fn(),
  getQuoteStatusLabel: (status: string) => `Label-${status}`,
  getQuoteStatusColor: (status: string) => `color-${status}`,
};

describe("QuotesSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("affiche le spinner de chargement si quotesLoading est vrai", () => {
    render(<QuotesSection {...baseProps} quotesLoading={true} />);
    expect(screen.getByText(/Chargement des devis/i)).toBeInTheDocument();
  });

  it("affiche le message Aucun devis trouvé si quotes est vide", () => {
    render(<QuotesSection {...baseProps} quotes={[]} />);
    expect(screen.getByText(/Aucun devis trouvé/i)).toBeInTheDocument();
  });

  it("affiche les informations principales d’un devis", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);
    expect(screen.getByText(/Jean Dupont/i)).toBeInTheDocument();
    expect(screen.getByText(/Label-PENDING/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Installation de porte automatique/i)
    ).toBeInTheDocument();
  });

  it("appelle updateQuoteStatus quand on clique sur 'Traiter'", () => {
    const updateMock = jest.fn();
    render(
      <QuotesSection
        {...baseProps}
        quotes={[mockQuote]}
        updateQuoteStatus={updateMock}
      />
    );

    fireEvent.click(screen.getByText(/Traiter/i));
    expect(updateMock).toHaveBeenCalledWith("q1", "PROCESSING");
  });

  it("ouvre la modale d'acceptation quand on clique sur 'Accepter'", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);
    fireEvent.click(screen.getByText(/Accepter/i));
    // Vérifie que la modale d'acceptation est rendue
    expect(
      screen.getByRole("button", { name: /✅ Accepter le devis/i })
    ).toBeInTheDocument();
  });

  it("ouvre la modale de rejet quand on clique sur 'Rejeter'", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);
    fireEvent.click(screen.getByText(/Rejeter/i));
    expect(
      screen.getByRole("button", { name: /❌ Rejeter le devis/i })
    ).toBeInTheDocument();
  });

  it("ouvre la modale d'édition quand on clique sur 'Modifier'", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);
    fireEvent.click(screen.getByText(/Modifier/i));
    // Vérifie que la modale d'édition est ouverte
    expect(screen.getByText(/Modifier le devis/i)).toBeInTheDocument();
  });

  it("affiche le bouton 'Marquer envoyé' pour un devis en statut PROCESSING", () => {
    const processingQuote = { ...mockQuote, status: "PROCESSING" as const };
    render(<QuotesSection {...baseProps} quotes={[processingQuote]} />);
    expect(screen.getByText(/Marquer envoyé/i)).toBeInTheDocument();
  });

  it("appelle updateQuoteStatus avec 'SENT' quand on clique sur 'Marquer envoyé'", () => {
    const updateMock = jest.fn();
    const processingQuote = { ...mockQuote, status: "PROCESSING" as const };
    render(
      <QuotesSection
        {...baseProps}
        quotes={[processingQuote]}
        updateQuoteStatus={updateMock}
      />
    );

    fireEvent.click(screen.getByText(/Marquer envoyé/i));
    expect(updateMock).toHaveBeenCalledWith("q1", "SENT");
  });

  it("ne devrait pas afficher les boutons Accepter/Rejeter pour un devis SENT", () => {
    const sentQuote = { ...mockQuote, status: "SENT" as const };
    render(<QuotesSection {...baseProps} quotes={[sentQuote]} />);
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rejeter/i)).not.toBeInTheDocument();
  });

  it("ne devrait pas afficher les boutons Accepter/Rejeter pour un devis ACCEPTED", () => {
    const acceptedQuote = { ...mockQuote, status: "ACCEPTED" as const };
    render(<QuotesSection {...baseProps} quotes={[acceptedQuote]} />);
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rejeter/i)).not.toBeInTheDocument();
  });

  it("ne devrait pas afficher les boutons Accepter/Rejeter pour un devis REJECTED", () => {
    const rejectedQuote = { ...mockQuote, status: "REJECTED" as const };
    render(<QuotesSection {...baseProps} quotes={[rejectedQuote]} />);
    expect(screen.queryByText(/Accepter/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Rejeter/i)).not.toBeInTheDocument();
  });

  it("ne devrait pas afficher le bouton 'Traiter' pour un devis non-PENDING", () => {
    const processingQuote = { ...mockQuote, status: "PROCESSING" as const };
    render(<QuotesSection {...baseProps} quotes={[processingQuote]} />);
    expect(screen.queryByText(/Traiter/i)).not.toBeInTheDocument();
  });

  it("ne devrait pas afficher le bouton 'Marquer envoyé' pour un devis non-PROCESSING", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);
    expect(screen.queryByText(/Marquer envoyé/i)).not.toBeInTheDocument();
  });

  it("devrait ouvrir la modale d'édition avec les bonnes props", () => {
    const handleSaveMock = jest.fn().mockResolvedValue(true);
    render(
      <QuotesSection
        {...baseProps}
        quotes={[mockQuote]}
        handleSaveQuote={handleSaveMock}
      />
    );

    // Ouvrir la modale d'édition
    fireEvent.click(screen.getByText(/Modifier/i));
    expect(screen.getByText(/Modifier le devis/i)).toBeInTheDocument();
  });

  it("devrait ouvrir la modale d'acceptation avec les bonnes props", () => {
    const confirmAcceptMock = jest.fn().mockResolvedValue(true);
    render(
      <QuotesSection
        {...baseProps}
        quotes={[mockQuote]}
        confirmAcceptQuote={confirmAcceptMock}
      />
    );

    // Ouvrir la modale d'acceptation
    fireEvent.click(screen.getByText(/Accepter/i));
    expect(
      screen.getByRole("button", { name: /✅ Accepter le devis/i })
    ).toBeInTheDocument();
  });

  it("devrait ouvrir la modale de rejet avec les bonnes props", () => {
    const confirmRejectMock = jest.fn().mockResolvedValue(true);
    render(
      <QuotesSection
        {...baseProps}
        quotes={[mockQuote]}
        confirmRejectQuote={confirmRejectMock}
      />
    );

    // Ouvrir la modale de rejet
    fireEvent.click(screen.getByText(/Rejeter/i));
    expect(
      screen.getByRole("button", { name: /❌ Rejeter le devis/i })
    ).toBeInTheDocument();
  });

  it("devrait fermer la modale d'édition avec onClose", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);

    // Ouvrir la modale d'édition
    fireEvent.click(screen.getByText(/Modifier/i));
    expect(screen.getByText(/Modifier le devis/i)).toBeInTheDocument();

    // Fermer avec le bouton de fermeture
    const closeButton = screen.getByRole("button", { name: /×/i });
    fireEvent.click(closeButton);

    // La modale devrait être fermée
    expect(screen.queryByText(/Modifier le devis/i)).not.toBeInTheDocument();
  });

  it("devrait fermer la modale d'acceptation avec onClose", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);

    // Ouvrir la modale d'acceptation
    fireEvent.click(screen.getByText(/Accepter/i));
    expect(
      screen.getByRole("button", { name: /✅ Accepter le devis/i })
    ).toBeInTheDocument();

    // Fermer avec le bouton de fermeture
    const closeButton = screen.getByRole("button", { name: /×/i });
    fireEvent.click(closeButton);

    // La modale devrait être fermée
    expect(
      screen.queryByRole("button", { name: /✅ Accepter le devis/i })
    ).not.toBeInTheDocument();
  });

  it("devrait fermer la modale de rejet avec onClose", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);

    // Ouvrir la modale de rejet
    fireEvent.click(screen.getByText(/Rejeter/i));
    expect(
      screen.getByRole("button", { name: /❌ Rejeter le devis/i })
    ).toBeInTheDocument();

    // Fermer avec le bouton de fermeture
    const closeButton = screen.getByRole("button", { name: /×/i });
    fireEvent.click(closeButton);

    // La modale devrait être fermée
    expect(
      screen.queryByRole("button", { name: /❌ Rejeter le devis/i })
    ).not.toBeInTheDocument();
  });

  it("devrait fermer la modale d'édition avec le bouton Annuler", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);

    // Ouvrir la modale d'édition
    fireEvent.click(screen.getByText(/Modifier/i));
    expect(screen.getByText(/Modifier le devis/i)).toBeInTheDocument();

    // Fermer avec le bouton Annuler
    const cancelButton = screen.getByRole("button", { name: /Annuler/i });
    fireEvent.click(cancelButton);

    // La modale devrait être fermée
    expect(screen.queryByText(/Modifier le devis/i)).not.toBeInTheDocument();
  });

  it("devrait fermer la modale d'acceptation avec le bouton Annuler", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);

    // Ouvrir la modale d'acceptation
    fireEvent.click(screen.getByText(/Accepter/i));
    expect(
      screen.getByRole("button", { name: /✅ Accepter le devis/i })
    ).toBeInTheDocument();

    // Fermer avec le bouton Annuler
    const cancelButton = screen.getByRole("button", { name: /Annuler/i });
    fireEvent.click(cancelButton);

    // La modale devrait être fermée
    expect(
      screen.queryByRole("button", { name: /✅ Accepter le devis/i })
    ).not.toBeInTheDocument();
  });

  it("devrait fermer la modale de rejet avec le bouton Annuler", () => {
    render(<QuotesSection {...baseProps} quotes={[mockQuote]} />);

    // Ouvrir la modale de rejet
    fireEvent.click(screen.getByText(/Rejeter/i));
    expect(
      screen.getByRole("button", { name: /❌ Rejeter le devis/i })
    ).toBeInTheDocument();

    // Fermer avec le bouton Annuler
    const cancelButton = screen.getByRole("button", { name: /Annuler/i });
    fireEvent.click(cancelButton);

    // La modale devrait être fermée
    expect(
      screen.queryByRole("button", { name: /❌ Rejeter le devis/i })
    ).not.toBeInTheDocument();
  });
});
