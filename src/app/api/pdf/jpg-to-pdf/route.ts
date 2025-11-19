<<<<<<< HEAD
export const runtime = 'nodejs';
=======
export const runtime = 'edge';
>>>>>>> main
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    // Validate file types
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({
          error: 'Invalid file type. Please upload only image files.'
        }, { status: 400 });
      }
    }

    const timestamp = Date.now();
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-images-to.pdf`);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      // Process each image
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const inputBuffer = Buffer.from(bytes);

        // Convert image to ensure consistency
        const processedBuffer = await sharp(inputBuffer)
          .jpeg({ quality: 90 })
          .toBuffer();

        // Add image as a new page
        let image;
        if (file.type === 'image/png') {
          image = await pdfDoc.embedPng(processedBuffer);
        } else {
          image = await pdfDoc.embedJpg(processedBuffer);
        }

        // Get image dimensions
        const { width, height } = await sharp(processedBuffer).metadata();

        // Calculate page dimensions (A4 size with proper scaling)
        const pageWidth = 595.28; // A4 width in points
        const pageHeight = 841.89; // A4 height in points
        const margin = 50;

        // Scale image to fit within page bounds
        const maxWidth = pageWidth - (2 * margin);
        const maxHeight = pageHeight - (2 * margin);

        let scale = 1;
        if (width && height) {
          const widthScale = maxWidth / width;
          const heightScale = maxHeight / height;
          scale = Math.min(widthScale, heightScale);
        }

        const imageWidth = (width || 400) * scale;
        const imageHeight = (height || 300) * scale;

        // Calculate position to center the image
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        page.drawImage(image, {
          x: x,
          y: y,
          width: imageWidth,
          height: imageHeight,
        });
      }

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('Image conversion error:', conversionError);
      throw new Error('Failed to convert images to PDF');
    }

    // Read the output file for base64 encoding
    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      filename: `${timestamp}-images-to.pdf`,
      base64: base64,
      message: `Successfully converted ${files.length} image(s) to PDF`
    });

  } catch (error) {
    console.error('JPG to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert images to PDF' },
      { status: 500 }
    );
  }
}