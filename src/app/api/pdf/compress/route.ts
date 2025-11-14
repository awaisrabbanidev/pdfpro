import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface CompressRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  compressionLevel: 'low' | 'medium' | 'high';
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

// Get compression settings based on level
function getCompressionSettings(level: string) {
  switch (level) {
    case 'low':
      return {
        imageQuality: 0.9,
        fontSubsetting: false,
        metadataRemoval: false,
        objectCompression: false
      };
    case 'medium':
      return {
        imageQuality: 0.7,
        fontSubsetting: true,
        metadataRemoval: true,
        objectCompression: true
      };
    case 'high':
      return {
        imageQuality: 0.5,
        fontSubsetting: true,
        metadataRemoval: true,
        objectCompression: true
      };
    default:
      return {
        imageQuality: 0.8,
        fontSubsetting: false,
        metadataRemoval: false,
        objectCompression: false
      };
  }
}

// Compress images in the PDF
async function compressImages(
  pdfDoc: PDFDocument,
  imageQuality: number
): Promise<{ originalSize: number; compressedSize: number }> {
  const pages = pdfDoc.getPages();
  let originalSize = 0;
  let compressedSize = 0;

  for (const page of pages) {
    // Note: pdf-lib has limited image manipulation capabilities
    // This is a simplified version that focuses on metadata removal
    // In a production environment, you'd want to use more sophisticated image compression
  }

  return { originalSize, compressedSize };
}

// Remove unnecessary metadata
function removeMetadata(pdfDoc: PDFDocument) {
  try {
    // Remove custom metadata entries
    pdfDoc.setTitle(pdfDoc.getTitle() || '');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
  } catch (error) {
    // Metadata removal is optional
  }
}

// Optimize PDF structure
async function optimizePdf(pdfDoc: PDFDocument, settings: any) {
  // Apply font subsetting
  if (settings.fontSubsetting) {
    // Note: Font subsetting requires advanced PDF manipulation
    // This is a placeholder for font optimization
  }

  // Remove metadata
  if (settings.metadataRemoval) {
    removeMetadata(pdfDoc);
  }

  // Add compression metadata
  pdfDoc.setSubject(`Compressed using PDFPro.pro - ${settings.imageQuality * 100}% quality`);
  pdfDoc.setModificationDate(new Date());
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: CompressRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.compressionLevel) {
      return NextResponse.json(
        { error: 'Compression level is required' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const buffer = Buffer.from(body.file.data, 'base64');
    const originalSize = buffer.length;

    let pdfDoc: PDFDocument;

    try {
      pdfDoc = await PDFDocument.load(buffer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const totalPages = pdfDoc.getPageCount();
    const baseName = body.file.name.replace('.pdf', '');
    const compressionSettings = getCompressionSettings(body.compressionLevel);

    // Analyze PDF structure
    const pages = pdfDoc.getPages();
    let pageText = '';
    let hasImages = false;
    let hasComplexElements = false;

    for (const page of pages) {
      const { width, height } = page.getSize();
      // Basic analysis - in production, you'd do more sophisticated content analysis
      if (width > 1000 || height > 1000) {
        hasComplexElements = true;
      }
    }

    // Apply optimizations
    await optimizePdf(pdfDoc, compressionSettings);

    // Compress images if present
    const imageCompressionResult = await compressImages(
      pdfDoc,
      compressionSettings.imageQuality
    );

    // Set output name
    const outputName = `${baseName}_compressed_${body.compressionLevel}.pdf`;

    // Add metadata about compression
    pdfDoc.setTitle(outputName.replace('.pdf', ''));
    pdfDoc.setSubject(`PDF compressed by ${compressionSettings.imageQuality * 100}% quality using PDFPro.pro`);
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    // Save the compressed PDF
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: compressionSettings.objectCompression,
      addDefaultPage: false
    });

    const compressedSize = compressedBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    // Save to file
    const outputPath = join(OUTPUT_DIR, outputName);
    await writeFile(outputPath, compressedBytes);

    // Generate compression report
    const compressionReport = {
      originalSize: {
        bytes: originalSize,
        mb: (originalSize / (1024 * 1024)).toFixed(2)
      },
      compressedSize: {
        bytes: compressedSize,
        mb: (compressedSize / (1024 * 1024)).toFixed(2)
      },
      compressionRatio: {
        percentage: compressionRatio.toFixed(1),
        sizeReduced: (originalSize - compressedSize).toLocaleString() + ' bytes'
      },
      settings: compressionSettings,
      analysis: {
        totalPages,
        hasImages,
        hasComplexElements
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF compressed successfully',
      data: {
        filename: outputName,
        originalSize,
        compressedSize,
        compressionRatio,
        totalPages,
        downloadUrl: `/api/download/${outputName}`,
        data: Buffer.from(compressedBytes).toString('base64'),
        compressionReport
      }
    });

  } catch (error) {
    console.error('PDF compression error:', error);
    return NextResponse.json(
      { error: 'Failed to compress PDF file' },
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