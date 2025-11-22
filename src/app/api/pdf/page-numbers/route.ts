import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface PageNumberSettings {
  position: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  format: '1' | 'Page 1' | '1 of N' | 'Page 1 of N';
  startFrom: number;
  fontSize: number;
  color: string;
  margin: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settingsJSON = formData.get('settings') as string;

    if (!file || !settingsJSON) {
      return NextResponse.json({ error: 'Missing file or page number settings' }, { status: 400 });
    }

    const settings = JSON.parse(settingsJSON) as PageNumberSettings;
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    const font = await pdfDoc.embedFont('Helvetica');

    for (let i = 0; i < pageCount; i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        const pageNum = settings.startFrom + i;

        let pageText = '';
        switch (settings.format) {
            case '1': pageText = `${pageNum}`; break;
            case 'Page 1': pageText = `Page ${pageNum}`; break;
            case '1 of N': pageText = `${pageNum} of ${pageCount}`; break;
            case 'Page 1 of N': pageText = `Page ${pageNum} of ${pageCount}`; break;
        }

        const textWidth = font.widthOfTextAtSize(pageText, settings.fontSize);
        let x, y;

        switch (settings.position) {
            case 'top-left': x = settings.margin; y = height - settings.margin; break;
            case 'top-center': x = (width - textWidth) / 2; y = height - settings.margin; break;
            case 'top-right': x = width - settings.margin - textWidth; y = height - settings.margin; break;
            case 'bottom-left': x = settings.margin; y = settings.margin; break;
            case 'bottom-center': x = (width - textWidth) / 2; y = settings.margin; break;
            case 'bottom-right': x = width - settings.margin - textWidth; y = settings.margin; break;
        }

        const hex = settings.color.replace('#', '');
        const color = rgb(
            parseInt(hex.substring(0, 2), 16) / 255,
            parseInt(hex.substring(2, 4), 16) / 255,
            parseInt(hex.substring(4, 6), 16) / 255
        );

        page.drawText(pageText, { x, y, size: settings.fontSize, font, color });
    }

    const pdfBytes = await pdfDoc.save();
    const filename = `page-numbered-${file.name}`;
    const blob = await put(filename, Buffer.from(pdfBytes), { access: 'public', contentType: 'application/pdf' });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('Page numbers error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error while adding page numbers';
    return NextResponse.json({ error: `Failed to add page numbers: ${message}` }, { status: 500 });
  }
}
