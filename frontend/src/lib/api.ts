import axios from "axios";
import { CreateAppointmentDto } from "../types/appointment";

// Types pour les devis
export interface CreateQuoteDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  message: string;
  acceptPhone: boolean;
  acceptTerms: boolean;
}

// Configuration de base d'axios
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
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

  // Accepter une demande de reprogrammation
  acceptReschedule: async (id: string, token: string) => {
    const response = await api.get(`/appointments/${id}/accept-reschedule`, {
      params: { token },
    });
    return response.data;
  },

  // Refuser une demande de reprogrammation
  rejectReschedule: async (id: string, token: string) => {
    const response = await api.get(`/appointments/${id}/reject-reschedule`, {
      params: { token },
    });
    return response.data;
  },
};

// Service pour les devis
export const quoteService = {
  // Créer une nouvelle demande de devis
  create: async (data: CreateQuoteDto) => {
    const response = await api.post("/quotes", data);
    return response.data;
  },
};

// Export des méthodes pour faciliter l'utilisation
export const appointmentApi = {
  ...appointmentService,
  ...quoteService,
};

export default api;
