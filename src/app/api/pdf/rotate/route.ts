import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, degrees } from 'pdf-lib';

interface RotatePDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  rotation: {
    angle: 90 | 180 | 270;
    pages: 'all' | number[];
  };
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

async function rotatePDF(
  pdfBuffer: Buffer,
  rotation: RotatePDFRequest['rotation'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const sourcePdf = await PDFDocument.load(pdfBuffer);
    const rotatedPdf = await PDFDocument.create();

    // Determine which pages to rotate
    const totalPages = sourcePdf.getPageCount();
    let pagesToRotate: number[] = [];

    if (rotation.pages === 'all') {
      pagesToRotate = Array.from({ length: totalPages }, (_, i) => i);
    } else {
      pagesToRotate = rotation.pages.map(pageNum => pageNum - 1).filter(n => n >= 0 && n < totalPages);
    }

    // Copy and rotate pages
    for (let i = 0; i < totalPages; i++) {
      const [sourcePage] = await rotatedPdf.copyPages(sourcePdf, [i]);

      // Rotate the page if it's in the rotation list
      if (pagesToRotate.includes(i)) {
        sourcePage.setRotation(degrees(rotation.angle));
      }
    }

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_rotated.pdf`;
    rotatedPdf.setTitle(filename.replace('.pdf', ''));
    rotatedPdf.setSubject('PDF rotated by PDFPro.pro');
    rotatedPdf.setProducer('PDFPro.pro');
    rotatedPdf.setCreator('PDFPro.pro');
    rotatedPdf.setCreationDate(new Date());
    rotatedPdf.setModificationDate(new Date());

    const pdfBytes = await rotatedPdf.save();
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PDF rotation error:', error);
    throw new Error('Failed to rotate PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: RotatePDFRequest = await request.json();

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

    if (!body.rotation || ![90, 180, 270].includes(body.rotation.angle)) {
      return NextResponse.json(
        { error: 'Invalid rotation angle. Must be 90, 180, or 270 degrees' },
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

    // Rotate the PDF
    const rotationResult = await rotatePDF(buffer, body.rotation, originalFilename);

    // Count pages to rotate
    let pagesRotated: number;
    if (body.rotation.pages === 'all') {
      const pdfDoc = await PDFDocument.load(buffer);
      pagesRotated = pdfDoc.getPageCount();
    } else {
      pagesRotated = body.rotation.pages.length;
    }

    return NextResponse.json({
      success: true,
      message: 'PDF rotated successfully',
      data: {
        filename: rotationResult.filename,
        originalSize,
        rotatedSize: rotationResult.size,
        rotationAngle: body.rotation.angle,
        pagesRotated,
        downloadUrl: `${baseUrl}/api/download/${rotationResult.filename}`,
        data: Buffer.from(rotationResult.data).toString('base64')
      }
    });

  } catch (error) {
    console.error('PDF rotation error:', error);
    return NextResponse.json(
      { error: 'Failed to rotate PDF' },
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