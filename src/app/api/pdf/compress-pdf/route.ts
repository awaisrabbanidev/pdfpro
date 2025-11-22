import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

function getCompressionOptions(level: string): { useObjectStreams: boolean } {
  switch (level) {
    case 'low':
      return { useObjectStreams: false };
    case 'high':
      return { useObjectStreams: true };
    case 'medium':
    default:
      return { useObjectStreams: true };
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const compressionLevel = formData.get('compressionLevel') as 'low' | 'medium' | 'high';

    if (!file || !compressionLevel) {
      return NextResponse.json({ error: 'Missing file or compression level' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const originalSize = pdfBuffer.length;

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const compressionOptions = getCompressionOptions(compressionLevel);

    const compressedBytes = await pdfDoc.save(compressionOptions);
    const compressedSize = compressedBytes.length;

    const filename = `compressed-${file.name}`;
    const blob = await put(filename, Buffer.from(compressedBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json({
        ...blob,
        originalSize,
        compressedSize
     });

  } catch (error) {
    console.error('PDF compression error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to compress PDF: ${message}` }, { status: 500 });
  }
}
