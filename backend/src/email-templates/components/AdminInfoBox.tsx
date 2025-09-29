import React from 'react';
import { Section, Text } from '@react-email/components';

interface AdminInfoBoxProps {
  children: React.ReactNode;
  type?: 'client' | 'details' | 'action' | 'urgent';
  title?: string;
}

export const AdminInfoBox: React.FC<AdminInfoBoxProps> = ({
  children,
  type = 'details',
  title,
}) => {
  const getStyles = () => {
    switch (type) {
      case 'client':
        return {
          backgroundColor: '#e3f2fd',
          borderLeft: '4px solid #2196f3',
          color: '#0d47a1',
        };
      case 'action':
        return {
          backgroundColor: '#fff3e0',
          borderLeft: '4px solid #ff9800',
          color: '#e65100',
        };
      case 'urgent':
        return {
          backgroundColor: '#ffebee',
          borderLeft: '4px solid #f44336',
          color: '#c62828',
        };
      default:
        return {
          backgroundColor: '#f3e5f5',
          borderLeft: '4px solid #9c27b0',
          color: '#4a148c',
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
  padding: '20px',
  borderRadius: '6px',
  margin: '20px 0',
};

const infoBoxTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0 0 12px 0',
};

const infoBoxText = {
  fontSize: '14px',
  lineHeight: '1.6',
  margin: '0',
};
