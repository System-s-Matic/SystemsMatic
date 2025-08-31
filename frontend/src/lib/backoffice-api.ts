import axios from "axios";
import { AppointmentStatus } from "../types/appointment";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: `${BACKEND_URL}/backoffice`,
  headers: {
    "x-admin-key":
      process.env.NEXT_PUBLIC_ADMIN_API_KEY || "admin-secret-key-2024",
  },
});

export const backofficeApi = {
  // Récupérer tous les rendez-vous ou filtrer par statut
  getAppointments: async (status?: AppointmentStatus) => {
    const params = status ? { status } : {};
    const response = await api.get("/appointments", { params });
    return response.data;
  },

  // Récupérer les statistiques
  getStats: async () => {
    const response = await api.get("/appointments/stats");
    return response.data;
  },

  // Récupérer les rendez-vous en attente
  getPendingAppointments: async () => {
    const response = await api.get("/appointments/pending");
    return response.data;
  },

  // Récupérer les rendez-vous à venir
  getUpcomingAppointments: async (days?: number) => {
    const params = days ? { days } : {};
    const response = await api.get("/appointments/upcoming", { params });
    return response.data;
  },

  // Récupérer un rendez-vous spécifique
  getAppointment: async (id: string) => {
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Mettre à jour le statut d'un rendez-vous
  updateAppointmentStatus: async (
    id: string,
    data: {
      status: AppointmentStatus;
      scheduledAt?: string;
    }
  ) => {
    const response = await api.put(`/appointments/${id}/status`, data);
    return response.data;
  },

  // Reprogrammer un rendez-vous
  rescheduleAppointment: async (
    id: string,
    data: {
      scheduledAt: string;
    }
  ) => {
    const response = await api.put(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Supprimer un rendez-vous
  deleteAppointment: async (id: string) => {
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  // Envoyer un rappel
  sendReminder: async (id: string) => {
    const response = await api.post(`/appointments/${id}/reminder`);
    return response.data;
  },

  // Annuler un rendez-vous (admin)
  cancelAppointment: async (id: string) => {
    const response = await api.put(`/appointments/${id}/cancel`);
    return response.data;
  },

  // Proposer une reprogrammation de rendez-vous
  proposeReschedule: async (
    id: string,
    data: {
      scheduledAt: string;
    }
  ) => {
    const response = await api.put(
      `/appointments/${id}/propose-reschedule`,
      data
    );
    return response.data;
  },
};
