/**
 * Production Environment Configuration
 * 
 * SECURITY WARNING:
 * In production, API keys should be handled by a backend service.
 * This configuration should point to your backend API endpoints.
 */
export const environment = {
  production: true,
  azure: {
    endpoint: '/api/azure-proxy', // Point to your backend proxy
    apiKey: '', // Should be empty - handled by backend
    apiVersion: '2024-02-29-preview'
  },
  logging: {
    level: 'error',
    enableConsoleLogging: false
  }
};