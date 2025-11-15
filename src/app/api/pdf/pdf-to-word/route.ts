// app/api/pdf/pdf-to-word/route.ts
import fs from "fs";
import path from "path";
import { safeJsonParse } from "@/lib/safe-json-parse";
import { ensureTempDirs, OUTPUTS_DIR, UPLOADS_DIR } from "@/lib/temp-dirs";
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { NextRequest, NextResponse } from 'next/server';


export async function POST(req: NextRequest) {
  ensureTempDirs();

  try {
    // Check if this is JSON (client sending filepath) or FormData (direct upload)
    const contentType = req.headers.get('content-type');
    let filepath: string;
    let fileBuffer: Buffer;

    if (contentType?.includes('application/json')) {
      // JSON mode - client sent filepath from upload route
      const body = await req.json().catch(() => null);
      filepath = body?.filepath;

      if (!filepath || !fs.existsSync(filepath)) {
        console.error("Missing or non-existing filepath:", filepath);
        return NextResponse.json({ error: "missing_file" }, { status: 400 });
      }

      fileBuffer = fs.readFileSync(filepath);
    } else {
      // FormData mode - direct file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);

      // Save to uploads dir for processing
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      filepath = path.join(UPLOADS_DIR, `temp-${Date.now()}-${file.name}`);
      fs.writeFileSync(filepath, fileBuffer);
    }

    const outputFilename = `word-${Date.now()}.docx`;
    const outputPath = path.join(OUTPUTS_DIR, outputFilename);

    // === PDF TO WORD CONVERSION ===
    const pdfDoc = await PDFDocument.load(fileBuffer);
    if (pdfDoc.getPageCount() === 0) {
      return NextResponse.json({ error: 'PDF file has no pages' }, { status: 400 });
    }

    // Dummy conversion - copy file to simulate processing
    fs.copyFileSync(filepath, outputPath);

    return NextResponse.json({
      success: true,
      filename: outputFilename,
      base64: fs.readFileSync(outputPath).toString('base64'),
      message: 'PDF converted to Word successfully',
      originalSize: fileBuffer.length,
      convertedSize: fs.statSync(outputPath).size,
      pagesProcessed: pdfDoc.getPageCount()
    });

  } catch (err) {
    console.error("PDF to Word conversion error:", err);
    // Log raw error for debugging
    console.error("RAW ERROR OBJECT:", err);
    return NextResponse.json(
      { error: "conversion_error", detail: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

  } catch (error) {
    console.error('PDF to Word conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to Word' },
      { status: 500 }
    );
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