import axios from "axios";
import { AppointmentStatus } from "../types/appointment";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Créer une instance axios avec intercepteur pour ajouter le token JWT
const createBackofficeApi = (token: string) => {
  const api = axios.create({
    baseURL: `${BACKEND_URL}/backoffice`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return api;
};

export const backofficeApi = {
  // Récupérer tous les rendez-vous ou filtrer par statut
  getAppointments: async (token: string, status?: AppointmentStatus) => {
    const api = createBackofficeApi(token);
    const params = status ? { status } : {};
    const response = await api.get("/appointments", { params });
    return response.data;
  },

  // Récupérer les statistiques
  getStats: async (token: string) => {
    const api = createBackofficeApi(token);
    const response = await api.get("/appointments/stats");
    return response.data;
  },

  // Récupérer les rendez-vous en attente
  getPendingAppointments: async (token: string) => {
    const api = createBackofficeApi(token);
    const response = await api.get("/appointments/pending");
    return response.data;
  },

  // Récupérer les rendez-vous à venir
  getUpcomingAppointments: async (token: string, days?: number) => {
    const api = createBackofficeApi(token);
    const params = days ? { days } : {};
    const response = await api.get("/appointments/upcoming", { params });
    return response.data;
  },

  // Récupérer un rendez-vous spécifique
  getAppointment: async (token: string, id: string) => {
    const api = createBackofficeApi(token);
    const response = await api.get(`/appointments/${id}`);
    return response.data;
  },

  // Mettre à jour le statut d'un rendez-vous
  updateAppointmentStatus: async (
    token: string,
    id: string,
    data: {
      status: AppointmentStatus;
      scheduledAt?: string;
    }
  ) => {
    const api = createBackofficeApi(token);
    const response = await api.put(`/appointments/${id}/status`, data);
    return response.data;
  },

  // Reprogrammer un rendez-vous
  rescheduleAppointment: async (
    token: string,
    id: string,
    data: {
      scheduledAt: string;
    }
  ) => {
    const api = createBackofficeApi(token);
    const response = await api.put(`/appointments/${id}/reschedule`, data);
    return response.data;
  },

  // Supprimer un rendez-vous
  deleteAppointment: async (token: string, id: string) => {
    const api = createBackofficeApi(token);
    const response = await api.delete(`/appointments/${id}`);
    return response.data;
  },

  // Envoyer un rappel
  sendReminder: async (token: string, id: string) => {
    const api = createBackofficeApi(token);
    const response = await api.post(`/appointments/${id}/reminder`);
    return response.data;
  },

  // Récupérer le profil utilisateur
  getProfile: async (token: string) => {
    const api = createBackofficeApi(token);
    const response = await api.get("/profile");
    return response.data;
  },
};
