import axios from "axios";
import { CreateAppointmentDto } from "../types/appointment";

// Configuration de base d'axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 secondes
});

// Service pour les rendez-vous
export const appointmentService = {
  // Créer un nouveau rendez-vous
  create: async (data: CreateAppointmentDto) => {
    const response = await api.post("/appointments", data);
    return response.data;
  },

  // Confirmer un rendez-vous par token
  confirmByToken: async (id: string, token: string) => {
    const response = await api.get(`/appointments/${id}/confirm`, {
      params: { token },
    });
    return response.data;
  },

  // Annuler un rendez-vous par token
  cancelByToken: async (id: string, token: string) => {
    const response = await api.get(`/appointments/${id}/cancel`, {
      params: { token },
    });
    return response.data;
  },
};

export default api;
