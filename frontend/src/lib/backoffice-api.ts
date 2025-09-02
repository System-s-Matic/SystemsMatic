import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Instance axios pour le backoffice avec cookies automatiques
const backofficeClient = axios.create({
  baseURL: `${API_BASE_URL}/backoffice`,
  withCredentials: true, // Important pour envoyer les cookies
});

// Types
export interface AppointmentStatusUpdate {
  status: string;
  scheduledAt?: string;
}

// API du backoffice
export const backofficeApi = {
  // Récupérer tous les rendez-vous ou filtrer par statut
  getAppointments: async (filter?: string) => {
    const params = filter && filter !== "ALL" ? { status: filter } : {};
    const response = await backofficeClient.get("/appointments", { params });
    return response.data;
  },

  // Mettre à jour le statut d'un rendez-vous
  updateAppointmentStatus: async (
    id: string,
    data: AppointmentStatusUpdate
  ) => {
    const response = await backofficeClient.put(
      `/appointments/${id}/status`,
      data
    );
    return response.data;
  },

  // Supprimer un rendez-vous
  deleteAppointment: async (id: string) => {
    const response = await backofficeClient.delete(`/appointments/${id}`);
    return response.data;
  },

  // Envoyer un rappel
  sendReminder: async (id: string) => {
    const response = await backofficeClient.post(
      `/appointments/${id}/reminder`
    );
    return response.data;
  },

  // Proposer une reprogrammation
  proposeReschedule: async (id: string, newScheduledAt: string) => {
    const response = await backofficeClient.post(
      `/appointments/${id}/reschedule`,
      { newScheduledAt }
    );
    return response.data;
  },

  // Récupérer les statistiques
  getStats: async () => {
    const response = await backofficeClient.get("/stats");
    return response.data;
  },

  // Récupérer le profil de l'utilisateur connecté
  getProfile: async () => {
    const response = await backofficeClient.get("/profile");
    return response.data;
  },
};
