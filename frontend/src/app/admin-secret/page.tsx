"use client";

import { useState, useEffect } from "react";
import { authApi } from "@/lib/auth-api";
import { AppointmentStatus } from "@/types/appointment";
import { showSuccess, showError } from "@/lib/toast";
import { useAppointments } from "@/hooks/useAppointments";
import { useQuotes } from "@/hooks/useQuotes";
import AdminLogin from "@/components/AdminLogin";
import StatsSection from "@/components/StatsSection";
import AppointmentsSection from "@/components/AppointmentsSection";
import QuotesSection from "@/components/QuotesSection";
import "@/app/styles/admin-backoffice.css";
import "@/app/styles/native-datetime-picker.css";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"appointments" | "quotes">(
    "appointments"
  );

  // États pour le rafraîchissement automatique
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeUntilNextRefresh, setTimeUntilNextRefresh] = useState(300); // 5 minutes en secondes

  // Hooks personnalisés
  const appointmentsHook = useAppointments();
  const quotesHook = useQuotes();

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

  const handleLoginSuccess = (userData: any) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "appointments") {
        appointmentsHook.fetchAppointments();
        appointmentsHook.fetchStats();
      } else {
        quotesHook.fetchQuotes();
        quotesHook.fetchQuotesStats();
      }
    }
  }, [
    appointmentsHook.filter,
    quotesHook.quotesFilter,
    isAuthenticated,
    activeTab,
  ]);

  // Rafraîchissement automatique toutes les 5 minutes
  useEffect(() => {
    if (!isAuthenticated) return;

    const interval = setInterval(() => {
      if (activeTab === "appointments") {
        appointmentsHook.fetchAppointments();
        appointmentsHook.fetchStats();
      } else {
        quotesHook.fetchQuotes();
        quotesHook.fetchQuotesStats();
      }
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300); // Reset à 5 minutes
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [
    isAuthenticated,
    activeTab,
    appointmentsHook.filter,
    quotesHook.quotesFilter,
  ]);

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

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === "appointments") {
        await appointmentsHook.fetchAppointments();
        await appointmentsHook.fetchStats();
      } else {
        await quotesHook.fetchQuotes();
        await quotesHook.fetchQuotesStats();
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

  const handleLogout = async () => {
    try {
      await authApi.logout();
      setUser(null);
      setIsAuthenticated(false);
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300);
      setIsRefreshing(false);
      showSuccess("Déconnexion réussie");
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Forcer la déconnexion même en cas d'erreur
      setUser(null);
      setIsAuthenticated(false);
      setLastRefresh(new Date());
      setTimeUntilNextRefresh(300);
      setIsRefreshing(false);
      showError("Erreur lors de la déconnexion");
    }
  };

  // Fonction pour formater le temps restant
  const formatTimeRemaining = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
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
              value={appointmentsHook.filter}
              onChange={(e) =>
                appointmentsHook.setFilter(
                  e.target.value as AppointmentStatus | "ALL"
                )
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
              value={quotesHook.quotesFilter}
              onChange={(e) => quotesHook.setQuotesFilter(e.target.value)}
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
      <StatsSection
        activeTab={activeTab}
        stats={appointmentsHook.stats}
        quotesStats={quotesHook.quotesStats}
      />

      <div className="admin-content">
        {activeTab === "appointments" ? (
          <AppointmentsSection
            appointments={appointmentsHook.appointments}
            loading={appointmentsHook.loading}
            updateAppointmentStatus={appointmentsHook.updateAppointmentStatus}
            deleteAppointment={appointmentsHook.deleteAppointment}
            sendReminder={appointmentsHook.sendReminder}
            getStatusLabel={appointmentsHook.getStatusLabel}
            getStatusColor={appointmentsHook.getStatusColor}
          />
        ) : (
          <QuotesSection
            quotes={quotesHook.quotes}
            quotesLoading={quotesHook.quotesLoading}
            quotesStats={quotesHook.quotesStats}
            quotesFilter={quotesHook.quotesFilter}
            setQuotesFilter={quotesHook.setQuotesFilter}
            updateQuoteStatus={quotesHook.updateQuoteStatus}
            handleSaveQuote={quotesHook.handleSaveQuote}
            confirmAcceptQuote={quotesHook.confirmAcceptQuote}
            confirmRejectQuote={quotesHook.confirmRejectQuote}
            getQuoteStatusLabel={quotesHook.getQuoteStatusLabel}
            getQuoteStatusColor={quotesHook.getQuoteStatusColor}
          />
        )}
      </div>
    </div>
  );
}
