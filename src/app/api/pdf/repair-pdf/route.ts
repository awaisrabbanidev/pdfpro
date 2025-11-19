<<<<<<< HEAD
export const runtime = 'nodejs';
=======
export const runtime = 'edge';
>>>>>>> main
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-repaired.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');

      // Try to load and repair the PDF
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(buffer);
      } catch (initialError) {
        // If initial load fails, try with more permissive settings
        console.warn('Initial PDF load failed, attempting repair:', initialError);
        pdfDoc = await PDFDocument.load(buffer, {
          ignoreEncryption: true,
          updateMetadata: false
        });
      }

      // Basic repair operations
      const pageCount = pdfDoc.getPageCount();

      // Add a repair information page at the beginning
      const repairPage = pdfDoc.insertPage(0, [595.28, 841.89]);

      // Use a simple font that's always available
      try {
        const font = await pdfDoc.embedFont('Helvetica');

        repairPage.drawText('PDF Repair Report', {
          x: 50,
          y: 800,
          size: 20,
          color: rgb(0, 0, 0),
        });

        repairPage.drawText(`Original file: ${file.name}`, {
          x: 50,
          y: 760,
          size: 12,
          color: rgb(0, 0, 0),
        });

        repairPage.drawText(`Pages detected: ${pageCount}`, {
          x: 50,
          y: 740,
          size: 12,
          color: rgb(0, 0, 0),
        });

        repairPage.drawText(`Repair completed: ${new Date().toLocaleString()}`, {
          x: 50,
          y: 720,
          size: 12,
          color: rgb(0, 0, 0),
        });

        repairPage.drawText('', {
          x: 50,
          y: 680,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        repairPage.drawText('This PDF was automatically repaired by PDFPro.pro', {
          x: 50,
          y: 660,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        repairPage.drawText('The repair process attempted to:', {
          x: 50,
          y: 640,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        repairPage.drawText('- Fix structural corruption', {
          x: 70,
          y: 620,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        repairPage.drawText('- Preserve document content', {
          x: 70,
          y: 600,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

        repairPage.drawText('- Maintain page layout', {
          x: 70,
          y: 580,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
        });

      } catch (fontError) {
        console.warn('Font embedding failed, continuing without repair page:', fontError);
        // Remove the repair page if font failed
        pdfDoc.removePage(0);
      }

      // Try to fix common issues by re-saving the document
      const pdfBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false
      });

      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('PDF repair error:', conversionError);

      // If repair fails completely, create a new PDF with error information
      const { PDFDocument, rgb } = await import('pdf-lib');
      const errorPdfDoc = await PDFDocument.create();
      const errorPage = errorPdfDoc.addPage([595.28, 841.89]);

      try {
        const font = await errorPdfDoc.embedFont('Helvetica');

        errorPage.drawText('PDF Repair Failed', {
          x: 50,
          y: 800,
          size: 20,
          color: rgb(1, 0, 0),
        });

        errorPage.drawText(`Original file: ${file.name}`, {
          x: 50,
          y: 760,
          size: 12,
          color: rgb(0, 0, 0),
        });

        errorPage.drawText('Unfortunately, the PDF file could not be repaired.', {
          x: 50,
          y: 720,
          size: 12,
          color: rgb(0, 0, 0),
        });

        errorPage.drawText('Possible reasons:', {
          x: 50,
          y: 680,
          size: 12,
          color: rgb(0, 0, 0),
        });

        errorPage.drawText('- File is severely corrupted', {
          x: 70,
          y: 660,
          size: 10,
          color: rgb(0, 0, 0),
        });

        errorPage.drawText('- File is not a valid PDF', {
          x: 70,
          y: 640,
          size: 10,
          color: rgb(0, 0, 0),
        });

        errorPage.drawText('- File is password protected', {
          x: 70,
          y: 620,
          size: 10,
          color: rgb(0, 0, 0),
        });

        errorPage.drawText('Please try uploading a different file.', {
          x: 50,
          y: 580,
          size: 12,
          color: rgb(0, 0, 0),
        });

        const errorPdfBytes = await errorPdfDoc.save();
        await writeFile(outputPath, errorPdfBytes);

      } catch (fallbackError) {
        throw new Error('PDF repair failed completely');
      }
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
      filename: `${file.name.replace('.pdf', '-repaired.pdf')}`,
      base64: base64,
      message: 'PDF repair process completed'
    });

  } catch (error) {
    console.error('PDF repair error:', error);
    return NextResponse.json(
      { error: 'Failed to repair PDF' },
      { status: 500 }
    );
  }
}

function rgb(r: number, g: number, b: number) {
  return { r: r / 255, g: g / 255, b: b / 255 };
}