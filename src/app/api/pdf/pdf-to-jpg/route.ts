import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, rgb } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface PDFToJPGRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    pageRange: 'all' | string;
    quality: 'high' | 'medium' | 'low';
    format: 'jpg' | 'png';
    dpi: number;
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

// Convert PDF pages to images
async function convertPDFToImages(
  pdfBuffer: Buffer,
  options: PDFToJPGRequest['options'],
  originalFilename: string
): Promise<{ files: Array<{ filename: string; size: number; data: Buffer; page: number }> }> {
  try {
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Parse page range
    let pagesToConvert: number[] = [];
    if (options.pageRange === 'all') {
      pagesToConvert = Array.from({ length: pageCount }, (_, i) => i + 1);
    } else {
      // Parse page range like "1-3,5,7-9"
      const ranges = options.pageRange.split(',');
      for (const range of ranges) {
        const trimmedRange = range.trim();
        if (trimmedRange.includes('-')) {
          const [start, end] = trimmedRange.split('-').map(n => parseInt(n.trim()));
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= pageCount) pagesToConvert.push(i);
          }
        } else {
          const page = parseInt(trimmedRange);
          if (page > 0 && page <= pageCount) pagesToConvert.push(page);
        }
      }
    }

    // Convert each page to image (simulated - in real implementation would use canvas or pdf2pic)
    const convertedFiles = [];
    const extension = options.format;

    for (const pageNumber of pagesToConvert) {
      // In a real implementation, you would:
      // 1. Render the PDF page to canvas
      // 2. Convert canvas to image buffer
      // 3. Apply compression and quality settings

      // For simulation, create a simple image file placeholder
      const imageData = createSimulatedImageData(pageNumber, pageCount, options);
      const filename = `${originalFilename.replace('.pdf', '')}_page_${pageNumber}.${extension}`;

      convertedFiles.push({
        filename,
        size: imageData.length,
        data: imageData,
        page: pageNumber
      });
    }

    return { files: convertedFiles };

  } catch (error) {
    console.error('PDF to image conversion error:', error);
    throw new Error('Failed to convert PDF to images');
  }
}

// Create simulated image data (in real implementation would be actual image bytes)
function createSimulatedImageData(pageNumber: number, totalPages: number, options: PDFToJPGRequest['options']): Buffer {
  // This is a placeholder for actual image conversion
  // In a real implementation, you'd use libraries like:
  // - pdf2pic (Node.js)
  // - Canvas API
  // - Sharp for image processing

  const qualitySettings = {
    high: 0.9,
    medium: 0.7,
    low: 0.5
  };

  const quality = qualitySettings[options.quality] || 0.7;
  const estimatedSize = Math.floor(100000 * quality); // Estimated image size

  // Create a simple image header for JPEG/PNG (simulated)
  const imageHeader = options.format === 'jpg'
    ? Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]) // JPEG header
    : Buffer.from([0x89, 0x50, 0x4E, 0x47]); // PNG header

  // Simulated image data
  const imageData = Buffer.alloc(estimatedSize);
  imageHeader.copy(imageData);

  // Add some metadata to the image data
  const metadata = `Page ${pageNumber} of ${totalPages}, Quality: ${options.quality}, DPI: ${options.dpi}`;
  const metadataBuffer = Buffer.from(metadata, 'utf-8');
  metadataBuffer.copy(imageData, imageHeader.length);

  return imageData;
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: PDFToJPGRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.options) {
      return NextResponse.json(
        { error: 'Conversion options are required' },
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

    // Convert PDF to images
    const conversionResult = await convertPDFToImages(
      buffer,
      body.options,
      originalFilename
    );

    // Create ZIP file for multiple images if needed
    const filesToReturn = conversionResult.files.map(file => ({
      ...file,
      url: `/api/download/${file.filename}`,
      base64Data: file.data.toString('base64')
    }));

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize
      },
      options: body.options,
      processing: {
        pagesConverted: conversionResult.files.length,
        format: body.options.format,
        quality: body.options.quality,
        dpi: body.options.dpi,
        totalOutputSize: conversionResult.files.reduce((sum, file) => sum + file.size, 0)
      }
    };

    return NextResponse.json({
      success: true,
      message: `PDF converted to ${body.options.format.toUpperCase()} successfully`,
      data: {
        files: filesToReturn,
        pagesConverted: conversionResult.files.length,
        totalFiles: conversionResult.files.length,
        downloadUrl: conversionResult.files.length === 1
          ? `/api/download/${conversionResult.files[0].filename}`
          : null,
        conversionReport
      }
    });

  } catch (error) {
    console.error('PDF to image conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to images' },
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