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
      const { PDFDocument } = await import('pdf-lib');

      // Try to load the PDF with the provided password
      let pdfDoc;
      try {
        pdfDoc = await PDFDocument.load(buffer, {
          password: password
        });
      } catch (passwordError) {
        console.error('Password authentication failed:', passwordError);
        throw new Error('Incorrect password. Please verify the password and try again.');
      }

      // Check if the PDF was successfully loaded and decrypted
      if (!pdfDoc) {
        throw new Error('Failed to load PDF document');
      }

      // Create a new PDF without password protection
      const unprotectedPdf = await PDFDocument.create();

      // Copy all pages from the original PDF
      const pageCount = pdfDoc.getPageCount();
      for (let i = 0; i < pageCount; i++) {
        const [page] = await unprotectedPdf.copyPages(pdfDoc, [i]);
        unprotectedPdf.addPage(page);
      }

      // Copy metadata if available
      try {
        const title = pdfDoc.getTitle();
        const author = pdfDoc.getAuthor();
        const subject = pdfDoc.getSubject();
        const creator = pdfDoc.getCreator();
        const producer = pdfDoc.getProducer();

        if (title) unprotectedPdf.setTitle(title);
        if (author) unprotectedPdf.setAuthor(author);
        if (subject) unprotectedPdf.setSubject(subject);
        if (creator) unprotectedPdf.setCreator(creator);
        if (producer) unprotectedPdf.setProducer(producer);
      } catch (metadataError) {
        console.warn('Failed to copy metadata:', metadataError);
        // Continue without metadata
      }

      const pdfBytes = await unprotectedPdf.save();
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