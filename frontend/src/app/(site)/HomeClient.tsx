"use client";

import AppointmentSection from "../../components/AppointmentSection";
import ChatBox from "../../components/ChatBox";
import QuoteForm from "../../components/QuoteForm";

export default function HomeClient() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content animate-fade-in">
            <h1 className="hero-title">SystemsMatic</h1>
            <p className="hero-subtitle">
              Portes, Portails et Automatismes - Votre spécialiste en
              automatisation en Guadeloupe
            </p>

            <div className="hero-cta">
              <div className="hero-buttons">
                <button
                  className="hero-btn hero-btn-primary"
                  onClick={() =>
                    document
                      .getElementById("quote-form")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Demande de devis
                </button>

                <button
                  className="hero-btn hero-btn-secondary"
                  onClick={() =>
                    document
                      .querySelector(".form-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <svg
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7a3 3 0 00-3 3v8a3 3 0 003 3h8a3 3 0 003-3v-8a3 3 0 00-3-3M8 7h8"
                    />
                  </svg>
                  Prendre RDV
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <div className="services-header">
            <h2 className="heading-2 services-title">Nos Services</h2>
            <p className="subtitle services-subtitle">
              Des solutions d&apos;automatisation complètes pour tous vos
              projets
            </p>
          </div>

          <div className="services-grid">
            <div className="service-card animate-fade-in">
              <div className="service-icon prestations">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <h3 className="service-name">Prestations</h3>
              <p className="service-description">
                Installation et maintenance complète de vos automatismes
              </p>
              <ul className="service-features">
                <li>Installation professionnelle</li>
                <li>Dépannage rapide</li>
                <li>Maintenance préventive</li>
                <li>Conseils personnalisés</li>
                <li>Service après-vente</li>
              </ul>
            </div>

            <div className="service-card animate-fade-in">
              <div className="service-icon automatismes">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="service-name">Automatismes</h3>
              <p className="service-description">
                Solutions d&apos;automatisation pour portes et portails
              </p>
              <ul className="service-features">
                <li>Portails automatiques</li>
                <li>Portes sectionnelles</li>
                <li>Portes basculantes</li>
                <li>Barrières levantes</li>
                <li>Télécommandes et accessoires</li>
              </ul>
            </div>

            <div className="service-card animate-fade-in">
              <div className="service-icon autres-produits">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="service-name">Autres Produits</h3>
              <p className="service-description">
                Équipements de transport vertical et accessibilité
              </p>
              <ul className="service-features">
                <li>Ascenseurs privatifs</li>
                <li>Élévateurs PMR</li>
                <li>Monte-charges</li>
                <li>Rampes d&apos;accès motorisées</li>
                <li>Solutions d&apos;accessibilité</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Notre entreprise</h2>
            <p className="section-subtitle">
              Bénéficiez de notre professionnalisme, de notre disponibilité et
              de nos conseils pour la pose de vos portes d&apos;entrée, de
              garage et de vos portails. Vous souhaitez quelques précisions ?
              Contactez-nous par e-mail ou par téléphone dès maintenant.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nos atouts</h2>
          </div>
          <div className="grid-3">
            <div className="feature-card">
              <h3>Expérience</h3>
              <p>
                Nous mettons à votre disposition notre savoir-faire et plus de
                30 ans d&apos;expérience.
              </p>
            </div>
            <div className="feature-card">
              <h3>Clientèle</h3>
              <p>
                Entreprises et particuliers : équipez votre structure
                d&apos;automatismes performants et fiables.
              </p>
            </div>
            <div className="feature-card">
              <h3>Disponibilité</h3>
              <p>En cas de panne, nous restons joignables 7j/7 et 24h/24.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Nos réalisations</h2>
          </div>
          <div className="gallery-grid">
            <div className="gallery-item">Image</div>
            <div className="gallery-item">Image</div>
            <div className="gallery-item">Image</div>
            <div className="gallery-item">Image</div>
            <div className="gallery-item">Image</div>
          </div>
          <div className="section-actions">
            <button className="btn btn-secondary">Afficher davantage</button>
          </div>
        </div>
      </section>

      <section className="section zone-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Zone d&apos;intervention</h2>
            <p className="section-subtitle">Guadeloupe et alentours</p>
          </div>
          <div className="contact-cta">
            <a className="cta-pill primary" href="#quote-form">
              Demander un devis
            </a>
            <button
              className="cta-pill primary"
              onClick={() =>
                document
                  .getElementById("quote-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Recevoir mon devis gratuit
            </button>
          </div>
        </div>
      </section>

      {/* Appointment Section */}
      <section className="form-section">
        <div className="container">
          <AppointmentSection />
        </div>
      </section>

      {/* Quote Section */}
      <section className="form-section">
        <div className="container">
          <QuoteForm />
        </div>
      </section>

      <ChatBox />
    </div>
  );
}
