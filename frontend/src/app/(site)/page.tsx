"use client";

import { useState } from "react";
import axios from "axios";
import AppointmentForm from "../../components/AppointmentForm";
import { appointmentService } from "../../lib/api";
import { CreateAppointmentDto } from "../../types/appointment";

export default function Home() {
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
    <div className="home-container">
      <div className="home-content">
        {/* Header */}
        <div className="home-header">
          <h1 className="home-title">SystemsMatic</h1>
          <p className="home-subtitle">
            Prenez rendez-vous pour vos services informatiques
          </p>
          <div className="services-section">
            <h2 className="services-title">Nos Services</h2>
            <div className="services-grid">
              <div className="service-card">
                <div className="service-icon diagnostic">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="service-name">Diagnostic</h3>
                <p className="service-description">
                  Analyse complète de vos systèmes
                </p>
              </div>
              <div className="service-card">
                <div className="service-icon installation">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h3 className="service-name">Installation</h3>
                <p className="service-description">
                  Mise en place de solutions
                </p>
              </div>
              <div className="service-card">
                <div className="service-icon maintenance">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <h3 className="service-name">Maintenance</h3>
                <p className="service-description">Entretien et optimisation</p>
              </div>
            </div>
          </div>
        </div>

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
              Nous avons reçu votre demande de rendez-vous. Vous recevrez
              bientôt un email de confirmation avec les détails de votre
              rendez-vous.
            </p>
            <button
              onClick={() => setIsFormSubmitted(false)}
              className="success-button"
            >
              Prendre un autre rendez-vous
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
