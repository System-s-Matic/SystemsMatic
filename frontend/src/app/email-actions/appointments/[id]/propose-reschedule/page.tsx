"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import NativeDateTimePicker from "@/components/NativeDateTimePicker";
import {
  getMinimumBookingDate,
  getUserTimezone,
  getUserTimezoneDisplayName,
} from "@/lib/date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "@/app/styles/appointment-actions.css";

// Configuration des plugins dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

interface AppointmentData {
  id: string;
  status: string;
  requestedAt: string;
  timezone?: string;
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  reason?: string;
  message?: string;
}

export default function ProposeReschedulePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<
    "loading" | "form" | "submitting" | "success" | "error"
  >("loading");
  const [message, setMessage] = useState("");
  const [appointment, setAppointment] = useState<AppointmentData | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [timezoneDisplay, setTimezoneDisplay] = useState<string>("");

  const id = params.id as string;
  const token = searchParams.get("token");

  useEffect(() => {
    setTimezoneDisplay(getUserTimezoneDisplayName());
  }, []);

  useEffect(() => {
    if (!id || !token) {
      setStatus("error");
      setMessage("Paramètres manquants");
      return;
    }

    const loadAppointment = async () => {
      try {
        // Vérifier le token et charger les données du rendez-vous
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

        // Charger les détails du rendez-vous
        const appointmentResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/email-actions/appointments/${id}/details?token=${token}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (appointmentResponse.ok) {
          const appointmentData = await appointmentResponse.json();
          setAppointment(appointmentData.appointment);
        }

        setStatus("form");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.message || "Erreur lors du chargement du rendez-vous";
        setMessage(errorMessage);
        showError(errorMessage);
      }
    };

    loadAppointment();
  }, [id, token]);

  const handleDateChange = (date: Date | null) => {
    setSelectedDateTime(date);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDateTime) {
      showError("Veuillez sélectionner une nouvelle date");
      return;
    }

    setStatus("submitting");

    try {
      const year = selectedDateTime.getFullYear();
      const month = (selectedDateTime.getMonth() + 1)
        .toString()
        .padStart(2, "0");
      const day = selectedDateTime.getDate().toString().padStart(2, "0");
      const hours = selectedDateTime.getHours().toString().padStart(2, "0");
      const minutes = selectedDateTime.getMinutes().toString().padStart(2, "0");

      const localISOString = `${year}-${month}-${day}T${hours}:${minutes}:00.000`;
      const userTimezone = getUserTimezone();
      const dateWithOffset = dayjs.tz(localISOString, userTimezone).format();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/email-actions/appointments/${id}/propose-reschedule`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newScheduledAt: dateWithOffset,
            token,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setStatus("success");
      setMessage(
        "La nouvelle date a été proposée avec succès. Le client va recevoir un email de confirmation."
      );
      showSuccess("Reprogrammation proposée avec succès");
    } catch (error: any) {
      setStatus("form");
      const errorMessage =
        error.message || "Erreur lors de la proposition de reprogrammation";
      setMessage(errorMessage);
      showError(errorMessage);
    }
  };

  if (status === "loading") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="loading-spinner"></div>
            <h2 className="appointment-action-title">Chargement...</h2>
            <p className="appointment-action-message">
              Veuillez patienter pendant que nous chargeons les informations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "submitting") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="loading-spinner"></div>
            <h2 className="appointment-action-title">
              Envoi de la proposition...
            </h2>
            <p className="appointment-action-message">
              Veuillez patienter pendant que nous traitons votre demande.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="success-icon">✓</div>
            <h2 className="appointment-action-title">
              Reprogrammation proposée
            </h2>
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
                {selectedDateTime && (
                  <div className="detail-item">
                    <strong>Nouvelle date proposée :</strong>{" "}
                    {selectedDateTime.toLocaleString("fr-FR")}
                  </div>
                )}
              </div>
            )}

            <a href="/" className="appointment-action-button">
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="appointment-action-container">
        <div className="appointment-action-card">
          <div className="appointment-action-content">
            <div className="error-icon">✗</div>
            <h2 className="appointment-action-title">Erreur</h2>
            <p className="appointment-action-message">{message}</p>
            <a href="/" className="appointment-action-button">
              Retour à l&apos;accueil
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire de reprogrammation
  return (
    <div className="appointment-action-container">
      <div className="appointment-action-card reschedule-card">
        <div className="appointment-action-content">
          <h2 className="appointment-action-title">
            Proposer une nouvelle date
          </h2>
          <p className="appointment-action-message">
            Sélectionnez une nouvelle date pour ce rendez-vous
          </p>

          {appointment && (
            <div className="appointment-details">
              <h3>Rendez-vous actuel</h3>
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
              <div className="detail-item">
                <strong>Date demandée :</strong>{" "}
                {new Date(appointment.requestedAt).toLocaleString("fr-FR")}
              </div>
              {appointment.reason && (
                <div className="detail-item">
                  <strong>Motif :</strong> {appointment.reason}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="reschedule-form">
            <div className="form-group">
              <label className="form-label required">
                Nouvelle date et heure
              </label>
              <NativeDateTimePicker
                value={selectedDateTime}
                onChange={handleDateChange}
                className=""
                error={false}
              />
              <p className="form-help">
                Choisissez une nouvelle date (à partir du lendemain et dans un
                délai maximum d&apos;1 mois). Créneaux disponibles : 8h-12h et
                14h-17h (toutes les 30 minutes).
              </p>
              <p className="form-help timezone-info">
                <strong>Votre timezone détectée :</strong>{" "}
                {timezoneDisplay || "Chargement..."}
              </p>
            </div>

            {message && status === "form" && (
              <div className="error-message-box">
                <p>{message}</p>
              </div>
            )}

            <button
              type="submit"
              className="appointment-action-button"
              disabled={!selectedDateTime}
            >
              Proposer cette nouvelle date
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
