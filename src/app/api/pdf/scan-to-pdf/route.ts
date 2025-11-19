export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';
import sharp from 'sharp';
import Tesseract from 'tesseract.js';

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const enableOCR = formData.get('enableOCR') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload an image file.'
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-scan-to.pdf`);

    await writeFile(inputPath, buffer);

    // Initialize OCR text outside try block for access in response
    let ocrText = '';

    try {
      // Perform OCR if requested
      if (enableOCR) {
        try {
          const { data: { text } } = await Tesseract.recognize(
            buffer,
            'eng',
            {
              logger: m => console.log(m)
            }
          );
          ocrText = text;
        } catch (ocrError) {
          console.warn('OCR failed, continuing without text extraction:', ocrError);
        }
      }

      // Process image for better quality
      const processedBuffer = await sharp(buffer)
        .grayscale()
        .normalize()
        .sharpen()
        .jpeg({ quality: 95 })
        .toBuffer();

      // Create PDF
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      // Get image dimensions
      const metadata = await sharp(processedBuffer).metadata();
      const { width, height } = metadata;

      // Calculate page dimensions (A4 size)
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
      const y = enableOCR ? pageHeight - imageHeight - 100 : (pageHeight - imageHeight) / 2;

      // Add image to page
      const image = await pdfDoc.embedJpg(processedBuffer);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      page.drawImage(image, {
        x: x,
        y: y,
        width: imageWidth,
        height: imageHeight,
      });

      // Add OCR text as invisible text layer if OCR was performed
      if (enableOCR && ocrText.trim()) {
        // Add title
        page.drawText('Scanned Document (OCR)', {
          x: margin,
          y: pageHeight - 30,
          size: 14,
          color: rgb(0, 0, 0),
        });

        // Add OCR text (limited to avoid overflow)
        const maxChars = 2000;
        const truncatedText = ocrText.length > maxChars
          ? ocrText.substring(0, maxChars) + '...'
          : ocrText;

        const lines = truncatedText.split('\n').slice(0, 20); // Limit lines
        let textY = pageHeight - 60;

        lines.forEach((line) => {
          if (textY > 50) {
            // Wrap long lines
            const maxLineLength = 80;
            const wrappedLines = [];

            for (let i = 0; i < line.length; i += maxLineLength) {
              wrappedLines.push(line.substring(i, i + maxLineLength));
            }

            wrappedLines.forEach((wrappedLine) => {
              if (textY > 50) {
                page.drawText(wrappedLine, {
                  x: margin,
                  y: textY,
                  size: 8,
                  color: rgb(0.7, 0.7, 0.7), // Light gray for OCR text
                });
                textY -= 12;
              }
            });
          }
        });
      }

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('Scan conversion error:', conversionError);
      throw new Error('Failed to convert scan to PDF');
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
      filename: `${file.name.replace(/\.(jpg|jpeg|png|tiff|bmp)$/i, '.pdf')}`,
      base64: base64,
      message: `Scan converted to PDF successfully${enableOCR ? ' with OCR' : ''}`,
      ocrText: enableOCR ? ocrText.substring(0, 500) : undefined // Preview of OCR text
    });

  } catch (error) {
    console.error('Scan to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert scan to PDF' },
      { status: 500 }
    );
  }
}

function rgb(r: number, g: number, b: number) {
  return { r: r / 255, g: g / 255, b: b / 255 };
}