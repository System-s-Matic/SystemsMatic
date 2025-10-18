import { render, screen } from "@testing-library/react";
import StatsSection from "../StatsSection";

describe("StatsSection", () => {
  const mockAppointmentsStats = {
    total: 10,
    pending: 3,
    confirmed: 4,
    completed: 2,
    cancelled: 1,
    rejected: 0,
  };

  const mockQuotesStats = {
    total: 15,
    pending: 5,
    processing: 3,
    sent: 4,
    accepted: 3,
  };

  it("devrait afficher les statistiques des rendez-vous", () => {
    render(
      <StatsSection
        activeTab="appointments"
        stats={mockAppointmentsStats}
        quotesStats={null}
      />
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Confirmés")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Terminés")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("devrait afficher les statistiques des devis", () => {
    render(
      <StatsSection
        activeTab="quotes"
        stats={null}
        quotesStats={mockQuotesStats}
      />
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.getAllByText("3")).toHaveLength(2);
    expect(screen.getByText("Envoyés")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("Acceptés")).toBeInTheDocument();
  });

  it("devrait afficher les cartes annulés et rejetés si les valeurs sont > 0", () => {
    render(
      <StatsSection
        activeTab="appointments"
        stats={mockAppointmentsStats}
        quotesStats={null}
      />
    );

    expect(screen.getByText("Annulés")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.queryByText("Rejetés")).not.toBeInTheDocument();
  });

  it("ne devrait pas afficher les cartes annulés et rejetés si les valeurs sont 0", () => {
    const statsWithoutCancelled = {
      ...mockAppointmentsStats,
      cancelled: 0,
      rejected: 0,
    };

    render(
      <StatsSection
        activeTab="appointments"
        stats={statsWithoutCancelled}
        quotesStats={null}
      />
    );

    expect(screen.queryByText("Annulés")).not.toBeInTheDocument();
    expect(screen.queryByText("Rejetés")).not.toBeInTheDocument();
  });

  it("devrait afficher 0 pour les valeurs manquantes", () => {
    const incompleteStats = {
      total: 5,
      pending: 2,
      // confirmed, completed, cancelled, rejected manquants
    };

    render(
      <StatsSection
        activeTab="appointments"
        stats={incompleteStats}
        quotesStats={null}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument(); // total
    expect(screen.getByText("2")).toBeInTheDocument(); // pending
    expect(screen.getAllByText("0")).toHaveLength(2); // confirmed et completed (valeurs par défaut)
  });

  it("devrait retourner null si activeTab est appointments mais stats est null", () => {
    const { container } = render(
      <StatsSection activeTab="appointments" stats={null} quotesStats={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("devrait retourner null si activeTab est quotes mais quotesStats est null", () => {
    const { container } = render(
      <StatsSection activeTab="quotes" stats={null} quotesStats={null} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("devrait retourner null pour un activeTab non reconnu", () => {
    const { container } = render(
      <StatsSection
        activeTab={"unknown" as any}
        stats={mockAppointmentsStats}
        quotesStats={mockQuotesStats}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("devrait afficher les icônes appropriées pour les rendez-vous", () => {
    render(
      <StatsSection
        activeTab="appointments"
        stats={mockAppointmentsStats}
        quotesStats={null}
      />
    );

    // Vérifier que les SVG sont présents
    const svgElements = document.querySelectorAll("svg");
    expect(svgElements.length).toBeGreaterThan(0);
  });

  it("devrait afficher les emojis appropriés pour les devis", () => {
    render(
      <StatsSection
        activeTab="quotes"
        stats={null}
        quotesStats={mockQuotesStats}
      />
    );

    expect(screen.getByText("💰")).toBeInTheDocument(); // Total
    expect(screen.getByText("⏳")).toBeInTheDocument(); // En attente
    expect(screen.getByText("🔄")).toBeInTheDocument(); // En cours
    expect(screen.getByText("📤")).toBeInTheDocument(); // Envoyés
    expect(screen.getByText("✅")).toBeInTheDocument(); // Acceptés
  });
});
