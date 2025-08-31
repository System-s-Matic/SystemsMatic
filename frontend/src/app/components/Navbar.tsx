"use client";

import { useState } from "react";
import Link from "next/link";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <div className="navbar__brand">
          <Link href="/" className="navbar__logo">
            System's Matic
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
              <Link href="/services" className="navbar__nav-link">
                Services
              </Link>
            </li>
            <li className="navbar__nav-item">
              <Link href="/about" className="navbar__nav-link">
                À propos
              </Link>
            </li>
            <li className="navbar__nav-item">
              <Link href="/contact" className="navbar__nav-link">
                Contact
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
