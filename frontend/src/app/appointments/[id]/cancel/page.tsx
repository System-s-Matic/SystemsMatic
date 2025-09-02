"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { appointmentService } from "@/lib/api";
import { showSuccess, showError } from "@/lib/toast";
import "../../../styles/appointment-actions.css";

export default function CancelAppointmentPage() {
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

    const cancelAppointment = async () => {
      try {
        const result = await appointmentService.cancelByToken(id, token);
        setStatus("success");
        setMessage("Votre rendez-vous a été annulé avec succès.");
        showSuccess("Rendez-vous annulé avec succès");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.response?.data?.message ||
          "Erreur lors de l'annulation du rendez-vous";
        setMessage(errorMessage);
        showError(errorMessage);
      }
    };

    cancelAppointment();
  }, [id, token]);

  if (status === "loading") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="loading-spinner"></div>
            <h2 className="appointment-action-title">Annulation en cours...</h2>
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
              <h2 className="appointment-action-title">Rendez-vous annulé</h2>
              <p className="appointment-action-message">{message}</p>
            </>
          ) : (
            <>
              <div className="error-icon">✗</div>
              <h2 className="appointment-action-title">Erreur</h2>
              <p className="appointment-action-message">{message}</p>
            </>
          )}

          <a href="/" className="appointment-action-button">
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  );
}
