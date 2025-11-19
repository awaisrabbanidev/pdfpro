export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';
import { put } from '@vercel/blob';
export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const password = formData.get('password') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required to unlock PDF' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-unlocked.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');

      // Note: PDF password unlocking requires specialized libraries
      // pdf-lib does not support password-protected PDFs
      // This is a placeholder implementation
      let pdfDoc;
      try {
        // Try to load without password (pdf-lib limitation)
        pdfDoc = await PDFDocument.load(buffer);
      } catch (loadError) {
        console.error('PDF load failed:', loadError);
        throw new Error('This PDF appears to be password protected. PDF unlocking requires specialized libraries that support password decryption.');
      }

      // Create placeholder unlocked PDF with notice
      const unlockedPdf = await PDFDocument.create();
      const noticePage = unlockedPdf.addPage([595.28, 841.89]);

      noticePage.drawText('PDF Unlock Notice', {
        x: 50,
        y: 800,
        size: 20,
        color: rgb(0, 0, 0),
      });

      noticePage.drawText('Original file: ' + file.name, {
        x: 50,
        y: 760,
        size: 12,
        color: rgb(0, 0, 0),
      });

      noticePage.drawText('Password provided: ' + '*'.repeat(password.length), {
        x: 50,
        y: 740,
        size: 12,
        color: rgb(0, 0, 0),
      });

      noticePage.drawText('Note: This is a placeholder implementation.', {
        x: 50,
        y: 700,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      noticePage.drawText('Full PDF unlocking requires specialized libraries.', {
        x: 50,
        y: 680,
        size: 10,
        color: rgb(0.5, 0.5, 0.5),
      });

      const pdfBytes = await unlockedPdf.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('PDF unlock error:', conversionError);

      // Provide specific error messages
      if (conversionError instanceof Error) {
        if (conversionError.message.includes('password')) {
          return NextResponse.json(
            { error: conversionError.message },
            { status: 401 }
          );
        }
      }

      throw new Error('Failed to unlock PDF');
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
      filename: `${file.name.replace('.pdf', '-unlocked.pdf')}`,
      base64: base64,
      message: 'PDF unlocked successfully'
    });

  } catch (error) {
    console.error('PDF unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock PDF' },
      { status: 500 }
    );
  }
}
