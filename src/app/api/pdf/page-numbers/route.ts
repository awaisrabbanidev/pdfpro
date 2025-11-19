<<<<<<< HEAD
export const runtime = 'nodejs';
=======
export const runtime = 'edge';
>>>>>>> main
import { ensureTempDirs, safeJsonParse } from '@/lib/api-helpers';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';

interface PageNumberSettings {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: '1' | 'Page 1' | '1 of N' | 'Page 1 of N';
  startFrom: number;
  fontSize: number;
  color: string;
  margin: number;
}

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settings = formData.get('settings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!settings) {
      return NextResponse.json({ error: 'No page number settings specified' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-with-page-numbers.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);

      const pageNumberSettings: PageNumberSettings = safeJsonParse(settings, "settings");
      const pageCount = pdfDoc.getPageCount();

      // Define font
      const font = await pdfDoc.embedFont('Helvetica');

      // Helper function to get position coordinates
      function getPosition(pageSize: { width: number; height: number }, textWidth: number) {
        const { width, height } = pageSize;
        const margin = pageNumberSettings.margin;

        let x = margin;
        let y = margin;

        switch (pageNumberSettings.position) {
          case 'top-left':
            x = margin;
            y = height - margin - pageNumberSettings.fontSize;
            break;
          case 'top-center':
            x = (width - textWidth) / 2;
            y = height - margin - pageNumberSettings.fontSize;
            break;
          case 'top-right':
            x = width - margin - textWidth;
            y = height - margin - pageNumberSettings.fontSize;
            break;
          case 'bottom-left':
            x = margin;
            y = margin + pageNumberSettings.fontSize;
            break;
          case 'bottom-center':
            x = (width - textWidth) / 2;
            y = margin + pageNumberSettings.fontSize;
            break;
          case 'bottom-right':
            x = width - margin - textWidth;
            y = margin + pageNumberSettings.fontSize;
            break;
        }

        return { x, y };
      }

      // Parse color string (hex or rgb)
      function parseColor(colorStr: string) {
        if (colorStr.startsWith('#')) {
          const hex = colorStr.slice(1);
          return rgb(
            parseInt(hex.substr(0, 2), 16) / 255,
            parseInt(hex.substr(2, 2), 16) / 255,
            parseInt(hex.substr(4, 2), 16) / 255
          );
        }
        // Default to black
        return rgb(0, 0, 0);
      }

      // Add page numbers to each page
      for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();

        // Calculate page number
        const pageNum = pageNumberSettings.startFrom + i;

        // Format the page number text
        let pageText: string;
        switch (pageNumberSettings.format) {
          case '1':
            pageText = pageNum.toString();
            break;
          case 'Page 1':
            pageText = `Page ${pageNum}`;
            break;
          case '1 of N':
            pageText = `${pageNum} of ${pageCount + pageNumberSettings.startFrom - 1}`;
            break;
          case 'Page 1 of N':
            pageText = `Page ${pageNum} of ${pageCount + pageNumberSettings.startFrom - 1}`;
            break;
          default:
            pageText = pageNum.toString();
        }

        // Calculate text width
        const textWidth = font.widthOfTextAtSize(pageText, pageNumberSettings.fontSize);

        // Get position
        const { x, y } = getPosition({ width, height }, textWidth);

        // Draw page number
        page.drawText(pageText, {
          x,
          y,
          size: pageNumberSettings.fontSize,
          font: font,
          color: parseColor(pageNumberSettings.color),
        });
      }

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('Page numbers error:', conversionError);
      throw new Error('Failed to add page numbers');
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
      filename: `${file.name.replace('.pdf', '-with-page-numbers.pdf')}`,
      base64: base64,
      message: 'Page numbers added successfully'
    });

  } catch (error) {
    console.error('Page numbers addition error:', error);
    return NextResponse.json(
      { error: 'Failed to add page numbers' },
      { status: 500 }
    );
  }
}