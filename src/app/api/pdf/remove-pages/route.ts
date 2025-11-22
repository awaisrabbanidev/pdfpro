import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

function parsePagesToRemove(pages: string): number[] {
  const pagesToRemove: number[] = [];
  const parts = pages.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pagesToRemove.push(i);
        }
      }
    } else {
      const page = parseInt(trimmed);
      if (!isNaN(page)) {
        pagesToRemove.push(page);
      }
    }
  }
  return [...new Set(pagesToRemove)];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const pagesToRemoveStr = formData.get('pages') as string;

    if (!file || !pagesToRemoveStr) {
      return NextResponse.json({ error: 'Missing file or pages to remove' }, { status: 400 });
    }

    const pagesToRemove = parsePagesToRemove(pagesToRemoveStr);
    if (pagesToRemove.length === 0) {
        return NextResponse.json({ error: 'No valid pages specified for removal' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    const pagesToKeep = Array.from({ length: pageCount }, (_, i) => i + 1)
                           .filter(p => !pagesToRemove.includes(p));

    if (pagesToKeep.length === pageCount) {
        return NextResponse.json({ error: 'No matching pages found to remove.' }, { status: 400 });
    }

    const newPdf = await PDFDocument.create();
    const copiedPageIndices = pagesToKeep.map(p => p - 1);
    const copiedPages = await newPdf.copyPages(pdfDoc, copiedPageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));

    newPdf.setProducer('PDFPro.pro');
    newPdf.setCreator('PDFPro.pro');

    const pdfBytes = await newPdf.save();
    const filename = `removed-pages-${file.name}`;
    const blob = await put(filename, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('PDF remove pages error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error while removing pages';
    return NextResponse.json({ error: `Failed to remove pages: ${message}` }, { status: 500 });
  }
}
