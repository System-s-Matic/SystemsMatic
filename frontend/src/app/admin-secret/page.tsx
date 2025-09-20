"use client";

import { useState, useEffect } from "react";
import { backofficeApi, Quote, QuoteUpdate } from "@/lib/backoffice-api";
import { authApi } from "@/lib/auth-api";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { formatGuadeloupeDateTime } from "@/lib/date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { showSuccess, showError } from "@/lib/toast";
import AdminDateTimePicker from "@/components/AdminDateTimePicker";
import "@/app/styles/admin-backoffice.css";
import "@/app/styles/native-datetime-picker.css";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | "ALL">(
    AppointmentStatus.PENDING
  );
  const [stats, setStats] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");

  // États pour les devis
  const [activeTab, setActiveTab] = useState<"appointments" | "quotes">(
    "appointments"
  );
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesStats, setQuotesStats] = useState<any>(null);
  const [quotesFilter, setQuotesFilter] = useState<string>("");
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);

  // États pour le rafraîchissement automatique
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(300); // 5 minutes en secondes

  // Vérifier l'authentification au chargement
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Essayer de récupérer le profil utilisateur
      const userProfile = await authApi.getProfile();
      setUser(userProfile);
      setIsAuthenticated(true);
    } catch (error) {
      // Non authentifié ou token expiré
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await authApi.login({ email, password });

      // Les cookies sont maintenant définis côté serveur
      setUser(response.user);
      setIsAuthenticated(true);
      setAuthError("");

      // Réinitialiser le formulaire
      setEmail("");
      setPassword("");

      showSuccess("Connexion réussie !");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Erreur de connexion";
      setAuthError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "appointments") {
        fetchAppointments();
        fetchStats();
      } else {
        fetchQuotes();
        fetchQuotesStats();
      }
    }
  }, [filter, quotesFilter, isAuthenticated, activeTab]);

  // Rafraîchissement automatique toutes les 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (activeTab === "appointments") {
        fetchAppointments();
        fetchStats();
      } else {
        fetchQuotes();
        fetchQuotesStats();
      }
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300); // Reset à 5 minutes
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, activeTab, filter, quotesFilter]);

  // Compte à rebours pour le prochain rafraîchissement
  useEffect(() => {
    if (!isAuthenticated) return;

    const countdownInterval = setInterval(() => {
      setTimeUntilNextRefresh((prev) => {
        if (prev <= 1) {
          return 300; // Reset à 5 minutes quand on arrive à 0
        }
        return prev - 1;
      });
    }, 1000); // Mise à jour chaque seconde

    return () => clearInterval(countdownInterval);
  }, [isAuthenticated]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await backofficeApi.getAppointments(filter);

      setAppointments(data);
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
      showError("Erreur lors du chargement des rendez-vous");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await backofficeApi.getStats();
      setStats(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      showError("Erreur lors du chargement des statistiques");
    }
  };

  const updateAppointmentStatus = async (
    id: string,
    status: AppointmentStatus,
    scheduledAt?: string
  ) => {
    try {
      await backofficeApi.updateAppointmentStatus(id, {
        status,
        scheduledAt,
      });
      fetchAppointments();
      fetchStats();

      // Afficher un toast de succès selon l'action
      switch (status) {
        case AppointmentStatus.CONFIRMED:
          showSuccess("Rendez-vous confirmé avec succès");
          break;
        case AppointmentStatus.REJECTED:
          showSuccess("Rendez-vous rejeté");
          break;
        case AppointmentStatus.COMPLETED:
          showSuccess("Rendez-vous marqué comme terminé");
          break;
        default:
          showSuccess("Statut mis à jour avec succès");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      showError("Erreur lors de la mise à jour du statut");
    }
  };

  const deleteAppointment = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      try {
        await backofficeApi.deleteAppointment(id);
        fetchAppointments();
        fetchStats();
        showSuccess("Rendez-vous supprimé avec succès");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        showError("Erreur lors de la suppression du rendez-vous");
      }
    }
  };

  const sendReminder = async (id: string) => {
    try {
      await backofficeApi.sendReminder(id);
      showSuccess("Rappel envoyé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'envoi du rappel:", error);
      showError("Erreur lors de l'envoi du rappel");
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      setAppointments([]);
      setQuotes([]);
      setStats(null);
      setQuotesStats(null);
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300);
      setIsRefreshing(false);
      showSuccess("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
      setIsAuthenticated(false);
      setAppointments([]);
      setQuotes([]);
      setStats(null);
      setQuotesStats(null);
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300);
      setIsRefreshing(false);
      showError("Erreur lors de la déconnexion");
    }
  };

  // Fonctions pour les devis
  const fetchQuotes = async () => {
    try {
      setQuotesLoading(true);
      const response = await backofficeApi.getQuotes({
        status: quotesFilter || undefined,
        page: 1,
        limit: 50,
      });
      setQuotes(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des devis:", error);
      showError("Erreur lors du chargement des devis");
    } finally {
      setQuotesLoading(false);
    }
  };

  const fetchQuotesStats = async () => {
    try {
      const data = await backofficeApi.getQuotesStats();
      setQuotesStats(data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des statistiques des devis:",
        error
      );
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      await backofficeApi.updateQuoteStatus(quoteId, newStatus);
      fetchQuotes();
      fetchQuotesStats();
      showSuccess(`Statut mis à jour vers "${getQuoteStatusLabel(newStatus)}"`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showError("Erreur lors de la mise à jour du statut");
    }
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsQuoteModalOpen(true);
  };

  const handleSaveQuote = async (updatedData: QuoteUpdate) => {
    if (!editingQuote) return;
    try {
      await backofficeApi.updateQuote(editingQuote.id, updatedData);
      showSuccess("Devis mis à jour avec succès");
      setIsQuoteModalOpen(false);
      setEditingQuote(null);
      fetchQuotes();
      fetchQuotesStats();
    } catch (error) {
      console.error("Erreur lors de la mise à jour du devis:", error);
      showError("Erreur lors de la mise à jour du devis");
    }
  };

  // Fonction pour formater le temps restant
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === "appointments") {
        await fetchAppointments();
        await fetchStats();
      } else {
        await fetchQuotes();
        await fetchQuotesStats();
      }
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300); // Reset le compte à rebours
      showSuccess("Données rafraîchies avec succès");
    } catch (error) {
      console.error("Erreur lors du rafraîchissement:", error);
      showError("Erreur lors du rafraîchissement des données");
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatDate = (date: string | Date, timezone?: string) => {
    if (timezone) {
      return dayjs.utc(date).tz(timezone).format("DD/MM/YYYY HH:mm");
    }
    return formatGuadeloupeDateTime(date);
  };

  const formatRequestedDate = (date: string | Date, timezone?: string) => {
    if (timezone) {
      return dayjs.utc(date).tz(timezone).format("DD/MM/YYYY HH:mm");
    }
    return formatGuadeloupeDateTime(date);
  };

  const formatCreatedDate = (date: string | Date) => {
    return formatGuadeloupeDateTime(date);
  };

  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return "En attente";
      case AppointmentStatus.CONFIRMED:
        return "Confirmé";
      case AppointmentStatus.RESCHEDULED:
        return "Reprogrammé";
      case AppointmentStatus.CANCELLED:
        return "Annulé";
      case AppointmentStatus.REJECTED:
        return "Rejeté";
      case AppointmentStatus.COMPLETED:
        return "Terminé";
      default:
        return status;
    }
  };

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return "status-pending";
      case AppointmentStatus.CONFIRMED:
        return "status-confirmed";
      case AppointmentStatus.RESCHEDULED:
        return "status-rescheduled";
      case AppointmentStatus.CANCELLED:
        return "status-cancelled";
      case AppointmentStatus.REJECTED:
        return "status-rejected";
      case AppointmentStatus.COMPLETED:
        return "status-completed";
      default:
        return "";
    }
  };

  // Fonctions utilitaires pour les devis
  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "En attente";
      case "PROCESSING":
        return "En cours";
      case "SENT":
        return "Envoyé";
      case "ACCEPTED":
        return "Accepté";
      case "REJECTED":
        return "Refusé";
      case "EXPIRED":
        return "Expiré";
      default:
        return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "quote-status-pending";
      case "PROCESSING":
        return "quote-status-processing";
      case "SENT":
        return "quote-status-sent";
      case "ACCEPTED":
        return "quote-status-accepted";
      case "REJECTED":
        return "quote-status-rejected";
      case "EXPIRED":
        return "quote-status-expired";
      default:
        return "";
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="admin-login-container">
          <h1>Connexion Administrateur</h1>
          <p>Veuillez vous connecter pour accéder au backoffice</p>

          <form onSubmit={handleLogin} className="auth-form">
            {authError && <div className="auth-error">{authError}</div>}

            <div className="auth-input-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                placeholder="admin@systemsmatic.com"
                required
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="password">Mot de passe</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="Mot de passe"
                required
              />
            </div>

            <button type="submit" disabled={isLoading} className="auth-button">
              {isLoading ? (
                <span className="auth-button-loading">
                  <div className="auth-spinner"></div>
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Backoffice Administrateur</h1>
        <div className="admin-user-info">
          <span>
            Connecté en tant que : {user?.firstName} {user?.lastName}
          </span>
          <button onClick={handleLogout} className="admin-login-button">
            Déconnexion
          </button>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${
            activeTab === "appointments" ? "active" : ""
          }`}
          onClick={() => setActiveTab("appointments")}
        >
          📅 Rendez-vous
        </button>
        <button
          className={`admin-tab ${activeTab === "quotes" ? "active" : ""}`}
          onClick={() => setActiveTab("quotes")}
        >
          💰 Devis
        </button>
      </div>

      <div className="admin-filters">
        <div className="admin-filters-left">
          {activeTab === "appointments" ? (
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as AppointmentStatus | "ALL")
              }
              className="admin-filter-select"
            >
              <option value="ALL">Tous les statuts</option>
              <option value={AppointmentStatus.PENDING}>En attente</option>
              <option value={AppointmentStatus.CONFIRMED}>Confirmé</option>
              <option value={AppointmentStatus.CANCELLED}>Annulé</option>
              <option value={AppointmentStatus.REJECTED}>Rejeté</option>
              <option value={AppointmentStatus.COMPLETED}>Terminé</option>
            </select>
          ) : (
            <select
              value={quotesFilter}
              onChange={(e) => setQuotesFilter(e.target.value)}
              className="admin-filter-select"
            >
              <option value="">Tous les statuts</option>
              <option value="PENDING">En attente</option>
              <option value="PROCESSING">En cours</option>
              <option value="SENT">Envoyés</option>
              <option value="ACCEPTED">Acceptés</option>
              <option value="REJECTED">Refusés</option>
              <option value="EXPIRED">Expirés</option>
            </select>
          )}
        </div>

        <div className="admin-filters-right">
          <div className="refresh-info">
            <span className="last-refresh">
              Prochain rafraîchissement dans :{" "}
              {formatTimeRemaining(timeUntilNextRefresh)}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="refresh-button"
              title="Rafraîchir les données"
            >
              {isRefreshing ? (
                <div className="refresh-spinner"></div>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width="16"
                  height="16"
                >
                  <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques dynamiques selon l'onglet */}
      {activeTab === "appointments" && stats && (
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
      )}

      {activeTab === "quotes" && quotesStats && (
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
      )}

      <div className="admin-content">
        {activeTab === "appointments" ? (
          loading ? (
            <div className="admin-loading">
              <div className="admin-spinner">
                <div className="admin-spinner-icon"></div>
                <span>Chargement des rendez-vous...</span>
              </div>
            </div>
          ) : (
            <div className="appointments-list">
              {appointments.length === 0 ? (
                <p className="no-appointments">Aucun rendez-vous trouvé</p>
              ) : (
                appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`appointment-card ${getStatusColor(
                      appointment.status
                    )}`}
                  >
                    <div className="appointment-header">
                      <h3>
                        {appointment.contact.firstName}{" "}
                        {appointment.contact.lastName}
                      </h3>
                      <span
                        className={`status-badge ${getStatusColor(
                          appointment.status
                        )}`}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    </div>

                    <div className="appointment-details">
                      <p>
                        <strong>Email :</strong> {appointment.contact.email}
                      </p>
                      <p>
                        <strong>Téléphone :</strong>{" "}
                        {appointment.contact.phone || "Non renseigné"}
                      </p>
                      <p>
                        <strong>Demandé le :</strong>{" "}
                        {formatRequestedDate(
                          appointment.requestedAt,
                          appointment.timezone
                        )}
                      </p>
                      {appointment.scheduledAt && (
                        <p>
                          <strong>Programmé le :</strong>{" "}
                          {formatDate(
                            appointment.scheduledAt,
                            appointment.timezone
                          )}
                        </p>
                      )}
                      <p>
                        <strong>Créé le :</strong>{" "}
                        {formatCreatedDate(appointment.createdAt)}
                      </p>
                      {appointment.message && (
                        <p>
                          <strong>Message :</strong> {appointment.message}
                        </p>
                      )}
                    </div>

                    <div className="appointment-actions">
                      {appointment.status === AppointmentStatus.PENDING && (
                        <>
                          <button
                            onClick={() =>
                              updateAppointmentStatus(
                                appointment.id,
                                AppointmentStatus.CONFIRMED
                              )
                            }
                            className="action-button confirm"
                          >
                            Confirmer
                          </button>
                          <button
                            onClick={() => setShowDatePicker(appointment.id)}
                            className="action-button reschedule"
                          >
                            Reprogrammer
                          </button>
                          <button
                            onClick={() =>
                              updateAppointmentStatus(
                                appointment.id,
                                AppointmentStatus.REJECTED
                              )
                            }
                            className="action-button reject"
                          >
                            Rejeter
                          </button>
                        </>
                      )}
                      {appointment.status === AppointmentStatus.CONFIRMED && (
                        <button
                          onClick={() =>
                            updateAppointmentStatus(
                              appointment.id,
                              AppointmentStatus.COMPLETED
                            )
                          }
                          className="action-button complete"
                        >
                          Marquer comme terminé
                        </button>
                      )}
                      {appointment.status === AppointmentStatus.CONFIRMED &&
                        appointment.scheduledAt && (
                          <button
                            onClick={() => sendReminder(appointment.id)}
                            className="action-button reminder"
                          >
                            Envoyer un rappel
                          </button>
                        )}
                      <button
                        onClick={() => deleteAppointment(appointment.id)}
                        className="action-button delete"
                      >
                        Supprimer
                      </button>
                    </div>

                    {/* Sélecteur de date/heure pour la reprogrammation */}
                    {showDatePicker === appointment.id && (
                      <div className="date-picker-overlay">
                        <div className="date-picker-modal">
                          <h4>Proposer une reprogrammation</h4>
                          <p className="reschedule-info">
                            Le client recevra un email avec la nouvelle
                            proposition de date/heure. Il pourra accepter ou
                            refuser.
                          </p>
                          <AdminDateTimePicker
                            value={selectedDateTime}
                            onChange={setSelectedDateTime}
                            onConfirm={async () => {
                              if (selectedDateTime) {
                                try {
                                  await backofficeApi.proposeReschedule(
                                    appointment.id,
                                    selectedDateTime
                                  );
                                  showSuccess(
                                    "Proposition de reprogrammation envoyée"
                                  );
                                  setShowDatePicker(null);
                                  setSelectedDateTime("");
                                  fetchAppointments();
                                } catch (error) {
                                  console.error(
                                    "Erreur lors de la reprogrammation:",
                                    error
                                  );
                                  showError(
                                    "Erreur lors de la reprogrammation"
                                  );
                                }
                              }
                            }}
                            onCancel={() => {
                              setShowDatePicker(null);
                              setSelectedDateTime("");
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )
        ) : quotesLoading ? (
          <div className="admin-loading">
            <div className="admin-spinner">
              <div className="admin-spinner-icon"></div>
              <span>Chargement des devis...</span>
            </div>
          </div>
        ) : (
          <div className="quotes-list">
            {quotes.length === 0 ? (
              <p className="no-quotes">Aucun devis trouvé</p>
            ) : (
              quotes.map((quote) => (
                <div
                  key={quote.id}
                  className={`quote-card ${getQuoteStatusColor(quote.status)}`}
                >
                  <div className="quote-header">
                    <h3>
                      {quote.contact.firstName} {quote.contact.lastName}
                    </h3>
                    <span
                      className={`status-badge ${getQuoteStatusColor(
                        quote.status
                      )}`}
                    >
                      {getQuoteStatusLabel(quote.status)}
                    </span>
                  </div>

                  <div className="quote-details">
                    <p>
                      <strong>Email :</strong> {quote.contact.email}
                    </p>
                    {quote.contact.phone && (
                      <p>
                        <strong>Téléphone :</strong> {quote.contact.phone}
                      </p>
                    )}
                    <p>
                      <strong>Créé le :</strong>{" "}
                      {formatCreatedDate(quote.createdAt)}
                    </p>
                    {quote.quoteValidUntil && (
                      <p>
                        <strong>Valide jusqu'au :</strong>{" "}
                        {formatCreatedDate(quote.quoteValidUntil)}
                      </p>
                    )}
                    <p>
                      <strong>Contact téléphonique :</strong>{" "}
                      {quote.acceptPhone ? "✅ Accepté" : "❌ Refusé"}
                    </p>
                    <div className="quote-description">
                      <strong>Description du projet :</strong>
                      <p>{quote.projectDescription}</p>
                    </div>
                  </div>

                  <div className="quote-actions">
                    <button
                      onClick={() => handleEditQuote(quote)}
                      className="action-button edit"
                    >
                      Modifier
                    </button>

                    {quote.status === "PENDING" && (
                      <button
                        onClick={() =>
                          updateQuoteStatus(quote.id, "PROCESSING")
                        }
                        className="action-button process"
                      >
                        Traiter
                      </button>
                    )}

                    {quote.status === "PROCESSING" && (
                      <button
                        onClick={() => updateQuoteStatus(quote.id, "SENT")}
                        className="action-button send"
                      >
                        Marquer envoyé
                      </button>
                    )}

                    {quote.status === "SENT" && (
                      <>
                        <button
                          onClick={() =>
                            updateQuoteStatus(quote.id, "ACCEPTED")
                          }
                          className="action-button accept"
                        >
                          Accepté
                        </button>
                        <button
                          onClick={() =>
                            updateQuoteStatus(quote.id, "REJECTED")
                          }
                          className="action-button reject"
                        >
                          Refusé
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Modal d'édition des devis */}
        {isQuoteModalOpen && editingQuote && (
          <QuoteEditModal
            quote={editingQuote}
            onSave={handleSaveQuote}
            onClose={() => {
              setIsQuoteModalOpen(false);
              setEditingQuote(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Composant Modal pour l'édition des devis
function QuoteEditModal({
  quote,
  onSave,
  onClose,
}: {
  quote: Quote;
  onSave: (data: QuoteUpdate) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState<QuoteUpdate>({
    status: quote.status,
    quoteValidUntil: quote.quoteValidUntil
      ? quote.quoteValidUntil.split("T")[0]
      : "",
    quoteDocument: quote.quoteDocument || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="quote-modal-overlay" onClick={onClose}>
      <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quote-modal-header">
          <h4>
            Modifier le devis - {quote.contact.firstName}{" "}
            {quote.contact.lastName}
          </h4>
          <button className="quote-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="quote-modal-body">
            <div className="quote-form-group">
              <label>Statut</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="PENDING">En attente</option>
                <option value="PROCESSING">En cours</option>
                <option value="SENT">Envoyé</option>
                <option value="ACCEPTED">Accepté</option>
                <option value="REJECTED">Refusé</option>
                <option value="EXPIRED">Expiré</option>
              </select>
            </div>

            <div className="quote-form-group">
              <label>Valide jusqu'au</label>
              <input
                type="date"
                value={formData.quoteValidUntil}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quoteValidUntil: e.target.value,
                  }))
                }
              />
            </div>

            <div className="quote-form-group">
              <label>Document (URL)</label>
              <input
                type="url"
                value={formData.quoteDocument}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quoteDocument: e.target.value,
                  }))
                }
                placeholder="https://exemple.com/devis.pdf"
              />
            </div>
          </div>

          <div className="quote-modal-actions">
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
}
