import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, rgb } from 'pdf-lib';

interface PageNumbersRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    position: 'bottom-left' | 'bottom-center' | 'bottom-right' | 'top-left' | 'top-center' | 'top-right';
    format: '1' | '1 of N' | 'Page 1' | 'Page 1 of N';
    startNumber: number;
    fontSize: number;
    color: string;
    margin: number;
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

async function addPageNumbers(
  pdfBuffer: Buffer,
  options: PageNumbersRequest['options'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Parse color
    let color = rgb(0, 0, 0);
    if (options.color) {
      const hex = options.color.replace('#', '');
      color = rgb(
        parseInt(hex.substring(0, 2), 16) / 255,
        parseInt(hex.substring(2, 4), 16) / 255,
        parseInt(hex.substring(4, 6), 16) / 255
      );
    }

    // Add page numbers to each page
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      // Calculate position
      let x, y;
      const margin = options.margin || 20;
      const fontSize = options.fontSize || 10;

      switch (options.position) {
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'bottom-center':
          x = width / 2;
          y = margin;
          break;
        case 'bottom-right':
          x = width - margin;
          y = margin;
          break;
        case 'top-left':
          x = margin;
          y = height - margin;
          break;
        case 'top-center':
          x = width / 2;
          y = height - margin;
          break;
        case 'top-right':
          x = width - margin;
          y = height - margin;
          break;
      }

      // Format page number text
      const pageNumber = options.startNumber + i;
      let pageText: string;

      switch (options.format) {
        case '1':
          pageText = pageNumber.toString();
          break;
        case '1 of N':
          pageText = `${pageNumber} of ${pageCount}`;
          break;
        case 'Page 1':
          pageText = `Page ${pageNumber}`;
          break;
        case 'Page 1 of N':
          pageText = `Page ${pageNumber} of ${pageCount}`;
          break;
      }

      // Adjust x position based on alignment
      let adjustedX = x;
      if (options.position.includes('center')) {
        // Approximate center alignment by adjusting x position
        adjustedX = x - (pageText.length * fontSize * 0.3); // Rough approximation
      } else if (options.position.includes('right')) {
        // Approximate right alignment
        adjustedX = x - (pageText.length * fontSize * 0.6); // Rough approximation
      }

      // Draw page number
      page.drawText(pageText, {
        x: adjustedX,
        y,
        size: fontSize,
        color
      });
    }

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_with_page_numbers.pdf`;
    pdfDoc.setTitle(filename.replace('.pdf', ''));
    pdfDoc.setSubject('PDF with page numbers by PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setKeywords(['page-numbers', 'numbered']);
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
    console.error('Page numbers error:', error);
    throw new Error('Failed to add page numbers to PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: PageNumbersRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.options) {
      return NextResponse.json(
        { error: 'Page number options are required' },
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

    // Add page numbers
    const pageNumbersResult = await addPageNumbers(buffer, body.options, originalFilename);

    return NextResponse.json({
      success: true,
      message: 'Page numbers added successfully',
      data: {
        filename: pageNumbersResult.filename,
        originalSize,
        modifiedSize: pageNumbersResult.size,
        totalPages: Math.ceil(originalSize / 50000),
        format: body.options.format,
        position: body.options.position,
        downloadUrl: `${baseUrl}/api/download/${pageNumbersResult.filename}`,
        data: Buffer.from(pageNumbersResult.data).toString('base64')
      }
    });

  } catch (error) {
    console.error('Page numbers error:', error);
    return NextResponse.json(
      { error: 'Failed to add page numbers to PDF' },
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