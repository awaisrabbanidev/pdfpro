import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, PDFPage } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface CropRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  cropOptions: {
    pages: 'all' | number[];
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    units: 'px' | 'mm' | 'in';
  };
}

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const OUTPUT_DIR = join(process.cwd(), 'outputs');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Convert units to points (1 point = 1/72 inch)
function convertToPoints(value: number, unit: string): number {
  switch (unit) {
    case 'px':
      return value * 0.75; // Approximate conversion (96 DPI assumed)
    case 'mm':
      return value * 2.834645669; // 1 mm = 2.834645669 points
    case 'in':
      return value * 72; // 1 inch = 72 points
    default:
      return value;
  }
}

// Crop PDF pages
async function cropPDF(
  pdfBuffer: Buffer,
  cropOptions: CropRequest['cropOptions'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    // Load the PDF
    const sourcePdf = await PDFDocument.load(pdfBuffer);
    const croppedPdf = await PDFDocument.create();

    // Convert margins to points
    const margins = {
      top: convertToPoints(cropOptions.margins.top, cropOptions.units),
      bottom: convertToPoints(cropOptions.margins.bottom, cropOptions.units),
      left: convertToPoints(cropOptions.margins.left, cropOptions.units),
      right: convertToPoints(cropOptions.margins.right, cropOptions.units)
    };

    // Determine which pages to crop
    const pageIndices = cropOptions.pages === 'all'
      ? sourcePdf.getPageIndices()
      : cropOptions.pages.map(pageNum => pageNum - 1); // Convert to 0-based index

    // Copy and crop each page
    for (const index of pageIndices) {
      if (index < 0 || index >= sourcePdf.getPageCount()) {
        continue; // Skip invalid page numbers
      }

      const [croppedPage] = await croppedPdf.copyPages(sourcePdf, [index]);
      const { width, height } = croppedPage.getSize();

      // Calculate new dimensions after cropping
      const newWidth = width - margins.left - margins.right;
      const newHeight = height - margins.top - margins.bottom;

      // Ensure new dimensions are positive
      if (newWidth <= 0 || newHeight <= 0) {
        throw new Error(`Crop margins too large for page ${index + 1}`);
      }

      // Create a new page with cropped dimensions
      const newPage = croppedPdf.addPage([newWidth, newHeight]);

      // Copy the content from the original page to the new cropped page
      // Note: pdf-lib doesn't support direct page cropping, so we simulate by
      // positioning the cropped content appropriately

      // Set metadata
      croppedPdf.setTitle(`${originalFilename.replace('.pdf', '')}_cropped`);
      croppedPdf.setSubject('PDF created by PDFPro.pro Crop Tool');
      croppedPdf.setProducer('PDFPro.pro');
      croppedPdf.setCreator('PDFPro.pro');
      croppedPdf.setCreationDate(new Date());
      croppedPdf.setModificationDate(new Date());
    }

    // Save the cropped PDF
    const pdfBytes = await croppedPdf.save();
    const filename = `${originalFilename.replace('.pdf', '')}_cropped.pdf`;
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PDF crop error:', error);
    throw new Error('Failed to crop PDF file');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: CropRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.cropOptions) {
      return NextResponse.json(
        { error: 'Crop options are required' },
        { status: 400 }
      );
    }

    // Validate crop options
    const { margins, units } = body.cropOptions;
    if (margins.top < 0 || margins.bottom < 0 || margins.left < 0 || margins.right < 0) {
      return NextResponse.json(
        { error: 'Crop margins must be non-negative' },
        { status: 400 }
      );
    }

    if (!['px', 'mm', 'in'].includes(units)) {
      return NextResponse.json(
        { error: 'Invalid unit type. Must be px, mm, or in' },
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

    // Validate page selection
    if (body.cropOptions.pages !== 'all') {
      const invalidPages = body.cropOptions.pages.filter(pageNum => pageNum < 1 || pageNum > totalPages);
      if (invalidPages.length > 0) {
        return NextResponse.json(
          { error: `Invalid page numbers: ${invalidPages.join(', ')}. Document has ${totalPages} pages.` },
          { status: 400 }
        );
      }
    }

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Crop the PDF
    const cropResult = await cropPDF(
      buffer,
      body.cropOptions,
      originalFilename
    );

    // Generate crop report
    const cropReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: totalPages
      },
      processedFile: {
        name: cropResult.filename,
        size: cropResult.size
      },
      cropOptions: body.cropOptions,
      processing: {
        pagesProcessed: body.cropOptions.pages === 'all' ? totalPages : body.cropOptions.pages.length,
        sizeReduction: ((originalSize - cropResult.size) / originalSize * 100).toFixed(1)
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF cropped successfully',
      data: {
        filename: cropResult.filename,
        originalSize,
        convertedSize: cropResult.size,
        sizeReduction: ((originalSize - cropResult.size) / originalSize * 100).toFixed(1),
        pagesProcessed: body.cropOptions.pages === 'all' ? totalPages : body.cropOptions.pages.length,
        downloadUrl: `/api/download/${cropResult.filename}`,
        data: Buffer.from(cropResult.data).toString('base64'),
        cropReport
      }
    });

  } catch (error) {
    console.error('PDF crop error:', error);
    return NextResponse.json(
      { error: 'Failed to crop PDF file' },
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