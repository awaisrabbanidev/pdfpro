export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, PDFName, PDFString } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface SignRequest {
  pdfFile: {
    name: string;
    data: string; // Base64 encoded
  };
  signature: {
    type: 'text' | 'image' | 'drawing';
    content: string; // Text, base64 image, or drawing coordinates
    position: {
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    };
    options: {
      fontSize?: number;
      fontFamily?: string;
      color?: string;
      opacity?: number;
    };
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

// Parse color string to RGB values
function parseColor(color: string): { r: number; g: number; b: number } {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255
    };
  }
  // Default to black
  return { r: 0, g: 0, b: 0 };
}

// Add text signature to PDF
async function addTextSignature(
  pdfDoc: PDFDocument,
  signatureText: string,
  position: any,
  options: any
) {
  const pages = pdfDoc.getPages();

  if (position.page < 1 || position.page > pages.length) {
    throw new Error('Invalid page number for signature');
  }

  const page = pages[position.page - 1];
  const { width, height } = page.getSize();

  // Validate position
  const x = Math.max(0, Math.min(position.x, width - position.width));
  const y = Math.max(0, Math.min(height - position.y - position.height, height - position.height));

  // Add text signature
  page.drawText(signatureText, {
    x,
    y,
    size: options.fontSize || 16,
    font: await pdfDoc.embedFont('Helvetica'),
    color: parseColor(options.color || '#000000') as any,
    opacity: options.opacity || 1
  });

  // Add timestamp below signature
  const timestamp = new Date().toLocaleString();
  page.drawText(`Signed: ${timestamp}`, {
    x,
    y: y - 20,
    size: 10,
    font: await pdfDoc.embedFont('Helvetica'),
    color: { r: 0.5, g: 0.5, b: 0.5 } as any,
    opacity: 0.7
  });
}

// Add image signature to PDF
async function addImageSignature(
  pdfDoc: PDFDocument,
  imageData: string,
  position: any,
  options: any
) {
  const pages = pdfDoc.getPages();

  if (position.page < 1 || position.page > pages.length) {
    throw new Error('Invalid page number for signature');
  }

  const page = pages[position.page - 1];
  const { width, height } = page.getSize();

  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, 'base64');

    // Embed image in PDF
    let image;
    if (imageData.startsWith('data:image/png')) {
      image = await pdfDoc.embedPng(imageBuffer);
    } else if (imageData.startsWith('data:image/jpeg') || imageData.startsWith('data:image/jpg')) {
      image = await pdfDoc.embedJpg(imageBuffer);
    } else {
      throw new Error('Unsupported image format. Use PNG or JPEG.');
    }

    // Calculate position to center the image
    const x = Math.max(0, Math.min(position.x, width - position.width));
    const y = Math.max(0, Math.min(height - position.y - position.height, height - position.height));

    // Draw image
    page.drawImage(image, {
      x,
      y,
      width: position.width,
      height: position.height,
      opacity: options.opacity || 1
    });

    // Add timestamp below image
    const timestamp = new Date().toLocaleString();
    page.drawText(`Signed: ${timestamp}`, {
      x,
      y: y - 20,
      size: 10,
      font: await pdfDoc.embedFont('Helvetica'),
      color: { r: 0.5, g: 0.5, b: 0.5 } as any,
      opacity: 0.7
    });

  } catch (error) {
    throw new Error('Failed to embed signature image: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Add drawing signature to PDF
async function addDrawingSignature(
  pdfDoc: PDFDocument,
  drawingData: string,
  position: any,
  options: any
) {
  const pages = pdfDoc.getPages();

  if (position.page < 1 || position.page > pages.length) {
    throw new Error('Invalid page number for signature');
  }

  const page = pages[position.page - 1];
  const { width, height } = page.getSize();

  // Parse drawing data (format: "x1,y1;x2,y2;x3,y3...")
  const points = drawingData.split(';').map((point: string) => {
    if (!point || !point.includes(',')) return null;
    const coords = point.split(',');
    if (coords.length !== 2) return null;

    const x = Number(coords[0]);
    const y = Number(coords[1]);

    if (isNaN(x) || isNaN(y)) return null;
    return { x, y };
  }).filter((point: any): point is { x: number; y: number } => point !== null);

  if (points.length < 2) {
    throw new Error('Invalid drawing data - need at least 2 points');
  }

  // Scale drawing to fit the signature area
  const xValues = points.map(p => p.x);
  const yValues = points.map(p => p.y);
  const drawingWidth = Math.max(...xValues) - Math.min(...xValues);
  const drawingHeight = Math.max(...yValues) - Math.min(...yValues);

  // Prevent division by zero
  if (drawingWidth === 0 || drawingHeight === 0) {
    throw new Error('Invalid drawing data - points must have different coordinates');
  }

  const scaleX = position.width / drawingWidth;
  const scaleY = position.height / drawingHeight;
  const scale = Math.min(scaleX, scaleY);

  const minX = Math.min(...xValues);
  const minY = Math.min(...yValues);

  // Draw signature lines
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];

    page.drawLine({
      start: {
        x: position.x + (start.x - minX) * scale,
        y: height - (position.y + (start.y - minY) * scale)
      },
      end: {
        x: position.x + (end.x - minX) * scale,
        y: height - (position.y + (end.y - minY) * scale)
      },
      thickness: 2,
      color: parseColor(options.color || '#000000') as any,
      opacity: options.opacity || 1
    });
  }

  // Add timestamp below signature
  const timestamp = new Date().toLocaleString();
  page.drawText(`Signed: ${timestamp}`, {
    x: position.x,
    y: position.y - 20,
    size: 10,
    font: await pdfDoc.embedFont('Helvetica'),
    color: { r: 0.5, g: 0.5, b: 0.5 } as any,
    opacity: 0.7
  });
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: SignRequest = await request.json();

    if (!body.pdfFile || !body.pdfFile.data) {
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }

    if (!body.signature) {
      return NextResponse.json(
        { error: 'Signature data is required' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const pdfBuffer = Buffer.from(body.pdfFile.data, 'base64');
    const originalSize = pdfBuffer.length;

    let pdfDoc: PDFDocument;

    try {
      pdfDoc = await PDFDocument.load(pdfBuffer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    if (pdfDoc.getPageCount() === 0) {
      return NextResponse.json(
        { error: 'PDF file has no pages' },
        { status: 400 }
      );
    }

    // Validate signature position
    const { position } = body.signature;
    if (!position || position.page < 1 || position.x < 0 || position.y < 0 ||
        position.width <= 0 || position.height <= 0) {
      return NextResponse.json(
        { error: 'Invalid signature position' },
        { status: 400 }
      );
    }

    // Add signature based on type
    try {
      switch (body.signature.type) {
        case 'text':
          if (!body.signature.content || body.signature.content.trim().length === 0) {
            return NextResponse.json(
              { error: 'Signature text is required for text signature' },
              { status: 400 }
            );
          }
          await addTextSignature(pdfDoc, body.signature.content, position, body.signature.options);
          break;

        case 'image':
          if (!body.signature.content || !body.signature.content.startsWith('data:image')) {
            return NextResponse.json(
              { error: 'Valid image data is required for image signature' },
              { status: 400 }
            );
          }
          await addImageSignature(pdfDoc, body.signature.content, position, body.signature.options);
          break;

        case 'drawing':
          if (!body.signature.content || !body.signature.content.includes(',')) {
            return NextResponse.json(
              { error: 'Valid drawing coordinates are required for drawing signature' },
              { status: 400 }
            );
          }
          await addDrawingSignature(pdfDoc, body.signature.content, position, body.signature.options);
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid signature type' },
            { status: 400 }
          );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to add signature: ' + (error instanceof Error ? error.message : String(error)) },
        { status: 400 }
      );
    }

    // Update metadata
    const outputName = `${body.pdfFile.name.replace('.pdf', '')}_signed.pdf`;
    pdfDoc.setTitle(outputName.replace('.pdf', ''));
    pdfDoc.setSubject('PDF signed using PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setModificationDate(new Date());

    // Add signature annotation to metadata
    pdfDoc.setKeywords([
      'signed',
      'digital signature',
      'PDFPro.pro',
      `signed: ${new Date().toISOString()}`
    ]);

    // Save the signed PDF
    const signedBytes = await pdfDoc.save();
    const signedSize = signedBytes.length;

    // Save to file
    const outputPath = join(OUTPUT_DIR, outputName);
    await writeFile(outputPath, signedBytes);

    return NextResponse.json({
      success: true,
      message: 'PDF signed successfully',
      data: {
        filename: outputName,
        originalSize,
        signedSize,
        signatureType: body.signature.type,
        pageNumber: body.signature.position.page,
        downloadUrl: `/api/download/${outputName}`,
        data: Buffer.from(signedBytes).toString('base64')
      }
    });

  } catch (error) {
    console.error('PDF signing error:', error);
    return NextResponse.json(
      { error: 'Failed to sign PDF file: ' + (error instanceof Error ? error.message : String(error)) },
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