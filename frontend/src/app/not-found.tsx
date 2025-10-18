"use client";

import Link from "next/link";
import "./styles/not-found.css";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__content">
          <h1 className="not-found__title">404</h1>
          <h2 className="not-found__subtitle">Page introuvable</h2>
          <p className="not-found__description">
            Désolé, la page que vous recherchez n&apos;existe pas ou a été
            déplacée.
          </p>
          <div className="not-found__actions">
            <Link
              href="/"
              className="not-found__button not-found__button--primary"
            >
              Retour à l&apos;accueil
            </Link>
            <button
              onClick={() => window.history.back()}
              className="not-found__button not-found__button--secondary"
            >
              Page précédente
            </button>
          </div>
        </div>
        <div className="not-found__illustration">
          <div className="not-found__icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
