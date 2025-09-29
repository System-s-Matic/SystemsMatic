import React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseEmail } from './components/BaseEmail';
import { InfoBox } from './components/InfoBox';
import { ActionButton } from './components/ActionButton';
import { commonStyles } from './styles/common';

interface AppointmentRequestProps {
  contactName: string;
  requestedDate: string;
  reason?: string;
  reasonOther?: string;
  message?: string;
  cancelUrl: string;
}

export const AppointmentRequest: React.FC<AppointmentRequestProps> = ({
  contactName,
  requestedDate,
  reason,
  reasonOther,
  message,
  cancelUrl,
}) => {
  return (
    <BaseEmail title="Demande de rendez-vous reçue">
      <Text style={commonStyles.greeting}>Bonjour {contactName},</Text>

      <Text style={commonStyles.paragraph}>
        Nous avons bien reçu votre demande de rendez-vous et nous vous en
        remercions. Notre équipe va l'examiner attentivement et vous recontacter
        rapidement pour confirmer la date et l'heure.
      </Text>

      <InfoBox title="Récapitulatif de votre demande">
        <div>
          <p>
            <strong>Date souhaitée :</strong>
            <br />
            {requestedDate}
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
      </InfoBox>

      <InfoBox type="info" title="Prochaines étapes">
        <div>
          📞 Nous vous contacterons sous 24h
          <br />
          📅 Confirmation de la date et heure
          <br />
          ✅ Validation de votre rendez-vous
          <br />
          📋 Préparation de l'intervention
        </div>
      </InfoBox>

      <ActionButton href={cancelUrl} variant="danger">
        🚫 Annuler cette demande
      </ActionButton>

      <Text style={commonStyles.footerNote}>
        En cas de question urgente, n'hésitez pas à nous contacter directement.
      </Text>
    </BaseEmail>
  );
};
