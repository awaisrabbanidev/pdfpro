import fs from "fs";
import path from "path";

export const UPLOADS_DIR = "/tmp/uploads";
export const OUTPUTS_DIR = "/tmp/outputs";

// Put this near top of every server/API file (Node/Next.js):
export function ensureTempDirs() {
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(OUTPUTS_DIR)) fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
}

// Call this at the top of every route
ensureTempDirs();