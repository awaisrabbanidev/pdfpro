import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFPage } from 'pdf-lib';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface SplitRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  splitType: 'single' | 'range' | 'every';
  splitOption?: {
    pages?: number[]; // For single/range
    every?: number; // For every N pages
    range?: string; // Range string like "1-5,8,10-12"
  };
}

const UPLOAD_DIR = join('/tmp', 'uploads');
const OUTPUT_DIR = join('/tmp', 'outputs');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Parse range string like "1-5,8,10-12" into array of page numbers
function parseRangeString(range: string): number[] {
  const pages: number[] = [];
  const parts = range.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
    } else {
      const page = parseInt(trimmed);
      if (!isNaN(page)) {
        pages.push(page);
      }
    }
  }

  return [...new Set(pages)]; // Remove duplicates
}

// Create a PDF from specific pages
async function createPdfFromPages(
  sourcePdf: PDFDocument,
  pageIndices: number[],
  baseName: string,
  suffix: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach(page => newPdf.addPage(page));

  // Add metadata
  newPdf.setTitle(`${baseName} - ${suffix}`);
  newPdf.setSubject('PDF created by PDFPro.pro Split Tool');
  newPdf.setProducer('PDFPro.pro');
  newPdf.setCreator('PDFPro.pro');

  const pdfBytes = await newPdf.save();
  const filename = `${baseName}_${suffix}.pdf`;

  // Save to file
  const outputPath = join(OUTPUT_DIR, filename);
  await writeFile(outputPath, pdfBytes);

  return {
    filename,
    size: pdfBytes.length,
    data: Buffer.from(pdfBytes)
  };
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: SplitRequest = await request.json();

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

    if (!body.splitType) {
      return NextResponse.json(
        { error: 'Split type is required' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const buffer = Buffer.from(body.file.data, 'base64');
    let sourcePdf: PDFDocument;

    try {
      sourcePdf = await PDFDocument.load(buffer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const totalPages = sourcePdf.getPageCount();
    const baseName = body.file.name.replace('.pdf', '');

    if (totalPages === 0) {
      return NextResponse.json(
        { error: 'PDF file has no pages' },
        { status: 400 }
      );
    }

    const results: Array<{
      filename: string;
      size: number;
      pages: number;
      data: string;
      downloadUrl: string;
    }> = [];

    switch (body.splitType) {
      case 'single': {
        // Split into individual pages
        for (let i = 0; i < totalPages; i++) {
          const result = await createPdfFromPages(
            sourcePdf,
            [i],
            baseName,
            `page_${i + 1}`
          );

          results.push({
            filename: result.filename,
            size: result.size,
            pages: 1,
            data: Buffer.from(result.data).toString('base64'),
            downloadUrl: `${baseUrl}/api/download/${result.filename}`
          });
        }
        break;
      }

      case 'range': {
        if (!body.splitOption?.pages && !body.splitOption?.range) {
          return NextResponse.json(
            { error: 'Page selection is required for range split' },
            { status: 400 }
          );
        }

        let pageIndices: number[];

        if (body.splitOption.range) {
          pageIndices = parseRangeString(body.splitOption.range);
        } else if (body.splitOption.pages) {
          pageIndices = body.splitOption.pages.map(p => p - 1); // Convert to 0-based index
        } else {
          return NextResponse.json(
            { error: 'Invalid page selection' },
            { status: 400 }
          );
        }

        // Validate page indices
        const validIndices = pageIndices.filter(index =>
          index >= 0 && index < totalPages
        );

        if (validIndices.length === 0) {
          return NextResponse.json(
            { error: 'No valid pages selected' },
            { status: 400 }
          );
        }

        const result = await createPdfFromPages(
          sourcePdf,
          validIndices,
          baseName,
          'selected_pages'
        );

        results.push({
          filename: result.filename,
          size: result.size,
          pages: validIndices.length,
          data: Buffer.from(result.data).toString('base64'),
          downloadUrl: `${baseUrl}/api/download/${result.filename}`
        });
        break;
      }

      case 'every': {
        const every = body.splitOption?.every || 1;

        if (every < 1 || every > totalPages) {
          return NextResponse.json(
            { error: `Invalid "every" value: ${every}` },
            { status: 400 }
          );
        }

        // Split into chunks of N pages
        for (let i = 0; i < totalPages; i += every) {
          const endIndex = Math.min(i + every, totalPages);
          const pageIndices = [];

          for (let j = i; j < endIndex; j++) {
            pageIndices.push(j);
          }

          const startPage = i + 1;
          const endPage = endIndex;
          const suffix = `pages_${startPage}-${endPage}`;

          const result = await createPdfFromPages(
            sourcePdf,
            pageIndices,
            baseName,
            suffix
          );

          results.push({
            filename: result.filename,
            size: result.size,
            pages: pageIndices.length,
            data: Buffer.from(result.data).toString('base64'),
            downloadUrl: `${baseUrl}/api/download/${result.filename}`
          });
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid split type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'PDF split successfully',
      data: {
        originalPages: totalPages,
        filesCreated: results.length,
        files: results
      }
    });

  } catch (error) {
    console.error('PDF split error:', error);
    return NextResponse.json(
      { error: 'Failed to split PDF file' },
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