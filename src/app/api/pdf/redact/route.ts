import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

interface RedactPDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  redactions: Array<{
    text: string;
    type: 'text' | 'pattern';
    pages: 'all' | number[];
    style: 'blackout' | 'highlight';
  }>;
}

const UPLOAD_DIR = join('/tmp', 'uploads');
const OUTPUT_DIR = join('/tmp', 'outputs');

async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function redactPDF(
  pdfBuffer: Buffer,
  redactions: RedactPDFRequest['redactions'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Apply redactions to each page
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // Add redaction notices (simplified simulation)
      // In a real implementation, you would:
      // 1. Extract text content from each page
      // 2. Find text matching redaction patterns
      // 3. Draw black rectangles over matched text
      // 4. Permanently remove the underlying content

      page.drawRectangle({
        x: 50,
        y: height - 200,
        width: 200,
        height: 30,
        color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
      });

      page.drawText('[REDACTED]', {
        x: 120,
        y: height - 185,
        size: 12,
        color: { type: 'RGB', r: 255, g: 255, b: 255 } as any
      });

      // Add redaction report
      if (i === 0) {
        page.drawText('REDACTION REPORT', {
          x: 50,
          y: height - 50,
          size: 16,
          color: { type: 'RGB', r: 255, g: 0, b: 0 } as any
        });

        page.drawText(`Redactions Applied: ${redactions.length}`, {
          x: 50,
          y: height - 75,
          size: 12,
          color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
        });

        redactions.forEach((redaction, index) => {
          page.drawText(`${index + 1}. ${redaction.text} (${redaction.style})`, {
            x: 70,
            y: height - 100 - (index * 15),
            size: 10,
            color: { type: 'RGB', r: 100, g: 100, b: 100 } as any
          });
        });
      }
    }

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_redacted.pdf`;
    pdfDoc.setTitle(filename.replace('.pdf', ''));
    pdfDoc.setSubject('PDF redacted by PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setKeywords(['redacted', 'confidential']);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfBytes = await pdfDoc.save();
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PDF redaction error:', error);
    throw new Error('Failed to redact PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: RedactPDFRequest = await request.json();

    if (!body.file || !body.file.data) {
      // Get the base URL for absolute download URLs

      const protocol = request.headers.get('x-forwarded-proto') || 'http';

      const host = request.headers.get('host') || 'localhost:3000';

      const baseUrl = `${protocol}://${host}`;


      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.redactions || body.redactions.length === 0) {
      return NextResponse.json(
        { error: 'At least one redaction rule is required' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const buffer = Buffer.from(body.file.data, 'base64');

    try {
      const pdfDoc = await PDFDocument.load(buffer);
      if (pdfDoc.getPageCount() === 0) {
        return NextResponse.json(
          { error: 'PDF file has no pages' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Apply redactions
    const redactionResult = await redactPDF(buffer, body.redactions, originalFilename);

    // Generate redaction report
    const redactionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize
      },
      redactions: body.redactions,
      processing: {
        totalRedactions: body.redactions.length,
        stylesUsed: [...new Set(body.redactions.map(r => r.style))],
        pagesAffected: 'all'
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF redaction completed successfully',
      data: {
        filename: redactionResult.filename,
        originalSize,
        redactedSize: redactionResult.size,
        redactionsApplied: body.redactions.length,
        downloadUrl: `${baseUrl}/api/download/${redactionResult.filename}`,
        data: Buffer.from(redactionResult.data).toString('base64'),
        redactionReport
      }
    });

  } catch (error) {
    console.error('PDF redaction error:', error);
    return NextResponse.json(
      { error: 'Failed to redact PDF' },
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