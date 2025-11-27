export default function TermsPage() {
  return (
    <main className="legal-container">
      <h1 className="legal-title">
        Politique de confidentialité – System&apos;s Matic
      </h1>
      <p className="update">Dernière mise à jour : 27/11/2025</p>

      <section className="legal-section">
        <h2 className="legal-subtitle">1. Responsable du traitement</h2>
        <p>
          <strong>System&apos;s Matic</strong> <br />
          Site : <a href="https://kenzocda.fr">https://kenzocda.fr</a> <br />
          Email : <a href="mailto:contact@kenzocda.fr">contact@kenzocda.fr</a>
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">2. Données collectées</h2>
        <ul className="legal-list">
          <li>Prénom</li>
          <li>Nom</li>
          <li>Adresse e-mail</li>
          <li>Numéro de téléphone</li>
        </ul>
        <p>Aucune autre donnée personnelle n&apos;est collectée.</p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">3. Finalité de la collecte</h2>
        <ul className="legal-list">
          <li>Traitement des demandes de rendez-vous</li>
          <li>Traitement des demandes de devis</li>
          <li>Envoi d&apos;e-mails liés au suivi de ces demandes</li>
        </ul>
        <p>Aucun e-mail marketing ou commercial n&apos;est envoyé.</p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">4. Pas de publicité, pas de tracking</h2>
        <ul className="legal-list">
          <li>Aucun e-mail marketing</li>
          <li>Aucun cookie publicitaire</li>
          <li>Aucun outil de tracking</li>
        </ul>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">5. Pas de reCAPTCHA</h2>
        <p>Nous n&apos;utilisons aucun outil de type reCAPTCHA ou similaire.</p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">6. Base légale</h2>
        <p>
          Le traitement repose sur : <br />
          <strong>l&apos;exécution de mesures précontractuelles</strong>{" "}
          (répondre à vos demandes).
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">7. Durée de conservation</h2>
        <p>
          Vos données sont conservées jusqu&apos;à 3 ans après votre dernier
          contact.
        </p>
      </section>

      {/* 🔥 Nouvelle section obligatoire RGPD : Sous-traitants */}
      <section className="legal-section">
        <h2 className="legal-subtitle">8. Sous-traitants</h2>
        <p>
          Vos données peuvent être traitées par des prestataires strictement
          nécessaires au fonctionnement du service :
        </p>
        <ul className="legal-list">
          <li>
            <strong>OVH</strong> — Hébergement de l&apos;infrastructure (données
            hébergées en Europe)
          </li>
          <li>
            <strong>Resend</strong> — Envoi des e-mails transactionnels
            (confirmations, suivis)
          </li>
        </ul>
        <p>
          Ces sous-traitants respectent le RGPD et ne peuvent utiliser vos
          données pour aucune autre finalité.
        </p>
      </section>

      {/* 🔥 Nouvelle section obligatoire RGPD : Cookies */}
      <section className="legal-section">
        <h2 className="legal-subtitle">9. Cookies</h2>
        <p>
          Ce site n&apos;utilise que des cookies strictement nécessaires à son
          fonctionnement. Aucun cookie de mesure d&apos;audience, de publicité
          ou de suivi n&apos;est déposé.
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">10. Sécurité</h2>
        <p>
          Nous appliquons des mesures raisonnables pour protéger vos
          informations personnelles.
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">11. Vos droits</h2>
        <p>
          Vous pouvez exercer vos droits d&apos;accès, de rectification,
          d&apos;effacement, d&apos;opposition ou de portabilité en nous
          écrivant :
        </p>
        <p>
          <a href="mailto:privacy@kenzocda.fr">privacy@kenzocda.fr</a>
        </p>
      </section>

      <section className="legal-section">
        <h2 className="legal-subtitle">12. Contact</h2>
        <p>
          Pour toute question relative à cette politique : <br />
          <a href="mailto:privacy@kenzocda.fr">privacy@kenzocda.fr</a>
        </p>
      </section>
    </main>
  );
}
