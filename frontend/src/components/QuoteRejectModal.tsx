"use client";

import { useState } from "react";
import { Quote, QuoteRejectData } from "@/lib/backoffice-api";

interface QuoteRejectModalProps {
  quote: Quote;
  onReject: (data: QuoteRejectData) => void;
  onClose: () => void;
}

export default function QuoteRejectModal({
  quote,
  onReject,
  onClose,
}: QuoteRejectModalProps) {
  const [rejectionReason, setRejectionReason] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("Veuillez saisir une raison pour le refus");
      return;
    }
    onReject({ rejectionReason: rejectionReason.trim() });
  };

  return (
    <div className="quote-modal-overlay" onClick={onClose}>
      <div className="quote-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="quote-modal-header">
          <h4>
            Rejeter le devis - {quote.contact.firstName}{" "}
            {quote.contact.lastName}
          </h4>
          <button className="quote-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="quote-modal-body">
            <div className="quote-reject-info">
              <p>
                <strong>⚠️ Attention :</strong> En rejetant ce devis, un email
                sera automatiquement envoyé au client avec la raison du refus
                que vous allez indiquer.
              </p>
            </div>

            <div className="quote-form-group">
              <label>Raison du refus *</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi ce devis ne peut pas être accepté..."
                rows={4}
                required
              />
              <small>Cette raison sera envoyée au client par email</small>
            </div>

            <div className="quote-project-summary">
              <h5>Projet rejeté :</h5>
              <p>{quote.projectDescription}</p>
            </div>
          </div>

          <div className="quote-modal-actions">
            <button type="button" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="reject-button">
              ❌ Rejeter le devis
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
