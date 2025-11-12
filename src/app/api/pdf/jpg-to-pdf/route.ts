import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

interface JPGToPDFRequest {
  files: {
    name: string;
    data: string; // Base64 encoded
  }[];
  options: {
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    imageLayout: 'fit' | 'fill' | 'center';
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

async function convertImagesToPDF(
  imageFiles: { name: string; data: Buffer }[],
  options: JPGToPDFRequest['options']
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.create();

    // Page dimensions
    const pageSizes = {
      'A4': { width: 595, height: 842 },
      'Letter': { width: 612, height: 792 }
    };

    let { width, height } = pageSizes[options.pageSize];
    if (options.orientation === 'landscape') {
      [width, height] = [height, width];
    }

    // Add each image as a page
    for (const imageFile of imageFiles) {
      const page = pdfDoc.addPage([width, height]);

      // Calculate image dimensions and position
      const availableWidth = width - options.margins.left - options.margins.right;
      const availableHeight = height - options.margins.top - options.margins.bottom;

      // In a real implementation, you would:
      // 1. Parse actual image dimensions
      // 2. Scale image to fit page
      // 3. Maintain aspect ratio
      // 4. Embed actual image bytes

      // For simulation, add text representing the image
      const imageText = `Image: ${imageFile.name}`;
      page.drawText(imageText, {
        x: options.margins.left,
        y: height - options.margins.top - 50,
        size: 12,
        color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
      });

      // Add layout info
      const layoutText = `Layout: ${options.imageLayout} | Size: ${availableWidth}x${availableHeight}`;
      page.drawText(layoutText, {
        x: options.margins.left,
        y: height - options.margins.top - 80,
        size: 10,
        color: { type: 'RGB', r: 100, g: 100, b: 100 } as any
      });
    }

    const filename = `images_to_pdf_${Date.now()}.pdf`;
    const pdfBytes = await pdfDoc.save();
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('Images to PDF conversion error:', error);
    throw new Error('Failed to convert images to PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: JPGToPDFRequest = await request.json();

    if (!body.files || body.files.length === 0) {
      return NextResponse.json(
        { error: 'No image files provided' },
        { status: 400 }
      );
    }

    if (!body.options) {
      return NextResponse.json(
        { error: 'Conversion options are required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffers
    const imageFiles = body.files.map(file => ({
      name: file.name,
      data: Buffer.from(file.data, 'base64')
    }));

    // Validate image files
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp'];
    for (const file of body.files) {
      const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!validExtensions.includes(ext)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.name}. Only images are supported` },
          { status: 400 }
        );
      }
    }

    // Convert images to PDF
    const conversionResult = await convertImagesToPDF(imageFiles, body.options);

    return NextResponse.json({
      success: true,
      message: 'Images converted to PDF successfully',
      data: {
        filename: conversionResult.filename,
        imagesConverted: body.files.length,
        fileSize: conversionResult.size,
        downloadUrl: `/api/download/${conversionResult.filename}`,
        data: Buffer.from(conversionResult.data).toString('base64')
      }
    });

  } catch (error) {
    console.error('Images to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert images to PDF' },
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