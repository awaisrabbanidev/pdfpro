import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const angleStr = formData.get('angle') as string;

    if (!file || !angleStr) {
      return NextResponse.json({ error: 'Missing file or rotation angle' }, { status: 400 });
    }

    const angle = parseInt(angleStr) as 90 | 180 | 270;
    if (![90, 180, 270].includes(angle)) {
        return NextResponse.json({ error: 'Rotation angle must be 90, 180, or 270' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBuffer);

    pdfDoc.getPages().forEach(page => {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees(currentRotation + angle));
    });

    const pdfBytes = await pdfDoc.save();
    const filename = `rotated-${file.name}`;

    const blob = await put(filename, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('PDF rotation error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during rotation';
    return NextResponse.json({ error: `Failed to rotate PDF: ${message}` }, { status: 500 });
  }
}
