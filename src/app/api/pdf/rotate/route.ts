import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, degrees } from 'pdf-lib';
import { ensureTempDirs, OUTPUTS_DIR, UPLOADS_DIR } from '@/lib/temp-dirs';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface RotatePDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  rotationOptions: {
    angle: 90 | 180 | 270;
    pages: 'all' | number[];
  };
}

// Ensure directories exist
async function ensureDirectories() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await mkdir(OUTPUTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Rotate PDF pages
async function rotatePDF(
  pdfBuffer: Buffer,
  rotationOptions: RotatePDFRequest['rotationOptions'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const sourcePdf = await PDFDocument.load(pdfBuffer);
    const rotatedPdf = await PDFDocument.create();

    // Determine which pages to rotate
    const pageIndices = rotationOptions.pages === 'all'
      ? sourcePdf.getPageIndices()
      : rotationOptions.pages.map(pageNum => pageNum - 1); // Convert to 0-based index

    // Copy and rotate each page
    for (const index of pageIndices) {
      if (index < 0 || index >= sourcePdf.getPageCount()) {
        continue; // Skip invalid page numbers
      }

      const [originalPage] = await rotatedPdf.copyPages(sourcePdf, [index]);

      // Rotate the page by the specified angle
      originalPage.setRotation(degrees(rotationOptions.angle));

      // Add the rotated page to the new PDF
      rotatedPdf.addPage(originalPage);
    }

    // Set metadata
    const outputName = `${originalFilename.replace('.pdf', '')}_rotated.pdf`;
    rotatedPdf.setTitle(outputName.replace('.pdf', ''));
    rotatedPdf.setSubject('PDF rotated by PDFPro.pro');
    rotatedPdf.setProducer('PDFPro.pro');
    rotatedPdf.setCreator('PDFPro.pro');
    rotatedPdf.setCreationDate(new Date());
    rotatedPdf.setModificationDate(new Date());

    const pdfBytes = await rotatedPdf.save();
    const filename = outputName;
    const outputPath = join(OUTPUTS_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PDF rotation error:', error);
    throw new Error('Failed to rotate PDF file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function POST(request: NextRequest) {
  try {
  ensureTempDirs();
    await ensureDirectories();

    const body: RotatePDFRequest = await request.json();

    if (!formData.get('file') as File || !formData.get('file') as File.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.rotationOptions) {
      return NextResponse.json(
        { error: 'Rotation options are required' },
        { status: 400 }
      );
    }

    // Validate rotation angle
    if (![90, 180, 270].includes(body.rotationOptions.angle)) {
      return NextResponse.json(
        { error: 'Rotation angle must be 90, 180, or 270 degrees' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!formData.get('file') as File.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const buffer = Buffer.from(formData.get('file') as File.data, 'base64');
    let sourcePdf: PDFDocument;

    try {
  ensureTempDirs();
      sourcePdf = await PDFDocument.load(buffer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const totalPages = sourcePdf.getPageCount();

    // Validate page selection
    if (body.rotationOptions.pages !== 'all') {
      const invalidPages = body.rotationOptions.pages.filter(pageNum => pageNum < 1 || pageNum > totalPages);
      if (invalidPages.length > 0) {
        return NextResponse.json(
          { error: `Invalid page numbers: ${invalidPages.join(', ')}. Document has ${totalPages} pages.` },
          { status: 400 }
        );
      }
    }

    const originalSize = buffer.length;
    const originalFilename = formData.get('file') as File.name;

    // Rotate the PDF
    const rotationResult = await rotatePDF(
      buffer,
      body.rotationOptions,
      originalFilename
    );

    // Generate rotation report
    const rotationReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: totalPages
      },
      rotatedFile: {
        name: rotationResult.filename,
        size: rotationResult.size
      },
      rotationOptions: body.rotationOptions,
      processing: {
        pagesRotated: body.rotationOptions.pages === 'all' ? totalPages : body.rotationOptions.pages.length,
        rotationAngle: body.rotationOptions.angle
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF rotated successfully',
      data: {
        filename: rotationResult.filename,
        originalSize,
        rotatedSize: rotationResult.size,
        pagesRotated: body.rotationOptions.pages === 'all' ? totalPages : body.rotationOptions.pages.length,
        rotationAngle: body.rotationOptions.angle,
        downloadUrl: `/api/download/${rotationResult.filename}`,
        data: Buffer.from(rotationResult.data).toString('base64'),
        rotationReport
      }
    });

  } catch (error) {
    console.error('PDF rotation error:', error);
    return NextResponse.json(
      { error: 'Failed to rotate PDF file: ' + (error instanceof Error ? error.message : String(error)) },
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