import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename || !request.body) {
    return NextResponse.json({ error: 'No filename or file body provided' }, { status: 400 });
  }

  try {
    const blob = await put(filename, request.body, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error('File upload error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-vercel-filename',
    },
  });
}
5. API Route: src/app/api/pdf/compress/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface CompressRequest {
  file: {
    name: string;
    data: string;
  };
  compressionLevel: 'low' | 'medium' | 'high';
}

function getCompressionSettings(level: string) {
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
    const level = formData.get('compressionLevel') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (!level) {
      return NextResponse.json({ error: 'Compression level is required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const originalFilename = file.name;
    const originalSize = buffer.length;

    const pdfDoc = await PDFDocument.load(buffer);
    const compressionSettings = getCompressionSettings(level);

    const baseName = originalFilename.replace(/\.pdf/gi, '');
    const outputName = `${baseName}_compressed.pdf`;
    
    const compressedBytes = await pdfDoc.save({ useObjectStreams: compressionSettings.useObjectStreams });
    const compressedSize = compressedBytes.length;

    const blob = await put(outputName, Buffer.from(compressedBytes), {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      message: 'PDF compressed successfully',
      ...blob,
      originalSize,
      compressedSize,
      totalPages: pdfDoc.getPageCount(),
    });

  } catch (error) {
    console.error('PDF compression error:', error);
    const message = error instanceof Error ? error.message : 'Failed to compress PDF file';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
