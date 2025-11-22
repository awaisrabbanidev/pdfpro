import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No image files uploaded' }, { status: 400 });
    }

    const pdfDoc = await PDFDocument.create();

    for (const file of files) {
        if (!file.type.startsWith('image/')) {
            console.warn(`Skipping non-image file: ${file.name}`);
            continue;
        }

      const imageBuffer = Buffer.from(await file.arrayBuffer());
      const image = file.type === 'image/png'
          ? await pdfDoc.embedPng(imageBuffer)
          : await pdfDoc.embedJpg(imageBuffer);

      const page = pdfDoc.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }

    if (pdfDoc.getPageCount() === 0) {
        return NextResponse.json({ error: 'No valid image files found to convert.' }, { status: 400 });
    }

    const pdfBytes = await pdfDoc.save();
    const filename = `converted-images-${Date.now()}.pdf`;
    const blob = await put(filename, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('Image to PDF conversion error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during conversion';
    return NextResponse.json({ error: `Failed to convert images to PDF: ${message}` }, { status: 500 });
  }
}
