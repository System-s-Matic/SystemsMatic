"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPhone, setShowPhone] = useState(false);

  const phone = "0590 01 02 03";
  const sanitizedPhone = phone.replace(/\s/g, "");

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <Link href="/" className="navbar__logo">
            <img src="/images/logo.jpg" alt="System's Matic" />
          </Link>
        </div>

        {/* Menu mobile */}
        <button
          className="navbar__mobile-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="navbar__mobile-toggle-icon"></span>
          <span className="navbar__mobile-toggle-icon"></span>
          <span className="navbar__mobile-toggle-icon"></span>
        </button>

        {/* Navigation principale */}
        <div
          className={`navbar__menu ${isMenuOpen ? "navbar__menu--open" : ""}`}
        >
          <ul className="navbar__nav-list">
            <li className="navbar__nav-item">
              <Link href="/" className="navbar__nav-link">
                Accueil
              </Link>
            </li>
            <li className="navbar__nav-item">
              <Link href="#services" className="navbar__nav-link">
                Services
              </Link>
            </li>
            <li className="navbar__nav-item">
              <Link href="#about" className="navbar__nav-link">
                À propos
              </Link>
            </li>
            <li className="navbar__nav-item">
              <Link href="#appointment-form" className="navbar__nav-link">
                Prendre rendez-vous
              </Link>
            </li>
          </ul>

          {/* Bouton téléphone */}
          <div className="navbar__phone">
            {!showPhone ? (
              <button
                className="navbar__phone-btn"
                onClick={() => setShowPhone(true)}
              >
                <svg
                  className="navbar__phone-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                Téléphone
              </button>
            ) : (
              <a
                className="navbar__phone-btn navbar__phone-btn--primary"
                href={`tel:${sanitizedPhone}`}
              >
                <svg
                  className="navbar__phone-icon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {phone}
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
