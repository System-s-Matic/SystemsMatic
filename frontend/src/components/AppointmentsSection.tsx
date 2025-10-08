"use client";

import { useState } from "react";
import { Appointment, AppointmentStatus } from "@/types/appointment";
import { formatGuadeloupeDateTime } from "@/lib/date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import AdminDateTimePicker from "@/components/AdminDateTimePicker";
import { backofficeApi } from "@/lib/backoffice-api";
import { showSuccess, showError } from "@/lib/toast";

dayjs.extend(utc);
dayjs.extend(timezone);

interface AppointmentsSectionProps {
  appointments: Appointment[];
  loading: boolean;
  updateAppointmentStatus: (
    id: string,
    status: AppointmentStatus,
    scheduledAt?: string
  ) => void;
  deleteAppointment: (id: string) => void;
  sendReminder: (id: string) => void;
  getStatusLabel: (status: AppointmentStatus) => string;
  getStatusColor: (status: AppointmentStatus) => string;
  refreshAppointments: () => void;
}

export default function AppointmentsSection({
  appointments,
  loading,
  updateAppointmentStatus,
  deleteAppointment,
  sendReminder,
  getStatusLabel,
  getStatusColor,
  refreshAppointments,
}: AppointmentsSectionProps) {
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [selectedDateTime, setSelectedDateTime] = useState<string>("");

  const formatDate = (date: string | Date, timezone?: string) => {
    if (timezone) {
      return dayjs.utc(date).tz(timezone).format("DD/MM/YYYY HH:mm");
    }
    return formatGuadeloupeDateTime(date);
  };

  const formatRequestedDate = (date: string | Date, timezone?: string) => {
    if (timezone) {
      return dayjs.utc(date).tz(timezone).format("DD/MM/YYYY HH:mm");
    }
    return formatGuadeloupeDateTime(date);
  };

  const formatCreatedDate = (date: string | Date) => {
    return formatGuadeloupeDateTime(date);
  };

  const handleReschedule = async (
    appointmentId: string,
    selectedDateTime: string
  ) => {
    if (selectedDateTime) {
      try {
        await backofficeApi.proposeReschedule(appointmentId, selectedDateTime);
        showSuccess("Proposition de reprogrammation envoyée");
        setShowDatePicker(null);
        setSelectedDateTime("");
        // Rafraîchir la liste des rendez-vous pour mettre à jour l'affichage
        refreshAppointments();
      } catch (error) {
        console.error("Erreur lors de la reprogrammation:", error);
        showError("Erreur lors de la reprogrammation");
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner">
          <div className="admin-spinner-icon"></div>
          <span>Chargement des rendez-vous...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="appointments-list">
      {appointments.length === 0 ? (
        <p className="no-appointments">Aucun rendez-vous trouvé</p>
      ) : (
        appointments.map((appointment) => (
          <div
            key={appointment.id}
            className={`appointment-card ${getStatusColor(appointment.status)}`}
          >
            <div className="appointment-header">
              <h3>
                {appointment.contact.firstName} {appointment.contact.lastName}
              </h3>
              <span
                className={`status-badge ${getStatusColor(appointment.status)}`}
              >
                {getStatusLabel(appointment.status)}
              </span>
            </div>

            <div className="appointment-details">
              <p>
                <strong>Email :</strong> {appointment.contact.email}
              </p>
              <p>
                <strong>Téléphone :</strong>{" "}
                {appointment.contact.phone || "Non renseigné"}
              </p>
              <p>
                <strong>Demandé le :</strong>{" "}
                {formatRequestedDate(
                  appointment.requestedAt,
                  appointment.timezone
                )}
              </p>
              {appointment.scheduledAt && (
                <p>
                  <strong>Programmé le :</strong>{" "}
                  {formatDate(appointment.scheduledAt, appointment.timezone)}
                </p>
              )}
              <p>
                <strong>Créé le :</strong>{" "}
                {formatCreatedDate(appointment.createdAt)}
              </p>
              {appointment.message && (
                <p>
                  <strong>Message :</strong> {appointment.message}
                </p>
              )}
            </div>

            <div className="appointment-actions">
              {appointment.status === AppointmentStatus.PENDING && (
                <>
                  <button
                    onClick={() =>
                      updateAppointmentStatus(
                        appointment.id,
                        AppointmentStatus.CONFIRMED
                      )
                    }
                    className="action-button confirm"
                  >
                    Confirmer
                  </button>
                  <button
                    onClick={() => setShowDatePicker(appointment.id)}
                    className="action-button reschedule"
                  >
                    Reprogrammer
                  </button>
                  <button
                    onClick={() =>
                      updateAppointmentStatus(
                        appointment.id,
                        AppointmentStatus.REJECTED
                      )
                    }
                    className="action-button reject"
                  >
                    Rejeter
                  </button>
                </>
              )}
              {appointment.status === AppointmentStatus.CONFIRMED && (
                <button
                  onClick={() =>
                    updateAppointmentStatus(
                      appointment.id,
                      AppointmentStatus.COMPLETED
                    )
                  }
                  className="action-button complete"
                >
                  Marquer comme terminé
                </button>
              )}
              {appointment.status === AppointmentStatus.CONFIRMED &&
                appointment.scheduledAt && (
                  <button
                    onClick={() => sendReminder(appointment.id)}
                    className="action-button reminder"
                  >
                    Envoyer un rappel
                  </button>
                )}
              <button
                onClick={() => deleteAppointment(appointment.id)}
                className="action-button delete"
              >
                Supprimer
              </button>
            </div>

            {/* Sélecteur de date/heure pour la reprogrammation */}
            {showDatePicker === appointment.id && (
              <div className="date-picker-overlay">
                <div className="date-picker-modal">
                  <h4>Proposer une reprogrammation</h4>
                  <p className="reschedule-info">
                    Le client recevra un email avec la nouvelle proposition de
                    date/heure. Il pourra accepter ou refuser.
                  </p>
                  <AdminDateTimePicker
                    value={selectedDateTime}
                    onChange={setSelectedDateTime}
                    onConfirm={async () => {
                      await handleReschedule(appointment.id, selectedDateTime);
                    }}
                    onCancel={() => {
                      setShowDatePicker(null);
                      setSelectedDateTime("");
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
