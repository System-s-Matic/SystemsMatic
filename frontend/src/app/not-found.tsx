"use client";

import Link from "next/link";
import "./styles/not-found.css";

export default function NotFound() {
  return (
    <div className="not-found">
      <div className="not-found__container">
        <div className="not-found__content">
          <div className="not-found__badge">Erreur 404</div>
          <h1 className="not-found__title">Page introuvable</h1>
          <p className="not-found__description">
            Désolé, la page que vous recherchez n&apos;existe pas ou a été
            déplacée. Peut-être qu&apos;un de nos portails automatiques l&apos;a
            emportée !
          </p>
          <div className="not-found__actions">
            <Link
              href="/"
              className="not-found__button not-found__button--primary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
                  fill="currentColor"
                />
              </svg>
              Retour à l&apos;accueil
            </Link>
            <button
              onClick={() => window.history.back()}
              className="not-found__button not-found__button--secondary"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"
                  fill="currentColor"
                />
              </svg>
              Page précédente
            </button>
          </div>
        </div>
        <div className="not-found__illustration">
          <div className="not-found__visual">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="var(--color-primary-light)"
                opacity="0.2"
              />
              <circle
                cx="100"
                cy="100"
                r="70"
                fill="var(--color-primary-light)"
                opacity="0.3"
              />
              <circle
                cx="100"
                cy="100"
                r="50"
                fill="var(--color-primary-light)"
                opacity="0.4"
              />
              <path
                d="M100 40L140 80H120V130H80V80H60L100 40Z"
                fill="var(--color-primary)"
                opacity="0.6"
              />
              <rect
                x="70"
                y="130"
                width="60"
                height="30"
                rx="4"
                fill="var(--color-primary)"
                opacity="0.7"
              />
              <circle cx="85" cy="100" r="5" fill="var(--color-primary)" />
              <circle cx="115" cy="100" r="5" fill="var(--color-primary)" />
            </svg>
          </div>
          <div className="not-found__floating-elements">
            <div className="floating-element floating-element--1"></div>
            <div className="floating-element floating-element--2"></div>
            <div className="floating-element floating-element--3"></div>
          </div>
        </div>
      </div>
      <div className="not-found__suggestions">
        <h3>Liens utiles</h3>
        <div className="not-found__links">
          <Link href="/#services" className="not-found__link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z"
                fill="currentColor"
              />
            </svg>
            Nos services
          </Link>
          <Link href="/#appointment-form" className="not-found__link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"
                fill="currentColor"
              />
            </svg>
            Prendre rendez-vous
          </Link>
          <Link href="/#quote-form" className="not-found__link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"
                fill="currentColor"
              />
            </svg>
            Demander un devis
          </Link>
          <Link href="/#about" className="not-found__link">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"
                fill="currentColor"
              />
            </svg>
            À propos
          </Link>
        </div>
      </div>
    </div>
  );
}
