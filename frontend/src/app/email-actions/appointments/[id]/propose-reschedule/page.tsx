"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import "@/app/styles/appointment-actions.css";

export default function ProposeReschedulePage() {
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

    const proposeReschedule = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/email-actions/appointments/${id}/propose-reschedule?token=${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        setStatus("success");
        setMessage(
          "Action de reprogrammation initiée. Veuillez contacter le client pour proposer une nouvelle date."
        );
        showSuccess("Action de reprogrammation initiée");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.message || "Erreur lors de l'initiation de la reprogrammation";
        setMessage(errorMessage);
        showError(errorMessage);
      }
    };

    proposeReschedule();
  }, [id, token]);

  if (status === "loading") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="loading-spinner"></div>
            <h2 className="appointment-action-title">Initiation en cours...</h2>
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
              <h2 className="appointment-action-title">
                Reprogrammation initiée
              </h2>
              <p className="appointment-action-message">{message}</p>

              <div className="appointment-details">
                <h3>Prochaines étapes</h3>
                <div className="detail-item">
                  <strong>1.</strong> Contactez le client par téléphone ou email
                </div>
                <div className="detail-item">
                  <strong>2.</strong> Proposez-lui de nouvelles dates
                  disponibles
                </div>
                <div className="detail-item">
                  <strong>3.</strong> Confirmez la nouvelle date une fois
                  acceptée
                </div>
              </div>
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
