/**
 * Test Environment Configuration
 * This file is used during unit tests to provide mock configuration.
 */
export const environment = {
  production: false,
  azure: {
    endpoint: 'https://test-endpoint.cognitiveservices.azure.com/',
    apiKey: 'test-api-key-for-unit-tests',
    apiVersion: '2024-02-29-preview'
  },
  logging: {
    level: 'debug',
    enableConsoleLogging: false
  }
};