import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__content">
          {/* Section principale */}
          <div className="footer__section">
            <h3 className="footer__title">
              <Image
                src="/images/logo.jpg"
                alt="System's Matic"
                width={160}
                height={40}
                className="footer__logo"
              />
            </h3>
            <p className="footer__description">
              Spécialiste en automatismes : portes, portails, volets.
              Contactez-nous pour vos projets en Guadeloupe.
            </p>
            <div className="footer__social">
              <a
                href="#"
                className="footer__social-link"
                aria-label="Suivre sur Facebook"
              >
                <svg
                  className="footer__social-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="#"
                className="footer__social-link"
                aria-label="Suivre sur Twitter"
              >
                <svg
                  className="footer__social-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </a>
              <a
                href="#"
                className="footer__social-link"
                aria-label="Suivre sur LinkedIn"
              >
                <svg
                  className="footer__social-icon"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div className="footer__section">
            <h4 className="footer__subtitle">Liens rapides</h4>
            <ul className="footer__links">
              <li className="footer__link-item">
                <Link href="/" className="footer__link">
                  Accueil
                </Link>
              </li>
              <li className="footer__link-item">
                <Link href="#services" className="footer__link">
                  Services
                </Link>
              </li>
              <li className="footer__link-item">
                <Link href="#about" className="footer__link">
                  À propos
                </Link>
              </li>
              <li className="footer__link-item">
                <Link href="#appointment-form" className="footer__link">
                  Prendre rendez-vous
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer__section">
            <h4 className="footer__subtitle">Services</h4>
            <ul className="footer__links">
              <li className="footer__link-item">
                <Link href="#services" className="footer__link">
                  Prestations
                </Link>
              </li>
              <li className="footer__link-item">
                <Link href="#services" className="footer__link">
                  Automatismes
                </Link>
              </li>
              <li className="footer__link-item">
                <Link href="#services" className="footer__link">
                  Autres Produits
                </Link>
              </li>
              <li className="footer__link-item">
                <Link href="#services" className="footer__link">
                  Accessibilité
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer__section">
            <h4 className="footer__subtitle">Contact</h4>
            <div className="footer__contact">
              <p className="footer__contact-item">
                <svg
                  className="footer__contact-icon"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                123 Rue de la Technologie, 75001 Paris
              </p>
              <p className="footer__contact-item">
                <svg
                  className="footer__contact-icon"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <a href="mailto:contact@kenzocda.fr" className="footer__link">
                  contact@kenzocda.fr
                </a>
              </p>
              <p className="footer__contact-item">
                <svg
                  className="footer__contact-icon"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                +33 1 23 45 67 89
              </p>
            </div>
          </div>
        </div>

        {/* Barre de copyright */}
        <div className="footer__bottom">
          <div className="footer__copyright">
            <p className="footer__copyright-text">
              © 2025 System&apos;s Matic. Tous droits réservés.
            </p>
          </div>
          <div className="footer__legal">
            <Link href="/privacy" className="footer__legal-link">
              Politique de confidentialité
            </Link>
            <Link href="/legal-notice" className="footer__legal-link">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
