"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { appointmentApi } from "@/lib/api";

export default function RejectReschedulePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const appointmentId = params.id as string;
  const token = searchParams.get("token");

  useEffect(() => {
    if (!appointmentId || !token) {
      setError("Paramètres manquants");
      setLoading(false);
      return;
    }

    const rejectReschedule = async () => {
      try {
        await appointmentApi.rejectReschedule(appointmentId, token);
        setSuccess(true);
      } catch (err: unknown) {
        console.error("Erreur lors du refus de la reprogrammation:", err);
        setError(
          (err as Error).message ||
            "Erreur lors du refus de la reprogrammation"
        );
      } finally {
        setLoading(false);
      }
    };

    rejectReschedule();
  }, [appointmentId, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Traitement en cours...
          </h2>
          <p className="text-gray-600">
            Nous traitons votre refus de la reprogrammation.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-orange-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Rendez-vous annulé
          </h2>
          <p className="text-gray-600 mb-4">
            Votre rendez-vous a été annulé car vous avez refusé la
            reprogrammation proposée. Vous pouvez prendre un nouveau rendez-vous
            depuis notre site.
          </p>
          <a
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Prendre un nouveau rendez-vous
          </a>
        </div>
      </div>
    );
  }

  return null;
}
