/**
 * Development Environment Configuration
 * This file contains configuration for development environment.
 * 
 * SECURITY WARNING: 
 * These values will be visible in the browser. Never put production
 * API keys here. Use a backend proxy for production environments.
 */
export const environment = {
  production: false,
  azure: {
    endpoint: 'https://document-idp.cognitiveservices.azure.com/',
    apiKey: '', // Add your development API key here
    apiVersion: '2024-02-29-preview'
  },
  logging: {
    level: 'debug',
    enableConsoleLogging: true
  }
};