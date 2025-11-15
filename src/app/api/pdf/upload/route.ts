// app/api/pdf/upload/route.ts
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";
import { ensureTempDirs, UPLOADS_DIR } from "@/lib/temp-dirs";
import { NextRequest, NextResponse } from "next/server";

// Next.js App Router: disable body parser
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  // Ensure directories exist before any file operations
  ensureTempDirs();

  const form = new IncomingForm({ uploadDir: UPLOADS_DIR, keepExtensions: true });

  return new Promise((resolve) => {
    form.parse(req as any, (err, fields, files) => {
      if (err) {
        console.error("form.parse error:", err);
        return resolve(NextResponse.json(
          { error: "upload_parse_error", detail: err.message },
          { status: 500 }
        ));
      }
      // files might be files.file or files.upload, inspect object
      // return saved file paths so caller can call conversion API
      const savedFiles = Object.values(files)
        .flat()
        .map((f) => {
          if (!f) return null;
          return {
            filepath: (f as any).filepath || (f as any).path, // formidable v2 uses filepath
            originalFilename: (f as any).originalFilename || (f as any).name || null,
            size: (f as any).size || null,
          };
        })
        .filter(Boolean); // Remove null values

      return resolve(NextResponse.json(
        { ok: true, files: savedFiles },
        { status: 200 }
      ));
    });
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}