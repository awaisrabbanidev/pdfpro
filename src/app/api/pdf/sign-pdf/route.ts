import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface Signature {
  type: 'text' | 'image';
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; // For text signatures
  imageData?: string; // For image signatures (Base64)
  fontSize?: number;
  color?: string;
}

async function applySignatures(pdfBuffer: Buffer, signatures: Signature[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  for (const sig of signatures) {
    if (sig.page < 1 || sig.page > pages.length) continue;
    const page = pages[sig.page - 1];
    const color = sig.color ? parseColor(sig.color) : rgb(0, 0, 0);

    if (sig.type === 'text' && sig.content) {
      page.drawText(sig.content, {
        x: sig.x,
        y: page.getHeight() - sig.y - sig.height,
        size: sig.fontSize || 16,
        font: await pdfDoc.embedFont(StandardFonts.Helvetica),
        color,
      });
    } else if (sig.type === 'image' && sig.imageData) {
      const imageBytes = Buffer.from(sig.imageData.split(',')[1], 'base64');
      const image = sig.imageData.startsWith('data:image/png')
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);

      page.drawImage(image, {
        x: sig.x,
        y: page.getHeight() - sig.y - sig.height,
        width: sig.width,
        height: sig.height,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

function parseColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return rgb(r, g, b);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const signatures = JSON.parse(formData.get('signatures') as string) as Signature[];

    if (!file || !signatures || signatures.length === 0) {
      return NextResponse.json({ error: 'Missing file or signatures' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const signedPdfBuffer = await applySignatures(pdfBuffer, signatures);

    const filename = `signed-${file.name}`;
    const blob = await put(filename, signedPdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to sign PDF: ${message}` }, { status: 500 });
  }
}
