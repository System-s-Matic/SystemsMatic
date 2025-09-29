import React from 'react';
import { Section, Link } from '@react-email/components';

interface AdminActionButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

export const AdminActionButton: React.FC<AdminActionButtonProps> = ({
  href,
  children,
  variant = 'primary',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: '#6c757d',
          color: 'white',
        };
      case 'success':
        return {
          backgroundColor: '#28a745',
          color: 'white',
        };
      case 'warning':
        return {
          backgroundColor: '#ffc107',
          color: '#212529',
        };
      case 'danger':
        return {
          backgroundColor: '#dc3545',
          color: 'white',
        };
      default:
        return {
          backgroundColor: '#007bff',
          color: 'white',
        };
    }
  };

  const styles = getStyles();

  return (
    <Section style={buttonContainer}>
      <Link href={href} style={{ ...buttonStyle, ...styles }}>
        {children}
      </Link>
    </Section>
  );
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '25px 0',
};

const buttonStyle = {
  display: 'inline-block',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontWeight: '600',
  fontSize: '16px',
  textAlign: 'center' as const,
  transition: 'all 0.3s ease',
  border: 'none',
  cursor: 'pointer',
  margin: '10px 5px',
};
