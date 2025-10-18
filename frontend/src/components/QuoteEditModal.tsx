"use client";

import { useState } from "react";
import { Quote, QuoteUpdate } from "@/lib/backoffice-api";

interface QuoteEditModalProps {
  quote: Quote;
  onSave: (data: QuoteUpdate) => void;
  onClose: () => void;
}

export default function QuoteEditModal({
  quote,
  onSave,
  onClose,
}: QuoteEditModalProps) {
  const [formData, setFormData] = useState<QuoteUpdate>({
    status: quote.status,
    quoteValidUntil: quote.quoteValidUntil
      ? quote.quoteValidUntil.split("T")[0]
      : "",
    quoteDocument: quote.quoteDocument || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="quote-modal-overlay" onClick={onClose}>
      <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quote-modal-header">
          <h4>
            Modifier le devis - {quote.contact.firstName}{" "}
            {quote.contact.lastName}
          </h4>
          <button className="quote-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="quote-modal-body">
            <div className="quote-form-group">
              <label>Statut</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option value="PENDING">En attente</option>
                <option value="PROCESSING">En cours</option>
                <option value="SENT">Envoyé</option>
                <option value="ACCEPTED">Accepté</option>
                <option value="REJECTED">Refusé</option>
                <option value="EXPIRED">Expiré</option>
              </select>
            </div>

            <div className="quote-form-group">
              <label>
                Valide jusqu&apos;au
                {formData.status === "SENT" && (
                  <span style={{ color: "#dc2626", marginLeft: "4px" }}>*</span>
                )}
              </label>
              <input
                type="date"
                value={formData.quoteValidUntil}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quoteValidUntil: e.target.value,
                  }))
                }
                required={formData.status === "SENT"}
              />
              {formData.status === "SENT" && (
                <small style={{ color: "#dc2626" }}>
                  Obligatoire pour le statut &quot;Envoyé&quot;
                </small>
              )}
            </div>

            <div className="quote-form-group">
              <label>
                Document (URL)
                {formData.status === "SENT" && (
                  <span style={{ color: "#dc2626", marginLeft: "4px" }}>*</span>
                )}
              </label>
              <input
                type="url"
                value={formData.quoteDocument}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    quoteDocument: e.target.value,
                  }))
                }
                placeholder="https://exemple.com/devis.pdf"
                required={formData.status === "SENT"}
              />
              {formData.status === "SENT" && (
                <small style={{ color: "#dc2626" }}>
                  Obligatoire pour le statut &quot;Envoyé&quot;
                </small>
              )}
            </div>
          </div>

          <div className="quote-modal-actions">
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit">Sauvegarder</button>
          </div>
        </form>
      </div>
    </div>
  );
}
