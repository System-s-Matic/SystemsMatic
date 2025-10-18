"use client";

import { useState } from "react";
import axios from "axios";
import AppointmentForm from "./AppointmentForm";
import { appointmentService } from "../lib/api";
import { CreateAppointmentDto } from "../types/appointment";
import { showError } from "../lib/toast";

export default function AppointmentSection() {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (formData: CreateAppointmentDto) => {
    try {
      setError(null);

      const result = await appointmentService.create(formData);

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
          showError(errorMessage);
        } else if (error.request) {
          // Erreur de réseau (pas de réponse)
          const networkError =
            "Impossible de contacter le serveur. Vérifiez votre connexion internet.";
          setError(networkError);
          showError(networkError);
        } else {
          // Autre erreur
          const otherError =
            error.message || "Une erreur inattendue s'est produite.";
          setError(otherError);
          showError(otherError);
        }
      } else {
        // Erreur non-axios
        const genericError =
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer.";
        setError(genericError);
        showError(genericError);
      }
    }
  };

  return (
    <>
      {/* Message d'erreur */}
      {error && (
        <div className="error-container" role="alert" aria-live="polite">
          <p className="error-message">{error}</p>
        </div>
      )}

      {/* Formulaire de rendez-vous */}
      {!isFormSubmitted ? (
        <div id="appointment-form" className="appointment-form-container">
          <AppointmentForm onSubmit={handleFormSubmit} />
        </div>
      ) : (
        <div className="success-container">
          <div className="success-icon" aria-hidden="true">
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
            aria-label="Demander un nouveau rendez-vous"
          >
            Prendre un autre rendez-vous
          </button>
        </div>
      )}
    </>
  );
}
