import React from 'react';
import { Text, Section } from '@react-email/components';
import { BaseEmail } from './components/BaseEmail';
import { InfoBox } from './components/InfoBox';
import { ActionButton } from './components/ActionButton';
import { commonStyles } from './styles/common';

interface AppointmentReminderProps {
  contactName: string;
  scheduledDate: string;
  reason?: string;
  cancelUrl: string;
}

export const AppointmentReminder: React.FC<AppointmentReminderProps> = ({
  contactName,
  scheduledDate,
  reason,
  cancelUrl,
}) => {
  return (
    <BaseEmail title="Rappel : votre rendez-vous approche">
      <Text style={commonStyles.greeting}>Bonjour {contactName},</Text>

      <Text style={commonStyles.paragraph}>
        Petit rappel concernant votre rendez-vous qui approche !
      </Text>

      <InfoBox type="warning" title="📅 Votre rendez-vous">
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

      <InfoBox type="info" title="ℹ️ Rappel">
        <div>
          Si vous devez annuler ce rendez-vous, pensez à le faire au moins 24h à
          l'avance.
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
