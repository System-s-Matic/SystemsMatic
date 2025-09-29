import React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseEmail } from './components/BaseEmail';
import { InfoBox } from './components/InfoBox';
import { ActionButton } from './components/ActionButton';
import { commonStyles } from './styles/common';

interface AppointmentConfirmationProps {
  contactName: string;
  scheduledDate: string;
  reason?: string;
  cancelUrl: string;
}

export const AppointmentConfirmation: React.FC<
  AppointmentConfirmationProps
> = ({ contactName, scheduledDate, reason, cancelUrl }) => {
  return (
    <BaseEmail title="Rendez-vous confirmé">
      <Text style={commonStyles.greeting}>Bonjour {contactName},</Text>

      <Text style={commonStyles.paragraph}>
        Excellente nouvelle ! Votre rendez-vous a été confirmé.
      </Text>

      <InfoBox type="success" title="📅 Détails du rendez-vous">
        <div>
          <p
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
            }}
          >
            {scheduledDate}
          </p>
          {reason && (
            <p>
              <strong>Motif :</strong>
              <br />
              {reason}
            </p>
          )}
        </div>
      </InfoBox>

      <InfoBox type="warning" title="⚠️ Important">
        <div>
          Vous ne pouvez annuler ce rendez-vous que jusqu'à 24h avant l'heure
          prévue. Passé ce délai, veuillez nous contacter directement.
        </div>
      </InfoBox>

      <ActionButton href={cancelUrl} variant="danger">
        🚫 Annuler ce rendez-vous
      </ActionButton>

      <Text style={commonStyles.footerNote}>
        En cas de question urgente, n'hésitez pas à nous contacter directement.
      </Text>
    </BaseEmail>
  );
};
