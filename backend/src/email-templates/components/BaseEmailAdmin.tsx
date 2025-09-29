import React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Img,
  Hr,
} from '@react-email/components';

interface BaseEmailAdminProps {
  children: React.ReactNode;
  title: string;
  type: 'appointment' | 'quote';
}

export const BaseEmailAdmin: React.FC<BaseEmailAdminProps> = ({
  children,
  title,
  type,
}) => {
  const getHeaderIcon = () => {
    switch (type) {
      case 'appointment':
        return '📅';
      case 'quote':
        return '💰';
      default:
        return '🔔';
    }
  };

  return (
    <Html>
      <Head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerIcon}>{getHeaderIcon()}</Text>
            <Text style={headerTitle}>{title}</Text>
            <Text style={headerSubtitle}>SystemsMatic</Text>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>SystemsMatic</Text>
            <Text style={footerText}>
              Cet email a été envoyé automatiquement par le système de
              notification.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles alignés avec les prévisualisations mais adaptés pour les admins
const main = {
  backgroundColor: '#f5f5f5',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif',
  lineHeight: '1.6',
  color: '#333',
};

const container = {
  maxWidth: '600px',
  margin: '0 auto',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  overflow: 'hidden',
};

const header = {
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  color: 'white',
  padding: '30px 20px',
  textAlign: 'center' as const,
};

const headerIcon = {
  fontSize: '32px',
  margin: '0 0 10px 0',
  display: 'block',
};

const headerTitle = {
  fontSize: '24px',
  fontWeight: '600',
  margin: '0 0 8px 0',
  color: 'white',
};

const headerSubtitle = {
  fontSize: '14px',
  opacity: '0.9',
  margin: '0',
  color: 'white',
};

const content = {
  padding: '30px 20px',
  backgroundColor: '#ffffff',
};

const hr = {
  height: '1px',
  backgroundColor: '#e9ecef',
  margin: '20px 0',
  border: 'none',
};

const footer = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e9ecef',
};

const footerText = {
  fontSize: '14px',
  color: '#6c757d',
  margin: '0',
};
