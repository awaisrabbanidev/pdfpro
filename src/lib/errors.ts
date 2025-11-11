// Custom error classes for better error handling
export class PDFProcessingError extends Error {
  public statusCode: number;
  public userMessage: string;
  public code: string;

  constructor(message: string, statusCode: number = 500, userMessage?: string, code?: string) {
    super(message);
    this.name = 'PDFProcessingError';
    this.statusCode = statusCode;
    this.userMessage = userMessage || 'An error occurred while processing your PDF file';
    this.code = code || 'UNKNOWN_ERROR';
  }
}

export class ValidationError extends PDFProcessingError {
  constructor(message: string, userMessage?: string) {
    super(message, 400, userMessage || 'Invalid input provided', 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class FileNotFoundError extends PDFProcessingError {
  constructor(filename: string) {
    super(`File not found: ${filename}`, 404, `The file "${filename}" could not be found`, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
  }
}

export class FileSizeError extends PDFProcessingError {
  constructor(size: number, maxSize: number) {
    super(
      `File size ${size} exceeds maximum ${maxSize}`,
      413,
      `File is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB`,
      'FILE_TOO_LARGE'
    );
    this.name = 'FileSizeError';
  }
}

export class UnsupportedFileTypeError extends PDFProcessingError {
  constructor(fileType: string, supportedTypes: string[]) {
    super(
      `Unsupported file type: ${fileType}`,
      415,
      `Unsupported file type "${fileType}". Supported types: ${supportedTypes.join(', ')}`,
      'UNSUPPORTED_FILE_TYPE'
    );
    this.name = 'UnsupportedFileTypeError';
  }
}

export class CorruptedFileError extends PDFProcessingError {
  constructor(filename: string) {
    super(`Corrupted file: ${filename}`, 422, `The file "${filename}" appears to be corrupted or invalid`, 'CORRUPTED_FILE');
    this.name = 'CorruptedFileError';
  }
}

export class ProcessingTimeoutError extends PDFProcessingError {
  constructor(timeout: number) {
    super(
      `Processing timed out after ${timeout}ms`,
      408,
      'File processing took too long. Please try with a smaller file.',
      'PROCESSING_TIMEOUT'
    );
    this.name = 'ProcessingTimeoutError';
  }
}

export class RateLimitError extends PDFProcessingError {
  constructor(limit: number, windowMs: number) {
    super(
      `Rate limit exceeded`,
      429,
      `Too many requests. Please wait ${Math.round(windowMs / 1000)} seconds before trying again.`,
      'RATE_LIMIT_EXCEEDED'
    );
    this.name = 'RateLimitError';
  }
}

// Error response formatter
export function formatErrorResponse(error: unknown): {
  error: string;
  code?: string;
  details?: any;
  statusCode: number;
} {
  if (error instanceof PDFProcessingError) {
    return {
      error: error.userMessage,
      code: error.code,
      statusCode: error.statusCode
    };
  }

  if (error instanceof Error) {
    // Log the full error for debugging
    console.error('Unhandled error:', error);

    return {
      error: 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      statusCode: 500
    };
  }

  console.error('Unknown error type:', error);
  return {
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    statusCode: 500
  };
}

// Async error wrapper for API routes
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);

      if (error instanceof PDFProcessingError) {
        const response = formatErrorResponse(error);
        throw new Error(JSON.stringify(response));
      }

      const response = formatErrorResponse(error);
      throw new Error(JSON.stringify(response));
    }
  };
}

// File validation utilities
export function validateFileSize(size: number, maxSize: number = 20 * 1024 * 1024): void {
  if (size > maxSize) {
    throw new FileSizeError(size, maxSize);
  }
}

export function validateFileType(filename: string, allowedTypes: string[]): void {
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension || !allowedTypes.includes(`.${extension}`)) {
    throw new UnsupportedFileTypeError(`.${extension || 'unknown'}`, allowedTypes);
  }
}

export function sanitizeFilename(filename: string): string {
  // Remove dangerous characters and limit length
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 255);
}

// Timeout wrapper for long-running operations
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ProcessingTimeoutError(timeoutMs)), timeoutMs);
    })
  ]);
}