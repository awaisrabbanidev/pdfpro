import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface EditOperation {
  type: 'add-text' | 'add-image' | 'highlight' | 'underline' | 'strikeout';
  page: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  color?: string;
  imageData?: string; // Base64 encoded image
}

async function applyEdits(pdfBuffer: Buffer, operations: EditOperation[]): Promise<Buffer> {
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const pages = pdfDoc.getPages();

  for (const op of operations) {
    if (op.page < 1 || op.page > pages.length) continue;
    const page = pages[op.page - 1];

    const color = op.color ? parseColor(op.color) : rgb(0, 0, 0);

    switch (op.type) {
      case 'add-text':
        if (op.text && op.x && op.y) {
          page.drawText(op.text, {
            x: op.x,
            y: page.getHeight() - op.y - (op.fontSize || 12),
            size: op.fontSize || 12,
            font: await pdfDoc.embedFont(StandardFonts.Helvetica),
            color,
          });
        }
        break;

      case 'add-image':
        if (op.imageData && op.x && op.y && op.width && op.height) {
          const imageBytes = Buffer.from(op.imageData.split(',')[1], 'base64');
          const image = op.imageData.startsWith('data:image/png')
            ? await pdfDoc.embedPng(imageBytes)
            : await pdfDoc.embedJpg(imageBytes);
          page.drawImage(image, {
            x: op.x,
            y: page.getHeight() - op.y - op.height,
            width: op.width,
            height: op.height,
          });
        }
        break;

      case 'highlight':
        if (op.x && op.y && op.width && op.height) {
          page.drawRectangle({
            x: op.x,
            y: page.getHeight() - op.y - op.height,
            width: op.width,
            height: op.height,
            color: rgb(1, 1, 0), // Yellow
            opacity: 0.3,
          });
        }
        break;

      case 'underline':
        if (op.x && op.y && op.width) {
            const y = page.getHeight() - op.y - 2;
            page.drawLine({
                start: { x: op.x, y },
                end: { x: op.x + op.width, y },
                thickness: 1,
                color,
            });
        }
        break;

      case 'strikeout':
        if (op.x && op.y && op.width && op.height) {
            const y = page.getHeight() - op.y - (op.height / 2);
            page.drawLine({
                start: { x: op.x, y },
                end: { x: op.x + op.width, y },
                thickness: 1,
                color,
            });
        }
        break;
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
    const operations = JSON.parse(formData.get('operations') as string) as EditOperation[];

    if (!file || !operations) {
      return NextResponse.json({ error: 'Missing file or operations' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const editedPdfBuffer = await applyEdits(pdfBuffer, operations);

    const filename = `edited-${file.name}`;
    const blob = await put(filename, editedPdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to edit PDF: ${message}` }, { status: 500 });
  }
}
