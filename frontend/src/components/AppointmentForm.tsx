"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import NativeDateTimePicker from "./NativeDateTimePicker";
import { CreateAppointmentDto, AppointmentReason } from "../types/appointment";
import {
  getCurrentGuadeloupeTime,
  getMinimumBookingDate,
  convertToUTC,
  getUserTimezone,
  getUserTimezoneDisplayName,
} from "../lib/date-utils";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

// Configuration des plugins dayjs
dayjs.extend(utc);
dayjs.extend(timezone);

// Import des styles CSS
import "../app/styles/appointment-form.css";
import "../app/styles/native-datetime-picker.css";

interface AppointmentFormProps {
  onSubmit: (data: CreateAppointmentDto) => Promise<void>;
}

/**
 * Formulaire de demande de rendez-vous avec gestion des timezones
 * @param onSubmit Fonction appelée lors de la soumission
 */
export default function AppointmentForm({ onSubmit }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showOtherReason, setShowOtherReason] = useState<boolean>(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Date | null>(null);
  const [timezoneDisplay, setTimezoneDisplay] = useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setValue,
  } = useForm<CreateAppointmentDto>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      reason: undefined,
      reasonOther: "",
      message: "",
      requestedAt: "",
      timezone: getUserTimezone(),
      consent: false,
    },
  });

  const selectedReason = watch("reason");

  useEffect(() => {
    setTimezoneDisplay(getUserTimezoneDisplayName());
  }, []);

  const handleDateChange = useCallback((date: Date | null) => {
    setSelectedDateTime(date);
  }, []);
  useEffect(() => {
    if (selectedDateTime) {
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
      setValue("requestedAt", dateWithOffset);
    }
  }, [selectedDateTime, setValue]);

  /**
   * Gestionnaire de soumission du formulaire
   * @param data Données validées du formulaire
   */
  const onSubmitForm = async (data: CreateAppointmentDto) => {
    setIsSubmitting(true);

    try {
      const cleanedData: CreateAppointmentDto = {
        ...data,
        reasonOther: data.reason === "AUTRE" ? data.reasonOther : undefined,
        phone: data.phone || undefined,
        message: data.message || undefined,
        requestedAt: data.requestedAt,
        timezone: data.timezone || getUserTimezone(),
      };

      await onSubmit(cleanedData);
      reset();
      setSelectedDateTime(null);
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="appointment-form-container">
      <div className="appointment-form-header">
        <h2 className="appointment-form-title">Demander un rendez-vous</h2>
        <p className="appointment-form-subtitle">
          Choisissez votre créneau préféré et nous vous confirmerons la
          disponibilité
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmitForm)} className="appointment-form">
        {/* Informations personnelles */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="form-label required">
              Prénom
            </label>
            <input
              type="text"
              id="firstName"
              {...register("firstName", { required: "Le prénom est requis" })}
              className={`form-input ${errors.firstName ? "error" : ""}`}
              placeholder="Votre prénom"
            />
            {errors.firstName && (
              <p className="form-error">{errors.firstName.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="lastName" className="form-label required">
              Nom
            </label>
            <input
              type="text"
              id="lastName"
              {...register("lastName", { required: "Le nom est requis" })}
              className={`form-input ${errors.lastName ? "error" : ""}`}
              placeholder="Votre nom"
            />
            {errors.lastName && (
              <p className="form-error">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label required">
            Email
          </label>
          <input
            type="email"
            id="email"
            {...register("email", {
              required: "L'email est requis",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Adresse email invalide",
              },
            })}
            className={`form-input ${errors.email ? "error" : ""}`}
            placeholder="votre.email@exemple.com"
          />
          {errors.email && <p className="form-error">{errors.email.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Téléphone
          </label>
          <input
            type="tel"
            id="phone"
            {...register("phone")}
            className="form-input"
            placeholder="0690 12 34 56"
          />
        </div>

        {/* Sélection de date et heure */}
        <div className="form-group">
          <label className="form-label required">
            Date et heure souhaitées
          </label>

          <NativeDateTimePicker
            value={selectedDateTime}
            onChange={handleDateChange}
            className={errors.requestedAt ? "error" : ""}
            error={!!errors.requestedAt}
          />

          {errors.requestedAt && (
            <p className="form-error">{errors.requestedAt.message}</p>
          )}
          <p className="form-help">
            Choisissez votre créneau préféré (à partir du lendemain et dans un
            délai maximum d'1 mois). Créneaux disponibles : 8h-12h et 14h-17h
            (toutes les 30 minutes). Nous vous confirmerons la disponibilité et
            vous proposerons un horaire définitif.
          </p>
          <p className="form-help timezone-info">
            <strong>Votre timezone détectée :</strong>{" "}
            {timezoneDisplay || "Chargement..."}
          </p>
        </div>

        {/* Motif du rendez-vous */}
        <div className="form-group">
          <label htmlFor="reason" className="form-label">
            Motif du rendez-vous
          </label>
          <select
            id="reason"
            {...register("reason")}
            onChange={(e) => setShowOtherReason(e.target.value === "AUTRE")}
            className="form-select"
          >
            <option value="">Sélectionnez un motif</option>
            <option value={AppointmentReason.DIAGNOSTIC}>Diagnostic</option>
            <option value={AppointmentReason.INSTALLATION}>Installation</option>
            <option value={AppointmentReason.MAINTENANCE}>Maintenance</option>
            <option value={AppointmentReason.AUTRE}>Autre</option>
          </select>
        </div>

        {showOtherReason && (
          <div className="form-group">
            <label htmlFor="reasonOther" className="form-label">
              Précisez le motif
            </label>
            <input
              type="text"
              id="reasonOther"
              {...register("reasonOther")}
              className="form-input"
              placeholder="Décrivez votre besoin"
            />
          </div>
        )}

        {/* Message */}
        <div className="form-group">
          <label htmlFor="message" className="form-label">
            Message (optionnel)
          </label>
          <textarea
            id="message"
            {...register("message")}
            rows={4}
            className="form-textarea"
            placeholder="Décrivez votre problème ou vos besoins..."
          />
        </div>

        {/* Consentement */}
        <div className="form-checkbox-group">
          <input
            type="checkbox"
            id="consent"
            {...register("consent", {
              required: "Vous devez accepter les conditions",
            })}
            className="form-checkbox"
          />
          <div className="form-checkbox-label">
            <label htmlFor="consent">
              J'accepte que mes données personnelles soient traitées dans le
              cadre de ma demande de rendez-vous.
            </label>
            {errors.consent && (
              <p className="form-error">{errors.consent.message}</p>
            )}
          </div>
        </div>

        {/* Bouton de soumission */}
        <button type="submit" disabled={isSubmitting} className="form-submit">
          {isSubmitting ? (
            <>
              <div className="form-spinner"></div>
              Envoi en cours...
            </>
          ) : (
            "Demander un rendez-vous"
          )}
        </button>
      </form>
    </div>
  );
}
