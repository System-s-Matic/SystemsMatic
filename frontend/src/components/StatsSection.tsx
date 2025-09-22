"use client";

interface StatsSectionProps {
  activeTab: "appointments" | "quotes";
  stats: any;
  quotesStats: any;
}

export default function StatsSection({
  activeTab,
  stats,
  quotesStats,
}: StatsSectionProps) {
  if (activeTab === "appointments" && stats) {
    return (
      <div className="admin-stats appointments-stats">
        <div className="stat-card total">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3>Total</h3>
          <p>{stats.total || 0}</p>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
          </div>
          <h3>En attente</h3>
          <p>{stats.pending || 0}</p>
        </div>
        <div className="stat-card confirmed">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </div>
          <h3>Confirmés</h3>
          <p>{stats.confirmed || 0}</p>
        </div>
        <div className="stat-card completed">
          <div className="stat-icon">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <h3>Terminés</h3>
          <p>{stats.completed || 0}</p>
        </div>
        {stats.cancelled > 0 && (
          <div className="stat-card cancelled">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </div>
            <h3>Annulés</h3>
            <p>{stats.cancelled}</p>
          </div>
        )}
        {stats.rejected > 0 && (
          <div className="stat-card rejected">
            <div className="stat-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
            </div>
            <h3>Rejetés</h3>
            <p>{stats.rejected}</p>
          </div>
        )}
      </div>
    );
  }

  if (activeTab === "quotes" && quotesStats) {
    return (
      <div className="admin-stats quotes-stats">
        <div className="stat-card total">
          <div className="stat-icon">💰</div>
          <h3>Total</h3>
          <p>{quotesStats.total || 0}</p>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <h3>En attente</h3>
          <p>{quotesStats.pending || 0}</p>
        </div>
        <div className="stat-card processing">
          <div className="stat-icon">🔄</div>
          <h3>En cours</h3>
          <p>{quotesStats.processing || 0}</p>
        </div>
        <div className="stat-card sent">
          <div className="stat-icon">📤</div>
          <h3>Envoyés</h3>
          <p>{quotesStats.sent || 0}</p>
        </div>
        <div className="stat-card accepted">
          <div className="stat-icon">✅</div>
          <h3>Acceptés</h3>
          <p>{quotesStats.accepted || 0}</p>
        </div>
      </div>
    );
  }

  return null;
}
