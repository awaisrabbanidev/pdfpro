import fs from 'fs';
import path from 'path';

// Directory constants
export const UPLOADS_DIR = '/tmp/uploads';
export const OUTPUTS_DIR = '/tmp/outputs';

// Ensure temp directories exist before any file operations
export function ensureTempDirs() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

// Safe JSON parse with debug logging
export function safeJsonParse(maybeJson: any, label = 'unknown') {
  if (typeof maybeJson !== 'string') {
    console.warn(`[safeJsonParse:${label}] not a string; type=${typeof maybeJson}`);
    return null;
  }

  const s = maybeJson.trim();
  if (!s.startsWith('{') && !s.startsWith('[')) {
    console.warn(`[safeJsonParse:${label}] not JSON text (first 200 chars):`, s.slice(0, 200));
    return null;
  }

  try {
    return JSON.parse(s);
  } catch (err) {
    console.error(`[safeJsonParse:${label}] JSON.parse failed:`, (err as Error).message);
    console.error(`[safeJsonParse:${label}] raw (first 200 chars):`, s.slice(0, 200));
    return null;
  }
}

// Helper to clean up old files
export function cleanupOldFiles(maxAgeMs: number = 2 * 60 * 60 * 1000): void {
  const now = Date.now();

  [UPLOADS_DIR, OUTPUTS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) return;

    try {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        try {
          const stats = fs.statSync(filePath);
          const age = now - stats.mtimeMs;
          if (age > maxAgeMs) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ Cleaned up old file: ${file}`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to process file ${file}:`, err);
        }
      });
    } catch (err) {
      console.warn(`⚠️ Failed to read directory ${dir}:`, err);
    }
  });
}