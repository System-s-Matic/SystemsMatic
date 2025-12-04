"use client";

import { useState } from "react";
import { showSuccess, showError } from "../lib/toast";
import { quoteService, CreateQuoteDto } from "../lib/api";
import { sanitizers } from "../lib/validation";

type QuoteFormData = CreateQuoteDto;

export default function QuoteForm() {
  const [formData, setFormData] = useState<QuoteFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    acceptPhone: false,
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Partial<QuoteFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<QuoteFormData> = {};

    // Sanitiser les données avant validation
    const sanitizedFirstName = sanitizers.name(formData.firstName);
    const sanitizedLastName = sanitizers.name(formData.lastName);
    const sanitizedEmail = formData.email.trim().toLowerCase();
    const sanitizedPhone = formData.phone
      ? sanitizers.phone(formData.phone)
      : "";
    const sanitizedMessage = sanitizers.message(formData.message);

    if (!sanitizedFirstName) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!sanitizedLastName) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!sanitizedEmail) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitizedEmail)) {
      newErrors.email = "Format d'email invalide";
    }

    if (
      sanitizedPhone &&
      !/^[\d\s\-\+\(\)]{10,}$/.test(sanitizedPhone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "Format de téléphone invalide";
    }

    if (!sanitizedMessage) {
      newErrors.message = "Le message est requis";
    } else if (sanitizedMessage.length < 10) {
      newErrors.message = "Le message doit contenir au moins 10 caractères";
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = true;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Veuillez corriger les erreurs dans le formulaire");
      return;
    }

    setIsSubmitting(true);

    try {
      // Sanitiser toutes les données avant envoi
      const sanitizedData = {
        firstName: sanitizers.name(formData.firstName),
        lastName: sanitizers.name(formData.lastName),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone ? sanitizers.phone(formData.phone) : undefined,
        message: sanitizers.message(formData.message),
        acceptPhone: formData.acceptPhone,
        acceptTerms: formData.acceptTerms,
      };

      await quoteService.create(sanitizedData);

      setIsFormSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        message: "",
        acceptPhone: false,
        acceptTerms: false,
      });
      setErrors({});
    } catch (error: unknown) {
      let errorMessage =
        "Une erreur est survenue lors de l'envoi de votre demande";
      if (typeof error === "object" && error !== null && "response" in error) {
        const axiosLikeError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage = axiosLikeError.response?.data?.message || errorMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof QuoteFormData,
    value: string | boolean
  ) => {
    const newFormData = { ...formData, [field]: value };

    // Si on vide le téléphone, décocher automatiquement acceptPhone
    if (field === "phone" && typeof value === "string" && !value.trim()) {
      newFormData.acceptPhone = false;
    }

    setFormData(newFormData);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <section id="quote-form" className="quote-section">
      {!isFormSubmitted ? (
        <div className="quote-form-container">
          <div className="quote-form-header">
            <h2 className="quote-form-title">Demander un devis</h2>
            <p className="quote-form-subtitle">
              Décrivez votre projet d&apos;automatisme et nous vous établirons
              un devis personnalisé gratuit
            </p>
          </div>

          <form onSubmit={handleSubmit} className="quote-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label required">
                  Prénom
                </label>
                <input
                  type="text"
                  id="firstName"
                  className={`form-input ${errors.firstName ? "error" : ""}`}
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  placeholder="Votre prénom"
                  disabled={isSubmitting}
                />
                {errors.firstName && (
                  <span className="form-error">{errors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label required">
                  Nom
                </label>
                <input
                  type="text"
                  id="lastName"
                  className={`form-input ${errors.lastName ? "error" : ""}`}
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  placeholder="Votre nom"
                  disabled={isSubmitting}
                />
                {errors.lastName && (
                  <span className="form-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email" className="form-label required">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`form-input ${errors.email ? "error" : ""}`}
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="votre@email.com"
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <span className="form-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Téléphone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className={`form-input ${errors.phone ? "error" : ""}`}
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="06 12 34 56 78"
                  disabled={isSubmitting}
                />
                {errors.phone && (
                  <span className="form-error">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message" className="form-label required">
                Description de votre projet
              </label>
              <textarea
                id="message"
                className={`form-textarea ${errors.message ? "error" : ""}`}
                value={formData.message}
                onChange={(e) => handleInputChange("message", e.target.value)}
                placeholder="Décrivez votre projet d'automatisme : type de portail, porte de garage, ascenseur, dimensions, motorisation souhaitée..."
                rows={5}
                disabled={isSubmitting}
              />
              {errors.message && (
                <span className="form-error">{errors.message}</span>
              )}
            </div>

            <div className="form-checkboxes">
              <div
                className={`form-checkbox-group ${
                  !formData.phone?.trim() ? "disabled" : ""
                }`}
              >
                <input
                  type="checkbox"
                  id="acceptPhone"
                  className="form-checkbox"
                  checked={formData.acceptPhone}
                  onChange={(e) =>
                    handleInputChange("acceptPhone", e.target.checked)
                  }
                  disabled={isSubmitting || !formData.phone?.trim()}
                />
                <label
                  htmlFor="acceptPhone"
                  className={`form-checkbox-label ${
                    !formData.phone?.trim() ? "disabled" : ""
                  }`}
                >
                  J&apos;accepte d&apos;être recontacté(e) par téléphone pour
                  discuter de ma demande
                </label>
              </div>

              <div className="form-checkbox-group">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  className="form-checkbox"
                  checked={formData.acceptTerms}
                  onChange={(e) =>
                    handleInputChange("acceptTerms", e.target.checked)
                  }
                  disabled={isSubmitting}
                />
                <label htmlFor="acceptTerms" className="form-checkbox-label">
                  J&apos;accepte les conditions générales d&apos;utilisation *
                </label>
              </div>
              {errors.acceptTerms && (
                <span className="form-error">
                  Vous devez accepter les conditions générales
                </span>
              )}
            </div>

            <button
              type="submit"
              className="form-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="form-spinner"></div>
                  Envoi en cours...
                </>
              ) : (
                <>
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    className="quote-icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Demander un devis
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="quote-success-container">
          <div className="quote-success-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="quote-success-title">Demande de devis envoyée !</h2>
          <p className="quote-success-message">
            Nous avons bien reçu votre demande de devis pour votre projet
            d&apos;automatisme. Vous recevrez bientôt un email de confirmation
            et nous vous recontacterons rapidement pour établir un devis
            détaillé et personnalisé.
          </p>
          <button
            onClick={() => setIsFormSubmitted(false)}
            className="quote-success-button"
          >
            Faire une nouvelle demande
          </button>
        </div>
      )}
    </section>
  );
}
