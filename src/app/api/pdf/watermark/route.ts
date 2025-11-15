import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';
import { safeJsonParse } from '@/lib/api-helpers';

interface WatermarkSettings {
  type: 'text' | 'image';
  content: string;
  opacity: number;
  rotation: number;
  fontSize?: number;
  color?: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  scale: number;
  pages: 'all' | number[];
}

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settings = formData.get('settings') as string;
    const imageFile = formData.get('imageFile') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!settings) {
      return NextResponse.json({ error: 'No watermark settings specified' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-watermarked.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument, rgb, degrees } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);

      const watermarkSettings: WatermarkSettings = JSON.parse(settings);
      const pageCount = pdfDoc.getPageCount();

      let imageBytes: Uint8Array | undefined;
      if (watermarkSettings.type === 'image' && imageFile) {
        const imgBuffer = Buffer.from(await imageFile.arrayBuffer());
        imageBytes = new Uint8Array(imgBuffer);
      }

      // Determine which pages to apply watermark to
      const pagesToWatermark = watermarkSettings.pages === 'all'
        ? Array.from({ length: pageCount }, (_, i) => i)
        : watermarkSettings.pages.map(page => page - 1); // Convert to 0-based index

      for (const pageIndex of pagesToWatermark) {
        if (pageIndex < 0 || pageIndex >= pageCount) continue;

        const page = pdfDoc.getPage(pageIndex);
        const { width, height } = page.getSize();

        if (watermarkSettings.type === 'text') {
          const font = await pdfDoc.embedFont('Helvetica');
          const fontSize = watermarkSettings.fontSize || 24;

          // Calculate text position
          let x = width / 2;
          let y = height / 2;

          switch (watermarkSettings.position) {
            case 'top-left':
              x = width * 0.2;
              y = height * 0.8;
              break;
            case 'top-right':
              x = width * 0.8;
              y = height * 0.8;
              break;
            case 'bottom-left':
              x = width * 0.2;
              y = height * 0.2;
              break;
            case 'bottom-right':
              x = width * 0.8;
              y = height * 0.2;
              break;
            case 'center':
            default:
              x = width / 2;
              y = height / 2;
              break;
          }

          // Parse color
          let color;
          if (watermarkSettings.color) {
            const hex = watermarkSettings.color.replace('#', '');
            color = rgb(
              parseInt(hex.substr(0, 2), 16) / 255,
              parseInt(hex.substr(2, 2), 16) / 255,
              parseInt(hex.substr(4, 2), 16) / 255
            );
          } else {
            color = rgb(0.5, 0.5, 0.5); // Default gray
          }

          // Draw text with rotation
          page.drawText(watermarkSettings.content, {
            x: x,
            y: y,
            size: fontSize * watermarkSettings.scale,
            font: font,
            color: color,
            opacity: watermarkSettings.opacity,
            rotate: degrees(watermarkSettings.rotation)
          });

        } else if (watermarkSettings.type === 'image' && imageBytes) {
          // Embed image
          let watermarkImage;
          if (imageFile.type === 'image/png') {
            watermarkImage = await pdfDoc.embedPng(imageBytes);
          } else {
            watermarkImage = await pdfDoc.embedJpg(imageBytes);
          }

          const imgWidth = watermarkImage.width * watermarkSettings.scale;
          const imgHeight = watermarkImage.height * watermarkSettings.scale;

          // Calculate image position
          let x = (width - imgWidth) / 2;
          let y = (height - imgHeight) / 2;

          switch (watermarkSettings.position) {
            case 'top-left':
              x = 50;
              y = height - imgHeight - 50;
              break;
            case 'top-right':
              x = width - imgWidth - 50;
              y = height - imgHeight - 50;
              break;
            case 'bottom-left':
              x = 50;
              y = 50;
              break;
            case 'bottom-right':
              x = width - imgWidth - 50;
              y = 50;
              break;
            case 'center':
            default:
              x = (width - imgWidth) / 2;
              y = (height - imgHeight) / 2;
              break;
          }

          // Draw image with rotation and opacity
          page.drawImage(watermarkImage, {
            x: x,
            y: y,
            width: imgWidth,
            height: imgHeight,
            opacity: watermarkSettings.opacity,
            rotate: degrees(watermarkSettings.rotation)
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('Watermark error:', conversionError);
      throw new Error('Failed to add watermark');
    } finally {
      // Clean up input file
      try {
        await unlink(inputPath);
      } catch (error) {
        console.error('Failed to clean up input file:', error);
      }
    }

    // Read the output file for base64 encoding
    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      filename: `${file.name.replace('.pdf', '-watermarked.pdf')}`,
      base64: base64,
      message: 'Watermark added successfully'
    });

  } catch (error) {
    console.error('Watermark error:', error);
    return NextResponse.json(
      { error: 'Failed to add watermark' },
      { status: 500 }
    );
  }
}