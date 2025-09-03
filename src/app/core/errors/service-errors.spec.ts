import {
  ServiceError,
  ErrorCategory,
  DocumentServiceError,
  DocumentErrorCode,
  AzureIntelligenceError,
  AzureErrorCode,
  NetworkError,
  ConfigurationError,
  ValidationError,
  ErrorHandler
} from './service-errors';

describe('Service Errors', () => {
  describe('DocumentServiceError', () => {
    it('should create document service error with correct properties', () => {
      const error = new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        'Invalid file type',
        new Error('Original error'),
        { fileName: 'test.txt' }
      );

      expect(error).toBeInstanceOf(DocumentServiceError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(DocumentErrorCode.INVALID_FILE_TYPE);
      expect(error.category).toBe(ErrorCategory.PROCESSING);
      expect(error.message).toBe('Invalid file type');
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.context).toEqual({ fileName: 'test.txt' });
      expect(error.name).toBe('DocumentServiceError');
    });

    it('should work without original error and context', () => {
      const error = new DocumentServiceError(
        DocumentErrorCode.FILE_TOO_LARGE,
        'File too large'
      );

      expect(error.code).toBe(DocumentErrorCode.FILE_TOO_LARGE);
      expect(error.message).toBe('File too large');
      expect(error.originalError).toBeUndefined();
      expect(error.context).toBeUndefined();
    });
  });

  describe('AzureIntelligenceError', () => {
    it('should create azure intelligence error with correct properties', () => {
      const error = new AzureIntelligenceError(
        AzureErrorCode.SERVICE_NOT_CONFIGURED,
        'Service not configured',
        new Error('Config missing'),
        { endpoint: 'missing' }
      );

      expect(error).toBeInstanceOf(AzureIntelligenceError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe(AzureErrorCode.SERVICE_NOT_CONFIGURED);
      expect(error.category).toBe(ErrorCategory.PROCESSING);
      expect(error.message).toBe('Service not configured');
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.context).toEqual({ endpoint: 'missing' });
      expect(error.name).toBe('AzureIntelligenceError');
    });
  });

  describe('NetworkError', () => {
    it('should create network error with status code', () => {
      const error = new NetworkError(
        'Network request failed',
        404,
        new Error('Not found'),
        { url: 'https://api.example.com' }
      );

      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.message).toBe('Network request failed');
      expect(error.statusCode).toBe(404);
      expect(error.originalError).toBeInstanceOf(Error);
      expect(error.context).toEqual({ url: 'https://api.example.com' });
    });

    it('should work without status code', () => {
      const error = new NetworkError('Connection failed');

      expect(error.message).toBe('Connection failed');
      expect(error.statusCode).toBeUndefined();
    });
  });

  describe('ConfigurationError', () => {
    it('should create configuration error', () => {
      const error = new ConfigurationError(
        'Missing API key',
        new Error('Config error'),
        { key: 'API_KEY' }
      );

      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.category).toBe(ErrorCategory.CONFIGURATION);
      expect(error.message).toBe('Missing API key');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with field', () => {
      const error = new ValidationError(
        'Field is required',
        'email',
        new Error('Validation failed'),
        { value: '' }
      );

      expect(error).toBeInstanceOf(ValidationError);
      expect(error).toBeInstanceOf(ServiceError);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.message).toBe('Field is required');
      expect(error.field).toBe('email');
    });

    it('should work without field', () => {
      const error = new ValidationError('Invalid input');

      expect(error.message).toBe('Invalid input');
      expect(error.field).toBeUndefined();
    });
  });

  describe('ErrorHandler', () => {
    describe('createError', () => {
      it('should return existing ServiceError unchanged', () => {
        const originalError = new DocumentServiceError(
          DocumentErrorCode.INVALID_FILE_TYPE,
          'Original error'
        );

        const result = ErrorHandler.createError(originalError);

        expect(result).toBe(originalError);
      });

      it('should create NetworkError for HTTP errors', () => {
        const httpError = {
          status: 500,
          message: 'Internal Server Error'
        };

        const result = ErrorHandler.createError(httpError, { url: 'test' });

        expect(result).toBeInstanceOf(NetworkError);
        expect((result as NetworkError).statusCode).toBe(500);
        expect(result.message).toBe('Internal Server Error');
        expect(result.context).toEqual({ url: 'test' });
      });

      it('should create ValidationError for validation errors', () => {
        const validationError = {
          name: 'ValidationError',
          message: 'Invalid email',
          field: 'email'
        };

        const result = ErrorHandler.createError(validationError);

        expect(result).toBeInstanceOf(ValidationError);
        expect(result.message).toBe('Invalid email');
        expect((result as ValidationError).field).toBe('email');
      });

      it('should create generic ServiceError for unknown errors', () => {
        const unknownError = new Error('Unknown error');

        const result = ErrorHandler.createError(unknownError, { source: 'test' });

        expect(result).toBeInstanceOf(ServiceError);
        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.category).toBe(ErrorCategory.UNKNOWN);
        expect(result.message).toBe('Unknown error');
        expect(result.context).toEqual({ source: 'test' });
      });

      it('should handle null/undefined errors', () => {
        const result = ErrorHandler.createError(null);

        expect(result).toBeInstanceOf(ServiceError);
        expect(result.code).toBe('UNKNOWN_ERROR');
        expect(result.message).toBe('An unknown error occurred');
      });
    });

    describe('isRetryable', () => {
      it('should return true for retryable network errors', () => {
        const error500 = new NetworkError('Server error', 500);
        const error408 = new NetworkError('Timeout', 408);
        const error429 = new NetworkError('Rate limited', 429);

        expect(ErrorHandler.isRetryable(error500)).toBe(true);
        expect(ErrorHandler.isRetryable(error408)).toBe(true);
        expect(ErrorHandler.isRetryable(error429)).toBe(true);
      });

      it('should return false for non-retryable network errors', () => {
        const error400 = new NetworkError('Bad request', 400);
        const error401 = new NetworkError('Unauthorized', 401);
        const error404 = new NetworkError('Not found', 404);

        expect(ErrorHandler.isRetryable(error400)).toBe(false);
        expect(ErrorHandler.isRetryable(error401)).toBe(false);
        expect(ErrorHandler.isRetryable(error404)).toBe(false);
      });

      it('should return true for network errors without status code', () => {
        const networkError = new NetworkError('Connection failed');

        expect(ErrorHandler.isRetryable(networkError)).toBe(true);
      });

      it('should return true for quota exceeded Azure errors', () => {
        const quotaError = new AzureIntelligenceError(
          AzureErrorCode.QUOTA_EXCEEDED,
          'Quota exceeded'
        );

        expect(ErrorHandler.isRetryable(quotaError)).toBe(true);
      });

      it('should return false for non-retryable Azure errors', () => {
        const configError = new AzureIntelligenceError(
          AzureErrorCode.SERVICE_NOT_CONFIGURED,
          'Not configured'
        );

        expect(ErrorHandler.isRetryable(configError)).toBe(false);
      });

      it('should return false for document service errors', () => {
        const docError = new DocumentServiceError(
          DocumentErrorCode.INVALID_FILE_TYPE,
          'Invalid file'
        );

        expect(ErrorHandler.isRetryable(docError)).toBe(false);
      });

      it('should return false for validation errors', () => {
        const validationError = new ValidationError('Invalid input');

        expect(ErrorHandler.isRetryable(validationError)).toBe(false);
      });
    });

    describe('getUserMessage', () => {
      it('should return user-friendly messages for document errors', () => {
        const invalidFileError = new DocumentServiceError(
          DocumentErrorCode.INVALID_FILE_TYPE,
          'Technical message'
        );
        const fileTooLargeError = new DocumentServiceError(
          DocumentErrorCode.FILE_TOO_LARGE,
          'Technical message'
        );
        const notFoundError = new DocumentServiceError(
          DocumentErrorCode.DOCUMENT_NOT_FOUND,
          'Technical message'
        );

        expect(ErrorHandler.getUserMessage(invalidFileError)).toBe('Please select a valid PDF file.');
        expect(ErrorHandler.getUserMessage(fileTooLargeError)).toBe('File size must be less than 50MB.');
        expect(ErrorHandler.getUserMessage(notFoundError)).toBe('The requested document could not be found.');
      });

      it('should return user-friendly messages for Azure errors', () => {
        const notConfiguredError = new AzureIntelligenceError(
          AzureErrorCode.SERVICE_NOT_CONFIGURED,
          'Technical message'
        );
        const quotaError = new AzureIntelligenceError(
          AzureErrorCode.QUOTA_EXCEEDED,
          'Technical message'
        );

        expect(ErrorHandler.getUserMessage(notConfiguredError)).toBe('Document analysis service is not properly configured.');
        expect(ErrorHandler.getUserMessage(quotaError)).toBe('Service quota exceeded. Please try again later.');
      });

      it('should return generic message for unknown error codes', () => {
        const unknownError = new (class extends ServiceError {
          readonly code = 'UNKNOWN_CODE';
          readonly category = ErrorCategory.UNKNOWN;
        })('Unknown', new Error(), {});

        expect(ErrorHandler.getUserMessage(unknownError)).toBe('An error occurred while processing your request.');
      });
    });
  });

  describe('Error inheritance and stack traces', () => {
    it('should maintain proper inheritance chain', () => {
      const error = new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        'Test error'
      );

      expect(error instanceof Error).toBe(true);
      expect(error instanceof ServiceError).toBe(true);
      expect(error instanceof DocumentServiceError).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new DocumentServiceError(
        DocumentErrorCode.INVALID_FILE_TYPE,
        'Test error'
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('DocumentServiceError');
    });

    it('should preserve original error stack trace', () => {
      const originalError = new Error('Original error');
      const wrappedError = new DocumentServiceError(
        DocumentErrorCode.PROCESSING_FAILED,
        'Wrapped error',
        originalError
      );

      expect(wrappedError.originalError).toBe(originalError);
      expect(wrappedError.originalError?.stack).toBeDefined();
    });
  });
});