"use client";

import { useState } from "react";
import { Quote } from "@/lib/backoffice-api";
import { formatGuadeloupeDateTime } from "@/lib/date-utils";
import QuoteEditModal from "./QuoteEditModal";
import QuoteAcceptModal from "./QuoteAcceptModal";
import QuoteRejectModal from "./QuoteRejectModal";

interface QuotesSectionProps {
  quotes: Quote[];
  quotesLoading: boolean;
  quotesStats: any;
  quotesFilter: string;
  setQuotesFilter: (filter: string) => void;
  updateQuoteStatus: (quoteId: string, newStatus: string) => void;
  handleSaveQuote: (editingQuote: Quote, updatedData: any) => Promise<boolean>;
  confirmAcceptQuote: (selectedQuote: Quote, data: any) => Promise<boolean>;
  confirmRejectQuote: (selectedQuote: Quote, data: any) => Promise<boolean>;
  getQuoteStatusLabel: (status: string) => string;
  getQuoteStatusColor: (status: string) => string;
}

export default function QuotesSection({
  quotes,
  quotesLoading,
  quotesStats,
  quotesFilter,
  setQuotesFilter,
  updateQuoteStatus,
  handleSaveQuote,
  confirmAcceptQuote,
  confirmRejectQuote,
  getQuoteStatusLabel,
  getQuoteStatusColor,
}: QuotesSectionProps) {
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedQuoteForAction, setSelectedQuoteForAction] =
    useState<Quote | null>(null);

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsQuoteModalOpen(true);
  };

  const handleAcceptQuote = (quote: Quote) => {
    setSelectedQuoteForAction(quote);
    setIsAcceptModalOpen(true);
  };

  const handleRejectQuote = (quote: Quote) => {
    setSelectedQuoteForAction(quote);
    setIsRejectModalOpen(true);
  };

  const formatCreatedDate = (date: string | Date) => {
    return formatGuadeloupeDateTime(date);
  };

  if (quotesLoading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner">
          <div className="admin-spinner-icon"></div>
          <span>Chargement des devis...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="quotes-list">
        {quotes.length === 0 ? (
          <p className="no-quotes">Aucun devis trouvé</p>
        ) : (
          quotes.map((quote) => (
            <div
              key={quote.id}
              className={`quote-card ${getQuoteStatusColor(quote.status)}`}
            >
              <div className="quote-header">
                <h3>
                  {quote.contact.firstName} {quote.contact.lastName}
                </h3>
                <span
                  className={`status-badge ${getQuoteStatusColor(
                    quote.status
                  )}`}
                >
                  {getQuoteStatusLabel(quote.status)}
                </span>
              </div>

              <div className="quote-details">
                <p>
                  <strong>Email :</strong> {quote.contact.email}
                </p>
                {quote.contact.phone && (
                  <p>
                    <strong>Téléphone :</strong> {quote.contact.phone}
                  </p>
                )}
                <p>
                  <strong>Créé le :</strong>{" "}
                  {formatCreatedDate(quote.createdAt)}
                </p>
                {quote.quoteValidUntil && (
                  <p>
                    <strong>Valide jusqu&apos;au :</strong>{" "}
                    {formatCreatedDate(quote.quoteValidUntil)}
                  </p>
                )}
                <p>
                  <strong>Contact téléphonique :</strong>{" "}
                  {quote.acceptPhone ? "✅ Accepté" : "❌ Refusé"}
                </p>
                <div className="quote-description">
                  <strong>Description du projet :</strong>
                  <p>{quote.projectDescription}</p>
                </div>
              </div>

              <div className="quote-actions">
                <button
                  onClick={() => handleEditQuote(quote)}
                  className="action-button edit"
                >
                  Modifier
                </button>

                {quote.status === "PENDING" && (
                  <button
                    onClick={() => updateQuoteStatus(quote.id, "PROCESSING")}
                    className="action-button process"
                  >
                    Traiter
                  </button>
                )}

                {quote.status === "PROCESSING" && (
                  <button
                    onClick={() => updateQuoteStatus(quote.id, "SENT")}
                    className="action-button send"
                  >
                    Marquer envoyé
                  </button>
                )}

                {(quote.status === "PENDING" ||
                  quote.status === "PROCESSING") && (
                  <>
                    <button
                      onClick={() => handleAcceptQuote(quote)}
                      className="action-button accept"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRejectQuote(quote)}
                      className="action-button reject"
                    >
                      Rejeter
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal d'édition des devis */}
      {isQuoteModalOpen && editingQuote && (
        <QuoteEditModal
          quote={editingQuote}
          onSave={async (data) => {
            const success = await handleSaveQuote(editingQuote, data);
            if (success) {
              setIsQuoteModalOpen(false);
              setEditingQuote(null);
            }
          }}
          onClose={() => {
            setIsQuoteModalOpen(false);
            setEditingQuote(null);
          }}
        />
      )}

      {/* Modal d'acceptation des devis */}
      {isAcceptModalOpen && selectedQuoteForAction && (
        <QuoteAcceptModal
          quote={selectedQuoteForAction}
          onAccept={async (data) => {
            const success = await confirmAcceptQuote(
              selectedQuoteForAction,
              data
            );
            if (success) {
              setIsAcceptModalOpen(false);
              setSelectedQuoteForAction(null);
            }
          }}
          onClose={() => {
            setIsAcceptModalOpen(false);
            setSelectedQuoteForAction(null);
          }}
        />
      )}

      {/* Modal de rejet des devis */}
      {isRejectModalOpen && selectedQuoteForAction && (
        <QuoteRejectModal
          quote={selectedQuoteForAction}
          onReject={async (data) => {
            const success = await confirmRejectQuote(
              selectedQuoteForAction,
              data
            );
            if (success) {
              setIsRejectModalOpen(false);
              setSelectedQuoteForAction(null);
            }
          }}
          onClose={() => {
            setIsRejectModalOpen(false);
            setSelectedQuoteForAction(null);
          }}
        />
      )}
    </>
  );
}
