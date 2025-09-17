"use client";

import { useState, useEffect } from "react";
import { backofficeApi } from "@/lib/backoffice-api";
import { authApi, LoginData } from "@/lib/auth-api";
import {
  Appointment,
  AppointmentStatus,
  AppointmentReason,
} from "@/types/appointment";
import {
  formatGuadeloupeDateTime,
  formatLocalStoredDateTime,
} from "@/lib/date-utils";
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
      fetchAppointments();
      fetchStats();
    }
  }, [filter, isAuthenticated]);

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
      setStats(null);
      showSuccess("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
      setIsAuthenticated(false);
      setAppointments([]);
      setStats(null);
      showError("Erreur lors de la déconnexion");
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

      <div className="admin-filters">
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
      </div>

      {stats && (
        <div className="admin-stats">
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

      <div className="admin-content">
        {loading ? (
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
                                showError("Erreur lors de la reprogrammation");
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
        )}
      </div>
    </div>
  );
}
