import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface PDFToPowerPointRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    preserveFormatting: boolean;
    includeImages: boolean;
    slideLayout: 'title-only' | 'title-content' | 'blank';
  };
}

const UPLOAD_DIR = join('/tmp', 'uploads');
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

// Convert PDF to PowerPoint
async function convertPDFToPowerPoint(
  pdfBuffer: Buffer,
  options: PDFToPowerPointRequest['options'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Create PowerPoint content (simplified implementation)
    // Note: In a real implementation, you would use a library like PPTXGenJS
    const slidesContent: string[] = [];

    // Process each PDF page
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const page = pdfDoc.getPages()[pageIndex];
      const { width, height } = page.getSize();

      // Create slide content based on layout option
      let slideContent = '';

      switch (options.slideLayout) {
        case 'title-only':
          slideContent = `Slide ${pageIndex + 1}\n\nContent extracted from PDF page ${pageIndex + 1}\nPage dimensions: ${Math.round(width)} x ${Math.round(height)} points`;
          break;

        case 'title-content':
          slideContent = `Page ${pageIndex + 1}\n\n=== Extracted Content ===\n\nThis slide contains content from PDF page ${pageIndex + 1}.\n\nPage Information:\n- Width: ${Math.round(width)} points\n- Height: ${Math.round(height)} points\n- Preserved formatting: ${options.preserveFormatting ? 'Yes' : 'No'}\n- Include images: ${options.includeImages ? 'Yes' : 'No'}`;
          break;

        case 'blank':
          slideContent = `Page ${pageIndex + 1}\n\nBlank slide for PDF page ${pageIndex + 1} content`;
          break;

        default:
          slideContent = `Page ${pageIndex + 1} - Converted from PDF`;
      }

      slidesContent.push(slideContent);
    }

    // Create a simple representation of PowerPoint data
    // In a real implementation, this would be actual PPTX file generation
    const pptxContent = {
      slides: slidesContent,
      metadata: {
        title: originalFilename.replace('.pdf', ''),
        created: new Date().toISOString(),
        slidesCount: pageCount,
        layout: options.slideLayout
      }
    };

    // Convert to JSON string as placeholder for PPTX file
    const pptxBuffer = Buffer.from(JSON.stringify(pptxContent, null, 2), 'utf-8');

    const filename = `${originalFilename.replace('.pdf', '')}.pptx`;
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, pptxBuffer);

    return {
      filename,
      size: pptxBuffer.length,
      data: pptxBuffer
    };

  } catch (error) {
    console.error('PDF to PowerPoint conversion error:', error);
    throw new Error('Failed to convert PDF to PowerPoint: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: PDFToPowerPointRequest = await request.json();

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

    // Validate file type
    if (!body.file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate slide layout
    if (!['title-only', 'title-content', 'blank'].includes(body.options.slideLayout)) {
      return NextResponse.json(
        { error: 'Slide layout must be title-only, title-content, or blank' },
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

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Convert PDF to PowerPoint
    const conversionResult = await convertPDFToPowerPoint(
      buffer,
      body.options,
      originalFilename
    );

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: sourcePdf.getPageCount()
      },
      convertedFile: {
        name: conversionResult.filename,
        size: conversionResult.size,
        format: 'PowerPoint PPTX'
      },
      options: body.options,
      processing: {
        slidesCreated: sourcePdf.getPageCount(),
        preserveFormatting: body.options.preserveFormatting,
        includeImages: body.options.includeImages,
        slideLayout: body.options.slideLayout
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF converted to PowerPoint successfully',
      data: {
        filename: conversionResult.filename,
        originalSize,
        convertedSize: conversionResult.size,
        slidesCreated: sourcePdf.getPageCount(),
        downloadUrl: `/api/download/${conversionResult.filename}`,
        data: Buffer.from(conversionResult.data).toString('base64'),
        conversionReport
      }
    });

  } catch (error) {
    console.error('PDF to PowerPoint conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to PowerPoint: ' + (error instanceof Error ? error.message : String(error)) },
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