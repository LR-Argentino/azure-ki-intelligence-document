/**
 * Base class for all service errors
 */
export abstract class ServiceError extends Error {
  abstract readonly code: string;
  abstract readonly category: ErrorCategory;
  
  constructor(
    message: string,
    public readonly originalError?: Error,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintain proper stack trace
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error categories for better error handling
 */
export enum ErrorCategory {
  VALIDATION = 'validation',
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  PROCESSING = 'processing',
  CONFIGURATION = 'configuration',
  UNKNOWN = 'unknown'
}

/**
 * Document service specific errors
 */
export class DocumentServiceError extends ServiceError {
  readonly category = ErrorCategory.PROCESSING;
  
  constructor(
    public readonly code: DocumentErrorCode,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, originalError, context);
  }
}

export enum DocumentErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  INVALID_DOCUMENT_ID = 'INVALID_DOCUMENT_ID'
}

/**
 * Azure Intelligence service specific errors
 */
export class AzureIntelligenceError extends ServiceError {
  readonly category = ErrorCategory.PROCESSING;
  
  constructor(
    public readonly code: AzureErrorCode,
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, originalError, context);
  }
}

export enum AzureErrorCode {
  SERVICE_NOT_CONFIGURED = 'SERVICE_NOT_CONFIGURED',
  INVALID_API_KEY = 'INVALID_API_KEY',
  INVALID_ENDPOINT = 'INVALID_ENDPOINT',
  ANALYSIS_FAILED = 'ANALYSIS_FAILED',
  OPERATION_NOT_FOUND = 'OPERATION_NOT_FOUND',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNSUPPORTED_FILE_FORMAT = 'UNSUPPORTED_FILE_FORMAT'
}

/**
 * Network related errors
 */
export class NetworkError extends ServiceError {
  readonly category = ErrorCategory.NETWORK;
  readonly code = 'NETWORK_ERROR';
  
  constructor(
    message: string,
    public readonly statusCode?: number,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, originalError, context);
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends ServiceError {
  readonly category = ErrorCategory.CONFIGURATION;
  readonly code = 'CONFIGURATION_ERROR';
  
  constructor(
    message: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, originalError, context);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends ServiceError {
  readonly category = ErrorCategory.VALIDATION;
  readonly code = 'VALIDATION_ERROR';
  
  constructor(
    message: string,
    public readonly field?: string,
    originalError?: Error,
    context?: Record<string, any>
  ) {
    super(message, originalError, context);
  }
}

/**
 * Error handler utility functions
 */
export class ErrorHandler {
  /**
   * Create appropriate error based on the original error
   */
  static createError(originalError: any, context?: Record<string, any>): ServiceError {
    if (originalError instanceof ServiceError) {
      return originalError;
    }
    
    // Handle HTTP errors
    if (originalError?.status) {
      return new NetworkError(
        originalError.message || 'Network request failed',
        originalError.status,
        originalError,
        context
      );
    }
    
    // Handle validation errors
    if (originalError?.name === 'ValidationError') {
      return new ValidationError(
        originalError.message,
        originalError.field,
        originalError,
        context
      );
    }
    
    // Default to generic service error - create anonymous class
    return new (class extends ServiceError {
      readonly code = 'UNKNOWN_ERROR';
      readonly category = ErrorCategory.UNKNOWN;
    })(
      originalError?.message || 'An unknown error occurred',
      originalError,
      context
    );
  }
  
  /**
   * Check if error is retryable
   */
  static isRetryable(error: ServiceError): boolean {
    if (error.category === ErrorCategory.NETWORK) {
      const networkError = error as NetworkError;
      // Retry on 5xx errors and some 4xx errors
      return !networkError.statusCode || 
             networkError.statusCode >= 500 || 
             networkError.statusCode === 408 || 
             networkError.statusCode === 429;
    }
    
    if (error instanceof AzureIntelligenceError) {
      return error.code === AzureErrorCode.QUOTA_EXCEEDED;
    }
    
    return false;
  }
  
  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: ServiceError): string {
    switch (error.code) {
      case DocumentErrorCode.INVALID_FILE_TYPE:
        return 'Please select a valid PDF file.';
      case DocumentErrorCode.FILE_TOO_LARGE:
        return 'File size must be less than 50MB.';
      case DocumentErrorCode.DOCUMENT_NOT_FOUND:
        return 'The requested document could not be found.';
      case AzureErrorCode.SERVICE_NOT_CONFIGURED:
        return 'Document analysis service is not properly configured.';
      case AzureErrorCode.QUOTA_EXCEEDED:
        return 'Service quota exceeded. Please try again later.';
      default:
        return 'An error occurred while processing your request.';
    }
  }
}