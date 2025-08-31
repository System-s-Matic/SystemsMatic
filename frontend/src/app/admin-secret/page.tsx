"use client";

import { useState, useEffect } from "react";
import { Appointment, AppointmentStatus } from "../../types/appointment";
import { backofficeApi } from "../../lib/backoffice-api";
import { formatGuadeloupeDateTime } from "../../lib/date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "../../app/styles/admin-backoffice.css";

dayjs.extend(utc);
dayjs.extend(timezone);

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | "ALL">(
    AppointmentStatus.PENDING
  );
  const [stats, setStats] = useState<any>(null);

  const handleLogin = () => {
    const validUser = process.env.NEXT_PUBLIC_BASIC_AUTH_USER;
    const validPassword = process.env.NEXT_PUBLIC_BASIC_AUTH_PASS;

    if (username === validUser && password === validPassword) {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Identifiants incorrects");
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
      const data =
        filter === "ALL"
          ? await backofficeApi.getAppointments()
          : await backofficeApi.getAppointments(filter);

      setAppointments(data);
    } catch (error) {
      console.error("Erreur lors du chargement des rendez-vous:", error);
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
    }
  };

  const updateAppointmentStatus = async (
    id: string,
    status: AppointmentStatus,
    scheduledAt?: string
  ) => {
    try {
      await backofficeApi.updateAppointmentStatus(id, { status, scheduledAt });
      fetchAppointments();
      fetchStats();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const cancelAppointment = async (id: string) => {
    if (
      confirm(
        "Êtes-vous sûr de vouloir annuler ce rendez-vous ? Un email sera envoyé au client."
      )
    ) {
      try {
        await backofficeApi.cancelAppointment(id);
        fetchAppointments();
        fetchStats();
      } catch (error) {
        console.error("Erreur lors de l'annulation:", error);
      }
    }
  };

  const proposeReschedule = async (id: string) => {
    const scheduledAt = prompt("Nouvelle date et heure (YYYY-MM-DDTHH:MM):");
    if (scheduledAt) {
      try {
        await backofficeApi.proposeReschedule(id, { scheduledAt });
        fetchAppointments();
        alert("Proposition de reprogrammation envoyée au client");
      } catch (error) {
        console.error("Erreur lors de la proposition:", error);
      }
    }
  };

  const deleteAppointment = async (id: string) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce rendez-vous ?")) {
      try {
        await backofficeApi.deleteAppointment(id);
        fetchAppointments();
        fetchStats();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
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

  const getStatusClass = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return "pending";
      case AppointmentStatus.CONFIRMED:
        return "confirmed";
      case AppointmentStatus.CANCELLED:
        return "cancelled";
      case AppointmentStatus.REJECTED:
        return "rejected";
      case AppointmentStatus.COMPLETED:
        return "completed";
      default:
        return "";
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-content">
        {!isAuthenticated ? (
          <div className="auth-container">
            <h1 className="admin-title">Connexion Administration</h1>
            <div className="auth-form">
              <div className="auth-input-group">
                <label htmlFor="username">Nom d'utilisateur</label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="password">Mot de passe</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
              </div>
              {authError && <div className="auth-error">{authError}</div>}
              <button onClick={handleLogin} className="auth-button">
                Se connecter
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="admin-title">Administration - Rendez-vous</h1>
            <p className="admin-timezone-info">
              Heures affichées en fuseau horaire Guadeloupe (UTC-4)
            </p>

            {/* Statistiques */}
            {stats && (
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-number blue">{stats.total}</div>
                  <div className="stat-label">Total</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number yellow">{stats.pending}</div>
                  <div className="stat-label">En attente</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number green">{stats.confirmed}</div>
                  <div className="stat-label">Confirmés</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number red">{stats.cancelled}</div>
                  <div className="stat-label">Annulés</div>
                </div>
                <div className="stat-card">
                  <div className="stat-number purple">{stats.completed}</div>
                  <div className="stat-label">Terminés</div>
                </div>
              </div>
            )}

            {/* Filtres */}
            <div className="filters-container">
              <div className="filters-buttons">
                {[
                  "ALL",
                  AppointmentStatus.PENDING,
                  AppointmentStatus.CONFIRMED,
                  AppointmentStatus.CANCELLED,
                  AppointmentStatus.COMPLETED,
                ].map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setFilter(status as AppointmentStatus | "ALL")
                    }
                    className={`filter-button ${
                      filter === status ? "active" : ""
                    }`}
                  >
                    {status === "ALL"
                      ? "Tous"
                      : getStatusLabel(status as AppointmentStatus)}
                  </button>
                ))}
              </div>
            </div>

            {/* Liste des rendez-vous */}
            <div className="appointments-container">
              {loading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">Chargement...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="empty-state">Aucun rendez-vous trouvé</div>
              ) : (
                <div className="appointments-table-container">
                  <table className="appointments-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Date demandée</th>
                        <th>Date confirmée</th>
                        <th>Date création</th>
                        <th>Statut</th>
                        <th>Motif</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.map((appointment) => (
                        <tr key={appointment.id}>
                          <td>
                            <div className="client-info">
                              <div className="client-name">
                                {appointment.contact.firstName}{" "}
                                {appointment.contact.lastName}
                              </div>
                              <div className="client-email">
                                {appointment.contact.email}
                              </div>
                              {appointment.contact.phone && (
                                <div className="client-phone">
                                  {appointment.contact.phone}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="date-info">
                              {formatRequestedDate(appointment.requestedAt)}
                            </div>
                          </td>
                          <td>
                            <div className="date-info">
                              {appointment.scheduledAt
                                ? formatDate(appointment.scheduledAt)
                                : "-"}
                            </div>
                          </td>
                          <td>
                            <div className="date-info">
                              {formatCreatedDate(appointment.createdAt)}
                            </div>
                          </td>
                          <td>
                            <span
                              className={`status-badge ${getStatusClass(
                                appointment.status
                              )}`}
                            >
                              {getStatusLabel(appointment.status)}
                            </span>
                          </td>
                          <td>
                            <div className="reason-info">
                              {appointment.reason || "-"}
                            </div>
                            {appointment.reasonOther && (
                              <div className="reason-other">
                                {appointment.reasonOther}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="actions-container">
                              {appointment.status ===
                                AppointmentStatus.PENDING && (
                                <>
                                  <button
                                    onClick={() => {
                                      // Confirmer avec la date demandée + 2h
                                      const requestedDatePlus2h = dayjs
                                        .utc(appointment.requestedAt)
                                        .tz("America/Guadeloupe")
                                        .add(2, "hours")
                                        .toISOString();

                                      updateAppointmentStatus(
                                        appointment.id,
                                        AppointmentStatus.CONFIRMED,
                                        requestedDatePlus2h
                                      );
                                    }}
                                    className="action-button confirm"
                                    title="Confirmer avec la date demandée (+2h)"
                                  >
                                    ✓ Confirmer
                                  </button>
                                  <button
                                    onClick={() => {
                                      const scheduledAt = prompt(
                                        "Date et heure (YYYY-MM-DDTHH:MM):"
                                      );
                                      if (scheduledAt) {
                                        updateAppointmentStatus(
                                          appointment.id,
                                          AppointmentStatus.CONFIRMED,
                                          scheduledAt
                                        );
                                      }
                                    }}
                                    className="action-button reschedule"
                                    title="Confirmer avec une autre date"
                                  >
                                    📅 Autre date
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
                              {appointment.status ===
                                AppointmentStatus.CONFIRMED && (
                                <>
                                  <button
                                    onClick={() => {
                                      const scheduledAt = prompt(
                                        "Nouvelle date et heure (YYYY-MM-DDTHH:MM):"
                                      );
                                      if (scheduledAt) {
                                        updateAppointmentStatus(
                                          appointment.id,
                                          AppointmentStatus.CONFIRMED,
                                          scheduledAt
                                        );
                                      }
                                    }}
                                    className="action-button reschedule"
                                  >
                                    Reprogrammer
                                  </button>
                                  <button
                                    onClick={() =>
                                      proposeReschedule(appointment.id)
                                    }
                                    className="action-button propose"
                                  >
                                    Proposer
                                  </button>
                                </>
                              )}
                              {appointment.status !==
                                AppointmentStatus.CANCELLED && (
                                <button
                                  onClick={() =>
                                    cancelAppointment(appointment.id)
                                  }
                                  className="action-button cancel"
                                >
                                  Annuler
                                </button>
                              )}
                              <button
                                onClick={() =>
                                  deleteAppointment(appointment.id)
                                }
                                className="action-button delete"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
