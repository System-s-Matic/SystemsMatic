"use client";

import { useState, useEffect } from "react";
import {
  backofficeApi,
  Quote,
  QuoteUpdate,
  QuoteAcceptData,
  QuoteRejectData,
} from "@/lib/backoffice-api";
import { showSuccess, showError } from "@/lib/toast";

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [quotesStats, setQuotesStats] = useState<any>(null);
  const [quotesFilter, setQuotesFilter] = useState<string>("");

  const fetchQuotes = async () => {
    try {
      setQuotesLoading(true);
      const response = await backofficeApi.getQuotes({
        status: quotesFilter || undefined,
        page: 1,
        limit: 50,
      });
      setQuotes(response.data);
    } catch (error) {
      console.error("Erreur lors du chargement des devis:", error);
      showError("Erreur lors du chargement des devis");
    } finally {
      setQuotesLoading(false);
    }
  };

  const fetchQuotesStats = async () => {
    try {
      const data = await backofficeApi.getQuotesStats();
      setQuotesStats(data);
    } catch (error) {
      console.error(
        "Erreur lors du chargement des statistiques des devis:",
        error
      );
    }
  };

  const updateQuoteStatus = async (quoteId: string, newStatus: string) => {
    try {
      await backofficeApi.updateQuoteStatus(quoteId, newStatus);
      fetchQuotes();
      fetchQuotesStats();
      showSuccess(`Statut mis à jour vers "${getQuoteStatusLabel(newStatus)}"`);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut:", error);
      showError("Erreur lors de la mise à jour du statut");
    }
  };

  const handleSaveQuote = async (
    editingQuote: Quote,
    updatedData: QuoteUpdate
  ) => {
    try {
      // Validation spéciale pour le statut "SENT"
      if (updatedData.status === "SENT") {
        const hasValidUntil =
          updatedData.quoteValidUntil &&
          updatedData.quoteValidUntil.trim() !== "";
        const hasDocument =
          updatedData.quoteDocument && updatedData.quoteDocument.trim() !== "";

        if (!hasValidUntil || !hasDocument) {
          showError(
            "Pour marquer un devis comme 'Envoyé', vous devez obligatoirement renseigner une date de validité ET un document PDF."
          );
          return false;
        }
      }

      // Filtrer les champs vides pour éviter les erreurs de validation
      const filteredData: QuoteUpdate = {};

      if (updatedData.status) {
        filteredData.status = updatedData.status;
      }

      if (
        updatedData.quoteValidUntil &&
        updatedData.quoteValidUntil.trim() !== ""
      ) {
        filteredData.quoteValidUntil = updatedData.quoteValidUntil;
      }

      if (
        updatedData.quoteDocument &&
        updatedData.quoteDocument.trim() !== ""
      ) {
        filteredData.quoteDocument = updatedData.quoteDocument;
      }

      if (
        updatedData.rejectionReason &&
        updatedData.rejectionReason.trim() !== ""
      ) {
        filteredData.rejectionReason = updatedData.rejectionReason;
      }

      await backofficeApi.updateQuote(editingQuote.id, filteredData);
      showSuccess("Devis mis à jour avec succès");
      fetchQuotes();
      fetchQuotesStats();
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du devis:", error);
      showError("Erreur lors de la mise à jour du devis");
      return false;
    }
  };

  const confirmAcceptQuote = async (
    selectedQuote: Quote,
    data: QuoteAcceptData
  ) => {
    try {
      // Filtrer les champs vides
      const filteredData: QuoteAcceptData = {};

      if (data.document && data.document.trim() !== "") {
        filteredData.document = data.document;
      }

      if (data.validUntil && data.validUntil.trim() !== "") {
        filteredData.validUntil = data.validUntil;
      }

      await backofficeApi.acceptQuote(selectedQuote.id, filteredData);
      showSuccess(
        "Devis accepté avec succès. Un email a été envoyé au client."
      );
      fetchQuotes();
      fetchQuotesStats();
      return true;
    } catch (error) {
      console.error("Erreur lors de l'acceptation du devis:", error);
      showError("Erreur lors de l'acceptation du devis");
      return false;
    }
  };

  const confirmRejectQuote = async (
    selectedQuote: Quote,
    data: QuoteRejectData
  ) => {
    try {
      await backofficeApi.rejectQuote(selectedQuote.id, data);
      showSuccess("Devis rejeté avec succès. Un email a été envoyé au client.");
      fetchQuotes();
      fetchQuotesStats();
      return true;
    } catch (error) {
      console.error("Erreur lors du rejet du devis:", error);
      showError("Erreur lors du rejet du devis");
      return false;
    }
  };

  // Fonctions utilitaires pour les devis
  const getQuoteStatusLabel = (status: string) => {
    switch (status) {
      case "PENDING":
        return "En attente";
      case "PROCESSING":
        return "En cours";
      case "SENT":
        return "Envoyé";
      case "ACCEPTED":
        return "Accepté";
      case "REJECTED":
        return "Refusé";
      case "EXPIRED":
        return "Expiré";
      default:
        return status;
    }
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "status-pending";
      case "PROCESSING":
        return "status-processing";
      case "SENT":
        return "status-sent";
      case "ACCEPTED":
        return "status-accepted";
      case "REJECTED":
        return "status-rejected";
      case "EXPIRED":
        return "status-expired";
      default:
        return "";
    }
  };

  return {
    quotes,
    quotesLoading,
    quotesStats,
    quotesFilter,
    setQuotesFilter,
    fetchQuotes,
    fetchQuotesStats,
    updateQuoteStatus,
    handleSaveQuote,
    confirmAcceptQuote,
    confirmRejectQuote,
    getQuoteStatusLabel,
    getQuoteStatusColor,
  };
}
