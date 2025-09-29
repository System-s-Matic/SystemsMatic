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

interface BaseEmailProps {
  children: React.ReactNode;
  title: string;
}

export const BaseEmail: React.FC<BaseEmailProps> = ({ children, title }) => {
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
            <Img
              src="https://res.cloudinary.com/dfqpyuhyj/image/upload/v1758333945/1755694814429f_-_Ramco_tpoknd.jpg"
              width="50"
              height="50"
              alt="SystemsMatic"
              style={logo}
            />
            <Text style={headerTitle}>SystemsMatic</Text>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={hr} />

          <Section style={footer}>
            <Text style={footerText}>SystemsMatic</Text>
            <Text style={footerText}>
              Cet email a été envoyé automatiquement, merci de ne pas y répondre
              directement.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles alignés avec les prévisualisations
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

const logo = {
  width: '60px',
  height: '60px',
  backgroundColor: 'white',
  borderRadius: '50%',
  margin: '0 auto 15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#667eea',
};

const headerTitle = {
  fontSize: '24px',
  fontWeight: '600',
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
