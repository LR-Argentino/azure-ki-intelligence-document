export class FileValidatorUtil {
  
  static readonly ALLOWED_TYPES = ['application/pdf'];
  static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  static readonly MIN_FILE_SIZE = 1024; // 1KB

  /**
   * Validate file type, size, and other constraints
   */
  static validateFile(file: File): ValidationResult {
    const errors: string[] = [];

    // Check file type
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      errors.push(`File type ${file.type} is not supported. Only PDF files are allowed.`);
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      errors.push(`File size ${this.formatFileSize(file.size)} exceeds maximum allowed size of ${this.formatFileSize(this.MAX_FILE_SIZE)}.`);
    }

    if (file.size < this.MIN_FILE_SIZE) {
      errors.push(`File size ${this.formatFileSize(file.size)} is too small. Minimum size is ${this.formatFileSize(this.MIN_FILE_SIZE)}.`);
    }

    // Check file name
    if (!file.name || file.name.trim().length === 0) {
      errors.push('File name is required.');
    }

    if (file.name.length > 255) {
      errors.push('File name is too long. Maximum length is 255 characters.');
    }

    // Check for potentially dangerous file names
    if (this.containsDangerousCharacters(file.name)) {
      errors.push('File name contains invalid characters.');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  /**
   * Check if file is a PDF
   */
  static isPDF(file: File): boolean {
    return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  }

  /**
   * Get file extension
   */
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Check for dangerous characters in file name
   */
  private static containsDangerousCharacters(fileName: string): boolean {
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
    return dangerousChars.test(fileName);
  }
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}