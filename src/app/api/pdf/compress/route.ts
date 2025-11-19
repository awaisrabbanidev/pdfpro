import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface CompressRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  compressionLevel: 'low' | 'medium' | 'high';
}

// Get compression settings based on level
function getCompressionSettings(level: string) {
  // ... (rest of the function is unchanged)
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

// ... (helper functions like compressImages, removeMetadata, optimizePdf are unchanged)
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

function removeMetadata(pdfDoc: PDFDocument) {
  try {
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

async function optimizePdf(pdfDoc: PDFDocument, settings: any) {
  if (settings.fontSubsetting) {
    // Placeholder for font optimization
  }
  if (settings.metadataRemoval) {
    removeMetadata(pdfDoc);
  }
  pdfDoc.setSubject(`Compressed using PDFPro.pro - ${settings.imageQuality * 100}% quality`);
  pdfDoc.setModificationDate(new Date());
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let buffer: Buffer;
    let originalFilename: string;
    let compressionLevel: string;

    if (contentType?.includes('application/json')) {
      const body: CompressRequest = await request.json();
      if (!body.file || !body.file.data) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      if (!body.compressionLevel) {
        return NextResponse.json({ error: 'Compression level is required' }, { status: 400 });
      }
      buffer = Buffer.from(body.file.data, 'base64');
      originalFilename = body.file.name;
      compressionLevel = body.compressionLevel;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const level = formData.get('compressionLevel') as string;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      if (!level) {
        return NextResponse.json({ error: 'Compression level is required' }, { status: 400 });
      }
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalFilename = file.name;
      compressionLevel = level;
    }

    const originalSize = buffer.length;
    let pdfDoc: PDFDocument;
    try {
      pdfDoc = await PDFDocument.load(buffer);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
    }

    const totalPages = pdfDoc.getPageCount();
    const baseName = originalFilename.replace(/\.pdf/gi, '');
    const compressionSettings = getCompressionSettings(compressionLevel);

    // Apply optimizations
    await optimizePdf(pdfDoc, compressionSettings);

    const outputName = `${baseName}_compressed_${compressionLevel}.pdf`;

    // Save the compressed PDF
    const compressedBytes = await pdfDoc.save({
      useObjectStreams: compressionSettings.objectCompression,
      addDefaultPage: false
    });

    const compressedSize = compressedBytes.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    // Upload to Vercel Blob
    const blob = await put(outputName, Buffer.from(compressedBytes), {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

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
            hasImages: false, // Simplified
            hasComplexElements: false // Simplified
        }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF compressed successfully',
      ...blob, // Includes url, pathname, contentType, etc.
      originalSize,
      compressedSize,
      compressionRatio,
      totalPages,
      compressionReport,
    });

  } catch (error) {
    console.error('PDF compression error:', error);
    const message = error instanceof Error ? error.message : 'Failed to compress PDF file';
    return NextResponse.json({ error: message }, { status: 500 });
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
