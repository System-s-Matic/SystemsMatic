"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { appointmentService } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import "@/app/styles/appointment-actions.css";

export default function ConfirmReschedulePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  const id = params.id as string;
  const token = searchParams.get("token");

  useEffect(() => {
    if (!id || !token) {
      setStatus("error");
      setMessage("Paramètres manquants");
      return;
    }

    const confirmReschedule = async () => {
      try {
        const result = await appointmentService.confirmByToken(id, token);
        setStatus("success");
        setMessage(
          "Votre rendez-vous a été confirmé avec la nouvelle date proposée."
        );
        showSuccess("Rendez-vous confirmé avec succès");
      } catch (error: unknown) {
        setStatus("error");
        let errorMessage = "Erreur lors de la confirmation du rendez-vous";
        if (
          typeof error === "object" &&
          error !== null &&
          "response" in error
        ) {
          const axiosLikeError = error as {
            response?: { data?: { message?: string } };
          };
          errorMessage = axiosLikeError.response?.data?.message || errorMessage;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }
        setMessage(errorMessage);
        showError(errorMessage);
      }
    };

    confirmReschedule();
  }, [id, token]);

  if (status === "loading") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="loading-spinner"></div>
            <h2 className="appointment-action-title">
              Confirmation en cours...
            </h2>
            <p className="appointment-action-message">
              Veuillez patienter pendant que nous traitons votre demande.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-action-container">
      <div className="appointment-action-card">
        <div className="appointment-action-content">
          {status === "success" ? (
            <>
              <div className="success-icon">✓</div>
              <h2 className="appointment-action-title">Rendez-vous confirmé</h2>
              <p className="appointment-action-message">{message}</p>
            </>
          ) : (
            <>
              <div className="success-icon">✗</div>
              <h2 className="appointment-action-title">Erreur</h2>
              <p className="appointment-action-message">{message}</p>
            </>
          )}

          <a href="/" className="appointment-action-button">
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}
