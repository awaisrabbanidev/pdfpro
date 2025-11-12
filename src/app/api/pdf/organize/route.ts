import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

interface OrganizePDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  operations: Array<{
    type: 'move' | 'delete' | 'insert' | 'rotate';
    sourcePage?: number;
    targetPage?: number;
    rotation?: number;
    content?: string;
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

async function organizePDF(
  pdfBuffer: Buffer,
  operations: OrganizePDFRequest['operations'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const sourcePdf = await PDFDocument.load(pdfBuffer);
    const pageCount = sourcePdf.getPageCount();
    const organizedPdf = await PDFDocument.create();

    // Apply operations in order
    let pages = Array.from({ length: pageCount }, (_, i) => i);

    operations.forEach(op => {
      switch (op.type) {
        case 'move':
          if (op.sourcePage !== undefined && op.targetPage !== undefined) {
            const sourceIdx = op.sourcePage - 1;
            const targetIdx = op.targetPage - 1;
            if (sourceIdx >= 0 && sourceIdx < pages.length) {
              const page = pages.splice(sourceIdx, 1)[0];
              pages.splice(targetIdx, 0, page);
            }
          }
          break;
        case 'delete':
          if (op.sourcePage !== undefined) {
            const idx = op.sourcePage - 1;
            if (idx >= 0 && idx < pages.length) {
              pages.splice(idx, 1);
            }
          }
          break;
      }
    });

    // Copy pages in the new order
    for (const pageIndex of pages) {
      if (pageIndex >= 0 && pageIndex < pageCount) {
        const [page] = await organizedPdf.copyPages(sourcePdf, [pageIndex]);
        organizedPdf.addPage(page);
      }
    }

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_organized.pdf`;
    organizedPdf.setTitle(filename.replace('.pdf', ''));
    organizedPdf.setSubject('PDF organized by PDFPro.pro');
    organizedPdf.setProducer('PDFPro.pro');
    organizedPdf.setCreator('PDFPro.pro');
    organizedPdf.setKeywords(['organized', 'reordered']);
    organizedPdf.setCreationDate(new Date());
    organizedPdf.setModificationDate(new Date());

    const pdfBytes = await organizedPdf.save();
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PDF organization error:', error);
    throw new Error('Failed to organize PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: OrganizePDFRequest = await request.json();

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

    if (!body.operations || body.operations.length === 0) {
      return NextResponse.json(
        { error: 'At least one organization operation is required' },
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

    // Organize the PDF
    const organizationResult = await organizePDF(buffer, body.operations, originalFilename);

    // Generate organization report
    const organizationReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize
      },
      operations: body.operations,
      processing: {
        totalOperations: body.operations.length,
        operationsByType: body.operations.reduce((acc, op) => {
          acc[op.type] = (acc[op.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF organization completed successfully',
      data: {
        filename: organizationResult.filename,
        originalSize,
        organizedSize: organizationResult.size,
        operationsApplied: body.operations.length,
        downloadUrl: `${baseUrl}/api/download/${organizationResult.filename}`,
        data: Buffer.from(organizationResult.data).toString('base64'),
        organizationReport
      }
    });

  } catch (error) {
    console.error('PDF organization error:', error);
    return NextResponse.json(
      { error: 'Failed to organize PDF' },
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