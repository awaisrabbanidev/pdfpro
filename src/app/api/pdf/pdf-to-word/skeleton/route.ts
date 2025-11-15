// app/api/pdf/pdf-to-word/route.ts
import fs from "fs";
import path from "path";
import { safeJsonParse } from "@/lib/safe-json-parse";
import { ensureTempDirs, OUTPUTS_DIR } from "@/lib/temp-dirs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  ensureTempDirs();

  try {
    const body = await req.json().catch(() => null); // only parse if content-type JSON
    // if client is not POSTing JSON but form-data, use the upload route to get file path
    // e.g., client POSTs { filepath: "/tmp/uploads/....pdf" }
    const { filepath } = body || {};

    if (!filepath || !fs.existsSync(filepath)) {
      console.error("Missing or non-existing filepath:", filepath);
      return new Response(JSON.stringify({ error: "missing_file" }), { status: 400 });
    }

    const outputFilename = `word-${Date.now()}.docx`;
    const outputPath = path.join(OUTPUTS_DIR, outputFilename);

    // === CALL YOUR PDF->WORD CONVERSION LIBRARY HERE ===
    // IMPORTANT: If you call an external CLI and parse its stdout, DO NOT JSON.parse unless it emits JSON.
    // Example: child_process.exec(...) -> stdout might be plain text. Log it and write files accordingly.

    // Dummy placeholder: copy the file to outputs to simulate processing
    fs.copyFileSync(filepath, outputPath);

    // Return a link or path
    return new Response(JSON.stringify({ ok: true, outputPath }), { status: 200 });
  } catch (err) {
    console.error("PDF to Word conversion error:", err);
    return new Response(JSON.stringify({ error: "conversion_error", detail: err.message }), { status: 500 });
  }
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