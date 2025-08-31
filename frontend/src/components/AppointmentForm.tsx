"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { CreateAppointmentDto, AppointmentReason } from "../types/appointment";

interface AppointmentFormProps {
  onSubmit: (data: CreateAppointmentDto) => Promise<void>;
}

export default function AppointmentForm({ onSubmit }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtherReason, setShowOtherReason] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<CreateAppointmentDto>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      reason: undefined,
      reasonOther: "",
      message: "",
      consent: false,
    },
  });

  const selectedReason = watch("reason");

  const onSubmitForm = async (data: CreateAppointmentDto) => {
    setIsSubmitting(true);
    try {
      const cleanedData = {
        ...data,
        reasonOther: data.reason === "AUTRE" ? data.reasonOther : undefined,
        phone: data.phone || undefined,
        message: data.message || undefined,
      };

      await onSubmit(cleanedData);
      reset();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
            J'accepte que mes données personnelles soient traitées dans le cadre
            de ma demande de rendez-vous.
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
  );
}
