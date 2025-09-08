"use client";

import { useState } from "react";
import axios from "axios";
import AppointmentForm from "./AppointmentForm";
import { appointmentService } from "../lib/api";
import { CreateAppointmentDto } from "../types/appointment";

export default function AppointmentSection() {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: CreateAppointmentDto) => {
    try {
      setError(null);
      console.log("Envoi de la demande de rendez-vous:", formData);

      const result = await appointmentService.create(formData);
      console.log("Rendez-vous créé avec succès:", result);

      setIsFormSubmitted(true);
    } catch (error) {
      console.error("Erreur lors de la création du rendez-vous:", error);

      if (axios.isAxiosError(error)) {
        // Gestion des erreurs axios
        if (error.response) {
          // Erreur de réponse du serveur
          const errorMessage =
            error.response.data?.message ||
            `Erreur ${error.response.status}: ${error.response.statusText}`;
          setError(errorMessage);
        } else if (error.request) {
          // Erreur de réseau (pas de réponse)
          setError(
            "Impossible de contacter le serveur. Vérifiez votre connexion internet."
          );
        } else {
          // Autre erreur
          setError(error.message || "Une erreur inattendue s'est produite.");
        }
      } else {
        // Erreur non-axios
        setError(
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer."
        );
      }
    }
  };

  return (
    <>
      {/* Message d'erreur */}
      {error && (
        <div className="error-container">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Formulaire de rendez-vous */}
      {!isFormSubmitted ? (
        <div className="appointment-form-container">
          <h2 className="form-title">Prendre un rendez-vous</h2>
          <AppointmentForm onSubmit={handleFormSubmit} />
        </div>
      ) : (
        <div className="success-container">
          <div className="success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="success-title">Demande envoyée avec succès !</h2>
          <p className="success-message">
            Nous avons reçu votre demande de rendez-vous. Vous recevrez bientôt
            un email de confirmation avec les détails de votre rendez-vous.
          </p>
          <button
            onClick={() => setIsFormSubmitted(false)}
            className="success-button"
          >
            Prendre un autre rendez-vous
          </button>
        </div>
      )}
    </>
  );
}
