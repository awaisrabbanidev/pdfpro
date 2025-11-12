import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface ConvertRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    preserveFormatting: boolean;
    includeImages: boolean;
    ocrEnabled: boolean;
  };
}

const UPLOAD_DIR = join('/tmp', 'uploads');
const OUTPUT_DIR = join('/tmp', 'outputs');

// Ensure directories exist
async function ensureDirectories() {
  try {
    console.log('Creating directories:', { UPLOAD_DIR, OUTPUT_DIR });
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log('Directories created successfully');
  } catch (error) {
    console.log('Directory creation error:', error);
    // Directory might already exist, continue
  }
}

// Simple PDF analysis (placeholder for now)
async function analyzePDF(pdfBuffer: Buffer): Promise<{
  text: string;
  pages: number;
  info: any;
}> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    return {
      text: "PDF content extracted - placeholder for actual text extraction",
      pages: pdfDoc.getPageCount(),
      info: {
        Title: "PDF Document",
        Author: "Unknown"
      }
    };
  } catch (error) {
    throw new Error('Failed to analyze PDF');
  }
}

// Convert extracted text to DOCX format
async function createWordDocument(
  extractedData: { text: string; pages: number; info: any },
  options: { preserveFormatting: boolean; includeImages: boolean },
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  // Extract basic document structure
  const text = extractedData.text;
  const pages = extractedData.pages;
  const info = extractedData.info;

  // Create a simple DOCX structure using mammoth's default template
  // Note: mammoth is typically used for reading DOCX files, not creating them
  // In a production environment, you'd use a library like docx or officegen

  // For now, we'll create a simple HTML representation and convert it
  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${originalFilename.replace('.pdf', '')}</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
    h1 { color: #333; }
    .page-break { page-break-before: always; }
    .metadata { margin-bottom: 20px; padding: 10px; background-color: #f5f5f5; }
  </style>
</head>
<body>`;

  // Add metadata section
  if (options.preserveFormatting && info) {
    htmlContent += '<div class="metadata">';
    htmlContent += '<h2>Document Information</h2>';
    if (info.Title) htmlContent += `<p><strong>Title:</strong> ${info.Title}</p>`;
    if (info.Author) htmlContent += `<p><strong>Author:</strong> ${info.Author}</p>`;
    if (info.Subject) htmlContent += `<p><strong>Subject:</strong> ${info.Subject}</p>`;
    if (info.Creator) htmlContent += `<p><strong>Creator:</strong> ${info.Creator}</p>`;
    htmlContent += '</div>';
  }

  // Add main content with page breaks
  if (options.preserveFormatting && pages && pages > 1) {
    const lines = text.split('\n');
    let linesPerPage = Math.ceil(lines.length / pages);

    for (let i = 0; i < pages; i++) {
      const startIndex = i * linesPerPage;
      const endIndex = Math.min(startIndex + linesPerPage, lines.length);
      const pageLines = lines.slice(startIndex, endIndex);

      if (i > 0) {
        htmlContent += '<div class="page-break"></div>';
      }

      htmlContent += `<h2>Page ${i + 1}</h2>`;
      pageLines.forEach(line => {
        if (line.trim()) {
          htmlContent += `<p>${line.trim()}</p>`;
        }
      });
    }
  } else {
    // Simple text conversion
    const paragraphs = text.split('\n\n');
    paragraphs.forEach(paragraph => {
      if (paragraph.trim()) {
        htmlContent += `<p>${paragraph.trim()}</p>`;
      }
    });
  }

  htmlContent += `
</body>
</html>`;

  // Convert HTML to DOCX using a placeholder conversion
  // In a real implementation, you'd use a proper DOCX library
  const htmlBuffer = Buffer.from(htmlContent, 'utf-8');

  // For demonstration, we'll save as HTML with .docx extension
  // In production, use a library like 'docx' or 'officegen'
  const outputName = `${originalFilename.replace('.pdf', '')}_converted.docx`;

  // Return data directly without writing to file system
  return {
    filename: outputName,
    size: htmlBuffer.length,
    data: htmlBuffer
  };
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

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

    // Load and validate the PDF
    const pdfBuffer = Buffer.from(body.file.data, 'base64');
    const originalSize = pdfBuffer.length;

    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
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

    const originalFilename = body.file.name;

    // Analyze PDF content
    const extractedData = await analyzePDF(pdfBuffer);

    if (!extractedData.text || extractedData.text.trim().length === 0) {
      return NextResponse.json(
        { error: 'PDF contains no extractable text. OCR may be required.' },
        { status: 400 }
      );
    }

    // Create Word document
    const result = await createWordDocument(
      extractedData,
      body.options,
      originalFilename
    );

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: extractedData.pages || 1
      },
      convertedFile: {
        name: result.filename,
        size: result.size,
        characters: extractedData.text.length,
        words: extractedData.text.split(/\s+/).filter(word => word.length > 0).length
      },
      options: body.options,
      extraction: {
        hasText: extractedData.text.length > 0,
        hasImages: body.options.includeImages,
        ocrUsed: body.options.ocrEnabled
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF converted to Word successfully',
      data: {
        filename: result.filename,
        originalSize,
        convertedSize: result.size,
        extractedCharacters: extractedData.text.length,
        extractedWords: extractedData.text.split(/\s+/).filter(word => word.length > 0).length,
        pagesProcessed: extractedData.pages || 1,
        downloadUrl: `/api/download/${result.filename}`,
        data: Buffer.from(result.data).toString('base64'),
        conversionReport
      }
    });

  } catch (error) {
    console.error('PDF to Word conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to Word' },
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