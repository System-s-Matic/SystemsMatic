import React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseEmailAdmin } from './components/BaseEmailAdmin';
import { AdminInfoBox } from './components/AdminInfoBox';
import { AdminActionButton } from './components/AdminActionButton';
import { commonStyles } from './styles/common';

interface AdminQuoteNotificationProps {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  acceptPhone: boolean;
  message: string;
}

export const AdminQuoteNotification: React.FC<AdminQuoteNotificationProps> = ({
  contactName,
  contactEmail,
  contactPhone,
  acceptPhone,
  message,
}) => {
  return (
    <BaseEmailAdmin title="Nouvelle demande de devis" type="quote">
      <Text style={commonStyles.greeting}>Bonjour Admin,</Text>

      <Text style={commonStyles.paragraph}>
        Une nouvelle demande de devis a été soumise et nécessite votre
        attention.
      </Text>

      <AdminInfoBox type="client" title="👤 Informations du client">
        <div>
          <p>
            <strong>Nom :</strong>
            <br />
            {contactName}
          </p>
          <p>
            <strong>Email :</strong>
            <br />
            <a href={`mailto:${contactEmail}`} style={{ color: '#007bff' }}>
              {contactEmail}
            </a>
          </p>
          {contactPhone && (
            <p>
              <strong>Téléphone :</strong>
              <br />
              <a href={`tel:${contactPhone}`} style={{ color: '#007bff' }}>
                {contactPhone}
              </a>
            </p>
          )}
          <p>
            <strong>Accepte d'être recontacté par téléphone :</strong>
            <br />
            <span
              style={{
                color: acceptPhone ? '#28a745' : '#dc3545',
                fontWeight: 'bold',
              }}
            >
              {acceptPhone ? '✅ Oui' : '❌ Non'}
            </span>
          </p>
        </div>
      </AdminInfoBox>

      <AdminInfoBox type="details" title="💼 Description du projet">
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
          {message}
        </div>
      </AdminInfoBox>

      <AdminInfoBox type="action" title="⚡ Action requise">
        <div>
          <p style={{ margin: '0 0 10px 0' }}>
            <strong>
              Contactez le client dans les plus brefs délais pour :
            </strong>
          </p>
          <ul style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Analyser les besoins du projet</li>
            <li>Établir un devis personnalisé</li>
            <li>Planifier une éventuelle visite</li>
            <li>Proposer des solutions adaptées</li>
          </ul>
        </div>
      </AdminInfoBox>

      <AdminActionButton
        href={`mailto:${contactEmail}?subject=Devis personnalisé - SystemsMatic`}
        variant="primary"
      >
        📧 Répondre au client
      </AdminActionButton>

      {contactPhone && acceptPhone && (
        <AdminActionButton href={`tel:${contactPhone}`} variant="success">
          📞 Appeler le client
        </AdminActionButton>
      )}

      <Text style={commonStyles.footerNote}>
        Cette notification a été générée automatiquement. Merci de traiter cette
        demande rapidement.
      </Text>
    </BaseEmailAdmin>
  );
};
