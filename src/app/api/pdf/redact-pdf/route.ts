import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';

interface RedactionArea {
  x: number;
  y: number;
  width: number;
  height: number;
  page: number;
}

interface RedactionSettings {
  areas: RedactionArea[];
  reason?: string;
  color?: string;
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
      return NextResponse.json({ error: 'No redaction settings specified' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-redacted.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);

      const redactionSettings: RedactionSettings = JSON.parse(settings);

      // Parse color (default to black)
      let redactionColor = rgb(0, 0, 0); // Black by default
      if (redactionSettings.color) {
        const hex = redactionSettings.color.replace('#', '');
        redactionColor = rgb(
          parseInt(hex.substr(0, 2), 16) / 255,
          parseInt(hex.substr(2, 2), 16) / 255,
          parseInt(hex.substr(4, 2), 16) / 255
        );
      }

      // Process each redaction area
      for (const area of redactionSettings.areas) {
        const pageIndex = area.page - 1; // Convert to 0-based index

        if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
          console.warn(`Invalid page number: ${area.page}, skipping redaction`);
          continue;
        }

        const page = pdfDoc.getPage(pageIndex);
        const { height } = page.getSize();

        // Convert coordinates (assuming input coordinates are from top-left)
        // PDF coordinates are from bottom-left
        const pdfY = height - area.y - area.height;

        // Draw black rectangle to redact the area
        page.drawRectangle({
          x: area.x,
          y: pdfY,
          width: area.width,
          height: area.height,
          color: redactionColor,
          opacity: 1.0,
        });

        // Add redaction reason if provided
        if (redactionSettings.reason) {
          const font = await pdfDoc.embedFont('Helvetica');
          const fontSize = 8;
          const text = redactionSettings.reason;
          const textWidth = font.widthOfTextAtSize(text, fontSize);

          // Position reason text below the redaction area
          page.drawText(text, {
            x: area.x,
            y: pdfY - fontSize - 2,
            size: fontSize,
            font: font,
            color: rgb(0.3, 0.3, 0.3), // Gray for reason text
          });
        }
      }

      // Add redaction summary page at the beginning
      if (redactionSettings.areas.length > 0) {
        const summaryPage = pdfDoc.insertPage(0, [595.28, 841.89]);
        const font = await pdfDoc.embedFont('Helvetica');

        summaryPage.drawText('Redaction Summary', {
          x: 50,
          y: 800,
          size: 20,
          color: rgb(0, 0, 0),
        });

        summaryPage.drawText(`Original file: ${file.name}`, {
          x: 50,
          y: 760,
          size: 12,
          color: rgb(0, 0, 0),
        });

        summaryPage.drawText(`Redaction completed: ${new Date().toLocaleString()}`, {
          x: 50,
          y: 740,
          size: 12,
          color: rgb(0, 0, 0),
        });

        summaryPage.drawText(`Total redactions: ${redactionSettings.areas.length}`, {
          x: 50,
          y: 720,
          size: 12,
          color: rgb(0, 0, 0),
        });

        if (redactionSettings.reason) {
          summaryPage.drawText(`Redaction reason: ${redactionSettings.reason}`, {
            x: 50,
            y: 700,
            size: 12,
            color: rgb(0, 0, 0),
          });
        }

        summaryPage.drawText('', {
          x: 50,
          y: 660,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        summaryPage.drawText('This document contains redacted information.', {
          x: 50,
          y: 640,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        summaryPage.drawText('Redacted areas have been permanently blacked out.', {
          x: 50,
          y: 620,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        summaryPage.drawText('Processed by PDFPro.pro', {
          x: 50,
          y: 600,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });
      }

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('PDF redaction error:', conversionError);
      throw new Error('Failed to redact PDF');
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
      filename: `${file.name.replace('.pdf', '-redacted.pdf')}`,
      base64: base64,
      message: `PDF redacted successfully with ${redactionSettings?.areas?.length || 0} redactions`
    });

  } catch (error) {
    console.error('PDF redaction error:', error);
    return NextResponse.json(
      { error: 'Failed to redact PDF' },
      { status: 500 }
    );
  }
}