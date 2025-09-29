import React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseEmailAdmin } from './components/BaseEmailAdmin';
import { AdminInfoBox } from './components/AdminInfoBox';
import { AdminActionButton } from './components/AdminActionButton';
import { commonStyles } from './styles/common';

interface AdminAppointmentNotificationProps {
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  requestedDate: string;
  reason?: string;
  reasonOther?: string;
  message?: string;
}

export const AdminAppointmentNotification: React.FC<
  AdminAppointmentNotificationProps
> = ({
  contactName,
  contactEmail,
  contactPhone,
  requestedDate,
  reason,
  reasonOther,
  message,
}) => {
  return (
    <BaseEmailAdmin title="Nouvelle demande de rendez-vous" type="appointment">
      <Text style={commonStyles.greeting}>Bonjour Admin,</Text>

      <Text style={commonStyles.paragraph}>
        Une nouvelle demande de rendez-vous a été soumise et nécessite votre
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
        </div>
      </AdminInfoBox>

      <AdminInfoBox type="details" title="📅 Détails de la demande">
        <div>
          <p>
            <strong>Date souhaitée :</strong>
            <br />
            <span
              style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}
            >
              {requestedDate}
            </span>
          </p>
          <p>
            <strong>Motif :</strong>
            <br />
            {reason || 'Non spécifié'}
          </p>
          {reasonOther && (
            <p>
              <strong>Précision :</strong>
              <br />
              {reasonOther}
            </p>
          )}
          {message && (
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              <strong>Message :</strong>
              <br />
              {message}
            </p>
          )}
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
            <li>Confirmer la disponibilité</li>
            <li>Valider le créneau horaire</li>
            <li>Préparer l'intervention</li>
          </ul>
        </div>
      </AdminInfoBox>

      <AdminActionButton
        href={`mailto:${contactEmail}?subject=Confirmation de votre rendez-vous`}
        variant="primary"
      >
        📧 Répondre au client
      </AdminActionButton>

      {contactPhone && (
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
