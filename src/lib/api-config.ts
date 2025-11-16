import { mkdir, writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';

// Vercel serverless compatible directory configuration
// NOTE: /var/task/ is READ-ONLY on Vercel, we must use /tmp for all writes
const DIRS = {
  UPLOADS: join('/tmp', 'uploads'),
  OUTPUTS: join('/tmp', 'outputs'),
  TEMP: join('/tmp', 'temp')
};

// Ensure all required directories exist (uses /tmp for Vercel compatibility)
export async function ensureDirectories() {
  try {
    await Promise.all([
      mkdir(DIRS.UPLOADS, { recursive: true }),
      mkdir(DIRS.OUTPUTS, { recursive: true }),
      mkdir(DIRS.TEMP, { recursive: true })
    ]);
    console.log('✅ Vercel-compatible directories ensured:', Object.values(DIRS));
  } catch (error) {
    console.error('❌ Failed to create directories:', error);
    throw new Error('Directory initialization failed');
  }
}

// API Error class for proper error handling
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

// Common API errors
export const API_ERRORS = {
  INVALID_FILE: new APIError('Invalid file format or corrupted file', 400, 'INVALID_FILE'),
  FILE_TOO_LARGE: new APIError('File size exceeds limit', 413, 'FILE_TOO_LARGE'),
  PROCESSING_FAILED: new APIError('File processing failed', 500, 'PROCESSING_FAILED'),
  DIRECTORY_ERROR: new APIError('Directory access error', 500, 'DIRECTORY_ERROR'),
  NETWORK_ERROR: new APIError('Network timeout or connection error', 503, 'NETWORK_ERROR')
};

// HTTP status code handlers
export const handleAPIResponse = (response: any, error?: any) => {
  if (error) {
    if (error instanceof APIError) {
      return Response.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          statusCode: error.statusCode
        },
        { status: error.statusCode }
      );
    }

    // Handle common errors
    if (error.message?.includes('ENOENT') || error.message?.includes('directory')) {
      return Response.json(
        {
          success: false,
          error: 'File system temporarily unavailable',
          code: 'DIRECTORY_ERROR',
          statusCode: 503
        },
        { status: 503 }
      );
    }

    if (error.message?.includes('ETIMEOUT') || error.message?.includes('timeout')) {
      return Response.json(
        {
          success: false,
          error: 'Request timeout. Please try again.',
          code: 'TIMEOUT_ERROR',
          statusCode: 408
        },
        { status: 408 }
      );
    }

    // Handle EROFS (read-only file system) errors
    if (error.message?.includes('EROFS') || error.message?.includes('read-only')) {
      return Response.json(
        {
          success: false,
          error: 'File processing temporarily unavailable',
          code: 'FILESYSTEM_READONLY',
          statusCode: 503
        },
        { status: 503 }
      );
    }

    // Generic error
    return Response.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        statusCode: 500
      },
      { status: 500 }
    );
  }

  // Success response
  return Response.json({
    success: true,
    data: response
  }, { status: 200 });
};

// File validation utilities
export const validateFile = (file: any, maxSize: number = 4.5 * 1024 * 1024) => {
  if (!file || !file.name || !file.data) {
    throw API_ERRORS.INVALID_FILE;
  }

  // Check file size (4.5MB Vercel limit)
  const fileSize = Buffer.from(file.data, 'base64').length;
  if (fileSize > maxSize) {
    throw new APIError(
      `File size ${(fileSize / 1024 / 1024).toFixed(1)}MB exceeds limit of ${maxSize / 1024 / 1024}MB`,
      413,
      'FILE_TOO_LARGE'
    );
  }

  return true;
};

// Directory access with proper error handling
export const safeFileOperation = async (operation: () => Promise<any>) => {
  try {
    // Ensure directories exist before any operation
    await ensureDirectories();
    return await operation();
  } catch (error) {
    console.error('File operation failed:', error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      'File system operation failed',
      500,
      'FILE_OPERATION_ERROR',
      error
    );
  }
};

// File writing with error handling (uses /tmp for Vercel)
export const writeFileSafe = async (filename: string, data: Buffer) => {
  return safeFileOperation(async () => {
    // Generate unique filename to avoid collisions
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    const uniqueFilename = `${timestamp}-${randomId}-${filename}`;
    const filePath = join(DIRS.OUTPUTS, uniqueFilename);

    await writeFile(filePath, data);
    console.log(`✅ File written successfully to /tmp: ${uniqueFilename}`);
    return { filename: uniqueFilename, path: filePath };
  });
};

// File reading with error handling (uses /tmp for Vercel)
export const readFileSafe = async (filename: string) => {
  return safeFileOperation(async () => {
    const filePath = join(DIRS.OUTPUTS, filename);
    const data = await readFile(filePath);
    console.log(`✅ File read successfully from /tmp: ${filename}`);
    return data;
  });
};

// Clean up temporary files
export const cleanupTempFile = async (filename: string) => {
  try {
    const filePath = join(DIRS.OUTPUTS, filename);
    await unlink(filePath);
    console.log(`🗑️  Cleaned up temporary file: ${filename}`);
  } catch (error) {
    console.warn(`⚠️  Failed to cleanup file ${filename}:`, error);
  }
};

// Export directories for use in API routes
export { DIRS };

// Get directories object
export function getDirectories() {
  return DIRS;
}