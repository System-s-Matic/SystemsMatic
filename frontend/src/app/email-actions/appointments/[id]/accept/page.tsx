"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import "@/app/styles/appointment-actions.css";

interface AppointmentData {
  id: string;
  status: string;
  confirmedAt: string;
  scheduledAt?: string;
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export default function AcceptAppointmentPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);

  const id = params.id as string;
  const token = searchParams.get("token");

  useEffect(() => {
    if (!id || !token) {
      setStatus("error");
      setMessage("Paramètres manquants");
      return;
    }

    const acceptAppointment = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/email-actions/appointments/${id}/accept?token=${token}`,
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
        setMessage("Le rendez-vous a été accepté avec succès.");
        setAppointment(result.appointment);
        showSuccess("Rendez-vous accepté");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.message || "Erreur lors de l'acceptation du rendez-vous";
        setMessage(errorMessage);
        showError(errorMessage);
      }
    };

    acceptAppointment();
  }, [id, token]);

  if (status === "loading") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="loading-spinner"></div>
            <h2 className="appointment-action-title">
              Acceptation en cours...
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
              <h2 className="appointment-action-title">Rendez-vous accepté</h2>
              <p className="appointment-action-message">{message}</p>

              {appointment && (
                <div className="appointment-details">
                  <h3>Détails du rendez-vous</h3>
                  <div className="detail-item">
                    <strong>Client :</strong> {appointment.contact?.firstName}{" "}
                    {appointment.contact?.lastName}
                  </div>
                  <div className="detail-item">
                    <strong>Email :</strong> {appointment.contact?.email}
                  </div>
                  {appointment.contact?.phone && (
                    <div className="detail-item">
                      <strong>Téléphone :</strong> {appointment.contact.phone}
                    </div>
                  )}
                  {appointment.scheduledAt && (
                    <div className="detail-item">
                      <strong>Date prévue :</strong>{" "}
                      {new Date(appointment.scheduledAt).toLocaleString(
                        "fr-FR"
                      )}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Statut :</strong>{" "}
                    <span className="status-confirmed">Confirmé</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="error-icon">✗</div>
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
