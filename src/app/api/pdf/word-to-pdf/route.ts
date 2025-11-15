import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { ensureTempDirs, OUTPUTS_DIR, UPLOADS_DIR } from '@/lib/temp-dirs';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface ConvertRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    preserveFormatting: boolean;
    pageSize: 'A4' | 'Letter' | 'Legal';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
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

// Get page dimensions
function getPageDimensions(pageSize: string) {
  switch (pageSize) {
    case 'Letter':
      return { width: 612, height: 792 }; // 8.5 x 11 inches in points
    case 'Legal':
      return { width: 612, height: 1008 }; // 8.5 x 14 inches in points
    case 'A4':
    default:
      return { width: 595, height: 842 }; // A4 in points
  }
}

// Convert Word document to PDF
async function convertWordToPDF(
  docxBuffer: Buffer,
  options: any,
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    // Extract content from Word document using mammoth
    const result = await mammoth.convertToHtml({ buffer: docxBuffer });
    const htmlContent = result.value;

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const { width, height } = getPageDimensions(options.pageSize);

    // Convert HTML to PDF pages
    const paragraphs = htmlContent.split(/<\/?p>/).filter(p => p.trim());
    const margins = options.margins;
    const pageWidth = width - margins.left - margins.right;
    const pageHeight = height - margins.top - margins.bottom;

    let currentY = pageHeight - 50; // Start from top of page
    let currentPage = pdfDoc.addPage([width, height]);

    const fontSize = 12;
    const lineHeight = fontSize * 1.5;

    // Basic text extraction and PDF creation
    for (const paragraph of paragraphs) {
      // Clean HTML tags and get plain text
      const text = paragraph
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

      if (!text) continue;

      // Simple word wrapping
      const words = text.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;

        // Simple width estimation (in production, use proper font metrics)
        const estimatedLineWidth = testLine.length * fontSize * 0.6;

        if (estimatedLineWidth > pageWidth && currentLine) {
          // Draw current line
          currentPage.drawText(currentLine, {
            x: margins.left,
            y: currentY,
            size: fontSize,
            color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
          });

          currentY -= lineHeight;
          currentLine = word;

          // Check if we need a new page
          if (currentY < margins.bottom + lineHeight) {
            currentPage = pdfDoc.addPage([width, height]);
            currentY = pageHeight - 50;
          }
        } else {
          currentLine = testLine;
        }
      }

      // Draw remaining text for this paragraph
      if (currentLine) {
        currentPage.drawText(currentLine, {
          x: margins.left,
          y: currentY,
          size: fontSize,
          color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
        });

        currentY -= lineHeight * 1.5; // Extra space between paragraphs

        // Check if we need a new page
        if (currentY < margins.bottom + lineHeight * 1.5) {
          currentPage = pdfDoc.addPage([width, height]);
          currentY = pageHeight - 50;
        }
      }
    }

    // Set metadata
    const outputName = `${originalFilename.replace(/\.(docx?|rtf)$/i, '')}.pdf`;
    pdfDoc.setTitle(outputName.replace('.pdf', ''));
    pdfDoc.setSubject('PDF created by PDFPro.pro Word to PDF Converter');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Save to file
    const outputPath = join(OUTPUT_DIR, outputName);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename: outputName,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('Word to PDF conversion error:', error);
    throw new Error('Failed to convert Word document to PDF');
  }
}

export async function POST(request: NextRequest) {
  ensureTempDirs();
  await ensureDirectories();

  try {
    const contentType = request.headers.get('content-type');
    let buffer: Buffer;
    let originalFilename: string;
    let options: ConvertRequest['options'];

    if (contentType?.includes('application/json')) {
      const body: ConvertRequest = await request.json();

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
      const filename = body.file.name.toLowerCase();
      if (!filename.endsWith('.docx') && !filename.endsWith('.doc') && !filename.endsWith('.rtf')) {
        return NextResponse.json(
          { error: 'Only Word documents (.docx, .doc) and RTF files are supported' },
          { status: 400 }
        );
      }

      buffer = Buffer.from(body.file.data, 'base64');
      originalFilename = body.file.name;
      options = body.options;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const pageSize = formData.get('pageSize') as string || 'A4';
      const preserveFormatting = formData.get('preserveFormatting') as string === 'true';

      if (!file) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      // Validate file type
      const filename = file.name.toLowerCase();
      if (!filename.endsWith('.docx') && !filename.endsWith('.doc') && !filename.endsWith('.rtf')) {
        return NextResponse.json(
          { error: 'Only Word documents (.docx, .doc) and RTF files are supported' },
          { status: 400 }
        );
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalFilename = file.name;
      options = {
        preserveFormatting,
        pageSize: pageSize as 'A4' | 'Letter' | 'Legal',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        }
      };
    }

    const originalSize = buffer.length;

    // Validate document can be read
    try {
      const result = await mammoth.extractRawText({ buffer: buffer });
      if (!result.value || result.value.trim().length === 0) {
        return NextResponse.json(
          { error: 'Document contains no readable text' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or corrupted Word document' },
        { status: 400 }
      );
    }

    // Convert to PDF
    const pdfResult = await convertWordToPDF(
      buffer,
      options,
      originalFilename
    );

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        type: originalFilename.toLowerCase().endsWith('.docx') ? 'DOCX' : originalFilename.toLowerCase().endsWith('.doc') ? 'DOC' : 'RTF'
      },
      convertedFile: {
        name: pdfResult.filename,
        size: pdfResult.size
      },
      options,
      conversion: {
        preserveFormatting: options.preserveFormatting,
        pageSize: options.pageSize,
        compressionRatio: ((originalSize - pdfResult.size) / originalSize * 100).toFixed(1)
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Word document converted to PDF successfully',
      filename: pdfResult.filename,
      originalSize,
      convertedSize: pdfResult.size,
      compressionRatio: ((originalSize - pdfResult.size) / originalSize * 100).toFixed(1),
      downloadUrl: `/api/download/${pdfResult.filename}`,
      data: Buffer.from(pdfResult.data).toString('base64'),
      conversionReport
    });

  } catch (error) {
    console.error('Word to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert Word document to PDF' },
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