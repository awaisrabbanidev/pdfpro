import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFPermissions } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface ProtectOptions {
  userPassword?: string;
  ownerPassword?: string;
  permissions?: (keyof typeof PDFPermissions)[];
}

async function applyProtection(pdfBuffer: Buffer, options: ProtectOptions): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const permissions: { [K in keyof typeof PDFPermissions]?: boolean } = {};
  if (options.permissions) {
    for (const p of options.permissions) {
      if (p in PDFPermissions) {
        permissions[p] = true;
      }
    }
  }

  pdfDoc.setProducer('PDFPro.pro');
  pdfDoc.setCreator('PDFPro.pro');

  await pdfDoc.encrypt({
    userPassword: options.userPassword,
    ownerPassword: options.ownerPassword,
    permissions: permissions,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const options = JSON.parse(formData.get('options') as string) as ProtectOptions;

    if (!file || !options) {
      return NextResponse.json({ error: 'Missing file or protection options' }, { status: 400 });
    }

    if (!options.userPassword && !options.ownerPassword) {
        return NextResponse.json({ error: 'At least one password is required' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const protectedPdfBuffer = await applyProtection(pdfBuffer, options);

    const filename = `protected-${file.name}`;
    const blob = await put(filename, protectedPdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to protect PDF: ${message}` }, { status: 500 });
  }
}
