"use client";

import { useState } from "react";
import { Quote, QuoteAcceptData } from "@/lib/backoffice-api";

interface QuoteAcceptModalProps {
  quote: Quote;
  onAccept: (data: QuoteAcceptData) => void;
  onClose: () => void;
}

export default function QuoteAcceptModal({
  quote,
  onAccept,
  onClose,
}: QuoteAcceptModalProps) {
  const [formData, setFormData] = useState<QuoteAcceptData>({
    document: "",
    validUntil: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAccept(formData);
  };

  return (
    <div className="quote-modal-overlay" onClick={onClose}>
      <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quote-modal-header">
          <h4>
            Accepter le devis - {quote.contact.firstName}{" "}
            {quote.contact.lastName}
          </h4>
          <button className="quote-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="quote-modal-body">
            <div className="quote-accept-info">
              <p>
                <strong>⚠️ Attention :</strong> En acceptant ce devis, un email
                sera automatiquement envoyé au client pour l'informer que vous
                allez le recontacter dans les plus brefs délais.
              </p>
            </div>

            <div className="quote-form-group">
              <label>Document PDF (optionnel)</label>
              <input
                type="url"
                value={formData.document || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    document: e.target.value,
                  }))
                }
                placeholder="https://exemple.com/devis.pdf"
              />
              <small>
                Si vous avez un devis PDF à joindre, renseignez l'URL ici
              </small>
            </div>

            <div className="quote-form-group">
              <label>Valide jusqu'au (optionnel)</label>
              <input
                type="date"
                value={formData.validUntil || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    validUntil: e.target.value,
                  }))
                }
              />
              <small>Date d'expiration du devis (optionnel)</small>
            </div>

            <div className="quote-project-summary">
              <h5>Résumé du projet :</h5>
              <p>{quote.projectDescription}</p>
            </div>
          </div>

          <div className="quote-modal-actions">
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="accept-button">
              ✅ Accepter le devis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
