import React from 'react';
import { Section, Text } from '@react-email/components';

interface InfoBoxProps {
  children: React.ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export const InfoBox: React.FC<InfoBoxProps> = ({
  children,
  type = 'info',
  title,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#d4edda',
          borderLeft: '4px solid #28a745',
          color: '#155724',
        };
      case 'warning':
        return {
          backgroundColor: '#fff3cd',
          borderLeft: '4px solid #ffc107',
          color: '#856404',
        };
      case 'error':
        return {
          backgroundColor: '#f8d7da',
          borderLeft: '4px solid #dc3545',
          color: '#721c24',
        };
      default:
        return {
          backgroundColor: '#d1ecf1',
          borderLeft: '4px solid #17a2b8',
          color: '#0c5460',
        };
    }
  };

  const styles = getStyles();

  return (
    <Section style={{ ...infoBoxStyle, ...styles }}>
      {title && (
        <Text style={{ ...infoBoxTitle, color: styles.color }}>{title}</Text>
      )}
      <Text style={{ ...infoBoxText, color: styles.color }}>{children}</Text>
    </Section>
  );
};

const infoBoxStyle = {
  padding: '15px',
  borderRadius: '6px',
  margin: '15px 0',
};

const infoBoxTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const infoBoxText = {
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};
