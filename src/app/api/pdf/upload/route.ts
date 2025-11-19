import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

<<<<<<< HEAD
export const runtime = 'nodejs'; // Can use edge runtime now
=======
export const runtime = 'edge'; // Can use edge runtime now
>>>>>>> main

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.formData();
    const file = data.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const uniqueFilename = `${Date.now()}-${file.name}`;

    const blob = await put(uniqueFilename, file, {
      access: 'public',
      addRandomSuffix: false, // Keep our unique name
    });

    return NextResponse.json({
      success: true,
      ...blob, // Includes url, pathname, contentType, contentDisposition
      originalFilename: file.name,
      size: file.size,
    });
  } catch (err) {
    console.error('Upload error:', err);
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
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
