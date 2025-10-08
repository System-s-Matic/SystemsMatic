"use client";

import { useState, useEffect } from "react";
import { backofficeApi } from "@/lib/backoffice-api";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { showSuccess, showError } from "@/lib/toast";

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | "ALL">("ALL");
  const [stats, setStats] = useState<any>(null);

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

  // Fonctions utilitaires pour les rendez-vous
  const getStatusLabel = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return "En attente";
      case AppointmentStatus.CONFIRMED:
        return "Confirmé";
      case AppointmentStatus.RESCHEDULED:
        return "Demande de reprogrammation en cours";
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

  return {
    appointments,
    loading,
    filter,
    setFilter,
    stats,
    fetchAppointments,
    fetchStats,
    updateAppointmentStatus,
    deleteAppointment,
    sendReminder,
    getStatusLabel,
    getStatusColor,
  };
}
