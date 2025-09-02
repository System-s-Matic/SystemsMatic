"use client";

import { useState, useEffect } from "react";
import { Appointment, AppointmentStatus } from "../../types/appointment";
import { backofficeApi } from "../../lib/backoffice-api";
import { authApi, LoginCredentials } from "../../lib/auth-api";
import { authCookies } from "../../lib/auth-cookies";
import { formatGuadeloupeDateTime } from "../../lib/date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "../../app/styles/admin-backoffice.css";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
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

  // Vérifier le token au chargement
  useEffect(() => {
    const storedToken = authCookies.getToken();
    const storedUser = authCookies.getUser();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setIsAuthenticated(true);

      // Vérifier la validité du token en récupérant le profil
      authApi
        .getProfile(storedToken)
        .then((userProfile) => {
          // Mettre à jour les cookies avec les données fraîches
          authCookies.setUser(userProfile);
          setUser(userProfile);
        })
        .catch(() => {
          // Token invalide, nettoyer les cookies
          authCookies.clear();
          setToken(null);
          setUser(null);
          setIsAuthenticated(false);
        });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError("");

    try {
      const response = await authApi.login({ email, password });
      const { access_token, user: userData } = response;

      // Stocker dans les cookies
      authCookies.setToken(access_token);
      authCookies.setUser(userData);

      setToken(access_token);
      setUser(userData);
      setIsAuthenticated(true);
      setAuthError("");
    } catch (error: any) {
      setAuthError(error.response?.data?.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && token) {
      fetchAppointments();
      fetchStats();
    }
  }, [filter, isAuthenticated, token]);

  const fetchAppointments = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const data =
        filter === "ALL"
          ? await backofficeApi.getAppointments(token)
          : await backofficeApi.getAppointments(token, filter);

      setAppointments(data);
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!token) return;

    try {
      const data = await backofficeApi.getStats(token);
      setStats(data);
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
    }
  };

  const updateAppointmentStatus = async (
    id: string,
    status: AppointmentStatus,
    scheduledAt?: string
  ) => {
    if (!token) return;

    try {
      await backofficeApi.updateAppointmentStatus(token, id, {
        status,
        scheduledAt,
      });
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const deleteAppointment = async (id: string) => {
    if (!token) return;

    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      try {
        await backofficeApi.deleteAppointment(token, id);
        fetchAppointments();
        fetchStats();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const sendReminder = async (id: string) => {
    if (!token) return;

    try {
      await backofficeApi.sendReminder(token, id);
      alert("Rappel envoyé avec succès");
    } catch (error) {
      console.error("Erreur lors de l'envoi du rappel:", error);
    }
  };

  const handleLogout = () => {
    // Nettoyer les cookies et l'état local
    authCookies.clear();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    setAppointments([]);
    setStats(null);
  };

  const formatDate = (date: string | Date) => {
    return formatGuadeloupeDateTime(date);
  };

  const formatRequestedDate = (date: string | Date) => {
    // Ajouter 2 heures à la date requestedAt
    return dayjs
      .utc(date)
      .tz("America/Guadeloupe")
      .add(2, "hours")
      .format("DD/MM/YYYY HH:mm");
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
          <button
            onClick={handleLogout}
            className="admin-login-button"
            style={{ marginLeft: "1rem" }}
          >
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
          <div className="stat-card">
            <h3>Total</h3>
            <p>{stats.total || 0}</p>
          </div>
          <div className="stat-card">
            <h3>En attente</h3>
            <p>{stats.pending || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Confirmés</h3>
            <p>{stats.confirmed || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Terminés</h3>
            <p>{stats.completed || 0}</p>
          </div>
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
                      {formatRequestedDate(appointment.requestedAt)}
                    </p>
                    {appointment.scheduledAt && (
                      <p>
                        <strong>Programmé le :</strong>{" "}
                        {formatDate(appointment.scheduledAt)}
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
                    <button
                      onClick={() => sendReminder(appointment.id)}
                      className="action-button reminder"
                    >
                      Envoyer un rappel
                    </button>
                    <button
                      onClick={() => deleteAppointment(appointment.id)}
                      className="action-button delete"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
