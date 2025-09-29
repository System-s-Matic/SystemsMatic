// Styles communs pour tous les templates d'email
// Alignés avec les prévisualisations HTML

export const commonStyles = {
  greeting: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e293b',
    margin: '0 0 16px 0',
  },

  paragraph: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#4b5563',
    margin: '0 0 20px 0',
  },

  footerNote: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center' as const,
    margin: '30px 0 0 0',
  },

  contentTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px',
  },

  contentText: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '15px',
  },

  highlightText: {
    backgroundColor: '#fff3cd',
    padding: '2px 6px',
    borderRadius: '4px',
    fontWeight: '600',
  },
};
