import { readdir, unlink, stat, mkdir } from 'fs/promises';
import { join } from 'path';

const UPLOAD_DIR = join('/tmp', 'uploads');
const OUTPUT_DIR = join('/tmp', 'outputs');
const MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

// Ensure directories exist before cleanup
async function ensureDirectories(): Promise<void> {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directories might already exist
  }
}

// Clean up old files in a directory
async function cleanupDirectory(directory: string): Promise<{ deleted: number; errors: string[] }> {
  const result = { deleted: 0, errors: [] as string[] };

  try {
    // Ensure directory exists before reading
    await mkdir(directory, { recursive: true });
    const files = await readdir(directory);

    for (const file of files) {
      try {
        const filePath = join(directory, file);
        const fileStat = await stat(filePath);
        const now = Date.now();
        const fileAge = now - fileStat.mtimeMs;

        // Delete files older than MAX_AGE_MS
        if (fileAge > MAX_AGE_MS) {
          await unlink(filePath);
          result.deleted++;
          console.log(`🗑️  Deleted old file: ${file} (${Math.round(fileAge / 1000 / 60)} minutes old)`);
        }
      } catch (error) {
        const errorMessage = `Failed to process file ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        result.errors.push(errorMessage);
        console.error(`❌ ${errorMessage}`);
      }
    }
  } catch (error) {
    const errorMessage = `Failed to read directory ${directory}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    result.errors.push(errorMessage);
    console.error(`❌ ${errorMessage}`);
  }

  return result;
}

// Main cleanup function
export async function cleanupOldFiles(): Promise<void> {
  console.log('🧹 Starting file cleanup process...');

  // Ensure directories exist before cleanup
  await ensureDirectories();

  try {
    const uploadResult = await cleanupDirectory(UPLOAD_DIR);
    const outputResult = await cleanupDirectory(OUTPUT_DIR);

    const totalDeleted = uploadResult.deleted + outputResult.deleted;
    const totalErrors = uploadResult.errors.length + outputResult.errors.length;

    if (totalDeleted > 0) {
      console.log(`✅ Cleanup completed: ${totalDeleted} files deleted`);
    } else {
      console.log('✅ Cleanup completed: No old files found');
    }

    if (totalErrors > 0) {
      console.log(`⚠️  Cleanup completed with ${totalErrors} errors`);
    }

  } catch (error) {
    console.error('❌ Cleanup process failed:', error);
  }
}

// Schedule cleanup to run every 30 minutes
export function scheduleCleanup(): void {
  // Run cleanup immediately on startup
  cleanupOldFiles();

  // Schedule cleanup to run every 30 minutes
  const cleanupInterval = setInterval(() => {
    cleanupOldFiles();
  }, 30 * 60 * 1000); // 30 minutes

  // Ensure cleanup runs before process exits
  process.on('SIGINT', () => {
    clearInterval(cleanupInterval);
    cleanupOldFiles().then(() => {
      console.log('👋 Final cleanup completed. Exiting...');
      process.exit(0);
    });
  });

  process.on('SIGTERM', () => {
    clearInterval(cleanupInterval);
    cleanupOldFiles().then(() => {
      console.log('👋 Final cleanup completed. Exiting...');
      process.exit(0);
    });
  });

  console.log('⏰ File cleanup scheduled to run every 30 minutes');
}