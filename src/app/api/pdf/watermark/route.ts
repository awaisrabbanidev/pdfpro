import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, rgb } from 'pdf-lib';

interface WatermarkRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  watermark: {
    type: 'text' | 'image';
    content: string;
    position: 'center' | 'corner' | 'diagonal' | 'repeat';
    opacity: number;
    fontSize?: number;
    color?: string;
  };
}

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const OUTPUT_DIR = join(process.cwd(), 'outputs');

async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function addWatermark(
  pdfBuffer: Buffer,
  watermark: WatermarkRequest['watermark'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Add watermark to each page
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i);
      const { width, height } = page.getSize();

      if (watermark.type === 'text') {
        const fontSize = watermark.fontSize || 48;
        const opacity = watermark.opacity || 0.3;

        // Parse color
        let color = { type: 'RGB', r: 200, g: 200, b: 200 } as any;
        if (watermark.color) {
          const hex = watermark.color.replace('#', '');
          color = {
            type: 'RGB',
            r: parseInt(hex.substring(0, 2), 16),
            g: parseInt(hex.substring(2, 4), 16),
            b: parseInt(hex.substring(4, 6), 16)
          } as any;
        }

        switch (watermark.position) {
          case 'center':
            page.drawText(watermark.content, {
              x: width / 2 - (watermark.content.length * fontSize) / 4,
              y: height / 2,
              size: fontSize,
              color,
              opacity
            });
            break;
          case 'diagonal':
            page.saveContext();
            page.transform({
              x: width / 2,
              y: height / 2,
              skewX: 0,
              skewY: Math.PI / 6
            });
            page.drawText(watermark.content, {
              x: -(watermark.content.length * fontSize) / 4,
              y: 0,
              size: fontSize,
              color,
              opacity
            });
            page.restoreContext();
            break;
          case 'corner':
            page.drawText(watermark.content, {
              x: 50,
              y: 50,
              size: fontSize,
              color,
              opacity
            });
            break;
          case 'repeat':
            for (let x = 0; x < width; x += 200) {
              for (let y = 0; y < height; y += 100) {
                page.drawText(watermark.content, {
                  x,
                  y,
                  size: fontSize / 2,
                  color,
                  opacity: opacity / 2
                });
              }
            }
            break;
        }
      }
    }

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_watermarked.pdf`;
    pdfDoc.setTitle(filename.replace('.pdf', ''));
    pdfDoc.setSubject('PDF watermarked by PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setKeywords(['watermark', 'protected']);
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
    console.error('PDF watermark error:', error);
    throw new Error('Failed to add watermark to PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: WatermarkRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.watermark || !body.watermark.content) {
      return NextResponse.json(
        { error: 'Watermark content is required' },
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

    // Add watermark
    const watermarkResult = await addWatermark(buffer, body.watermark, originalFilename);

    return NextResponse.json({
      success: true,
      message: 'Watermark added successfully',
      data: {
        filename: watermarkResult.filename,
        originalSize,
        watermarkedSize: watermarkResult.size,
        watermarkType: body.watermark.type,
        downloadUrl: `/api/download/${watermarkResult.filename}`,
        data: Buffer.from(watermarkResult.data).toString('base64')
      }
    });

  } catch (error) {
    console.error('PDF watermark error:', error);
    return NextResponse.json(
      { error: 'Failed to add watermark to PDF' },
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