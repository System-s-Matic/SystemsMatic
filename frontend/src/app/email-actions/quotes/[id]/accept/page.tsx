"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { showSuccess, showError } from "@/lib/toast";
import "@/app/styles/appointment-actions.css";

interface QuoteData {
  id: string;
  status: string;
  acceptedAt: string;
  document?: string;
  validUntil?: string;
  contact?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export default function AcceptQuotePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [quote, setQuote] = useState<QuoteData | null>(null);

  const id = params.id as string;
  const token = searchParams.get("token");

  useEffect(() => {
    if (!id || !token) {
      setStatus("error");
      setMessage("Paramètres manquants");
      return;
    }

    const acceptQuote = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/email-actions/quotes/${id}/accept?token=${token}`,
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
        setMessage("Le devis a été accepté avec succès.");
        setQuote(result.quote);
        showSuccess("Devis accepté");
      } catch (error: any) {
        setStatus("error");
        const errorMessage =
          error.message || "Erreur lors de l'acceptation du devis";
        setMessage(errorMessage);
        showError(errorMessage);
      }
    };

    acceptQuote();
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
              <h2 className="appointment-action-title">Devis accepté</h2>
              <p className="appointment-action-message">{message}</p>

              {quote && (
                <div className="appointment-details">
                  <h3>Détails du devis</h3>
                  <div className="detail-item">
                    <strong>Client :</strong> {quote.contact?.firstName}{" "}
                    {quote.contact?.lastName}
                  </div>
                  <div className="detail-item">
                    <strong>Email :</strong> {quote.contact?.email}
                  </div>
                  {quote.contact?.phone && (
                    <div className="detail-item">
                      <strong>Téléphone :</strong> {quote.contact.phone}
                    </div>
                  )}
                  {quote.validUntil && (
                    <div className="detail-item">
                      <strong>Valide jusqu&apos;au :</strong>{" "}
                      {new Date(quote.validUntil).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  <div className="detail-item">
                    <strong>Statut :</strong>{" "}
                    <span className="status-accepted">Accepté</span>
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
