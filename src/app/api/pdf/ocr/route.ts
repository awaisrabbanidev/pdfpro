export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface OCRRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    language: string;
    outputFormat: 'pdf' | 'txt';
    preserveLayout: boolean;
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

// Simulate OCR processing (in production, you'd use Tesseract.js or similar)
async function performOCR(
  pdfBuffer: Buffer,
  options: OCRRequest['options'],
  originalFilename: string
): Promise<{ filename: string; size: number; extractedText: string; data: Buffer }> {
  try {
    // Load PDF to get page count and basic info
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Simulate OCR text extraction
    // In a real implementation, you would:
    // 1. Convert PDF pages to images
    // 2. Run OCR on each image using Tesseract.js or Google Cloud Vision
    // 3. Combine the extracted text

    let extractedText = '';

    // Simulate extracted text content based on page count
    for (let i = 1; i <= pageCount; i++) {
      extractedText += `--- Page ${i} ---\n`;
      extractedText += `This is simulated OCR text extracted from page ${i} of ${originalFilename}.\n`;
      extractedText += `In a real implementation, this would be the actual text content extracted from the scanned document.\n`;
      extractedText += `The OCR processing would detect characters, words, and paragraphs from the image.\n\n`;
    }

    // Create output based on format
    if (options.outputFormat === 'txt') {
      const outputBuffer = Buffer.from(extractedText, 'utf-8');
      const filename = `${originalFilename.replace('.pdf', '')}_ocr.txt`;
      const outputPath = join(OUTPUT_DIR, filename);
      await writeFile(outputPath, outputBuffer);

      return {
        filename,
        size: outputBuffer.length,
        extractedText,
        data: outputBuffer
      };
    } else {
      // Create a new PDF with the extracted text
      const ocrPdf = await PDFDocument.create();
      const { width, height } = { width: 595, height: 842 }; // A4 size

      // Add text content to PDF
      const lines = extractedText.split('\n');
      let currentY = height - 50;
      const lineHeight = 14;
      const fontSize = 12;
      const margin = 50;

      for (const line of lines) {
        if (currentY < margin) {
          // Add new page if needed
          ocrPdf.addPage([width, height]);
          currentY = height - 50;
        }

        const currentPage = ocrPdf.getPageCount() > 0 ?
          ocrPdf.getPage(ocrPdf.getPageCount() - 1) :
          ocrPdf.addPage([width, height]);

        if (line.trim()) {
          currentPage.drawText(line, {
            x: margin,
            y: currentY,
            size: fontSize,
            color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
          });
        }

        currentY -= lineHeight;
      }

      // Set metadata
      const outputName = `${originalFilename.replace('.pdf', '')}_ocr.pdf`;
      ocrPdf.setTitle(outputName.replace('.pdf', ''));
      ocrPdf.setSubject('PDF created by PDFPro.pro OCR Tool');
      ocrPdf.setProducer('PDFPro.pro');
      ocrPdf.setCreator('PDFPro.pro');
      ocrPdf.setCreationDate(new Date());
      ocrPdf.setModificationDate(new Date());

      const pdfBytes = await ocrPdf.save();
      const filename = outputName;
      const outputPath = join(OUTPUT_DIR, filename);
      await writeFile(outputPath, Buffer.from(pdfBytes));

      return {
        filename,
        size: pdfBytes.length,
        extractedText,
        data: Buffer.from(pdfBytes)
      };
    }

  } catch (error) {
    console.error('OCR processing error:', error);
    throw new Error('Failed to process OCR on PDF document');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: OCRRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.options) {
      return NextResponse.json(
        { error: 'OCR options are required' },
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

    // Perform OCR processing
    const ocrResult = await performOCR(
      buffer,
      body.options,
      originalFilename
    );

    // Generate OCR report
    const ocrReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: Math.ceil(originalSize / 50000) // Rough estimate
      },
      processedFile: {
        name: ocrResult.filename,
        size: ocrResult.size,
        format: body.options.outputFormat.toUpperCase()
      },
      options: body.options,
      extraction: {
        charactersExtracted: ocrResult.extractedText.length,
        wordsExtracted: ocrResult.extractedText.split(/\s+/).filter(word => word.length > 0).length,
        linesExtracted: ocrResult.extractedText.split('\n').length
      }
    };

    return NextResponse.json({
      success: true,
      message: 'OCR processing completed successfully',
      data: {
        filename: ocrResult.filename,
        originalSize,
        convertedSize: ocrResult.size,
        extractedText: ocrResult.extractedText,
        charactersExtracted: ocrResult.extractedText.length,
        wordsExtracted: ocrResult.extractedText.split(/\s+/).filter(word => word.length > 0).length,
        downloadUrl: `/api/download/${ocrResult.filename}`,
        data: Buffer.from(ocrResult.data).toString('base64'),
        ocrReport
      }
    });

  } catch (error) {
    console.error('OCR PDF processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process OCR on PDF file' },
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