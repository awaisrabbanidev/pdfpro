import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';
import type { PutBlobResult } from '@vercel/blob';

export const runtime = 'nodejs';

function parseRangeString(range: string): number[] {
  const pages: number[] = [];
  const parts = range.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map(n => parseInt(n.trim()));
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
      }
    } else {
      const page = parseInt(trimmed);
      if (!isNaN(page)) {
        pages.push(page);
      }
    }
  }
  return [...new Set(pages)];
}

async function createPdfFromPages(
  sourcePdf: PDFDocument,
  pageIndices: number[],
  baseName: string,
  suffix: string
): Promise<PutBlobResult> {
  const newPdf = await PDFDocument.create();
  const pages = await newPdf.copyPages(sourcePdf, pageIndices);
  pages.forEach(page => newPdf.addPage(page));

  newPdf.setTitle(`${baseName} - ${suffix}`);
  newPdf.setSubject('PDF created by PDFPro.pro Split Tool');
  newPdf.setProducer('PDFPro.pro');
  newPdf.setCreator('PDFPro.pro');

  const pdfBytes = await newPdf.save();
  const filename = `${baseName}_${suffix}.pdf`;

  const blob = await put(filename, Buffer.from(pdfBytes), {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
  });

  return blob;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const splitType = formData.get('splitType') as 'single' | 'range' | 'every';

    if (!file || !splitType) {
      return NextResponse.json({ error: 'Missing file or split type' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const sourcePdf = await PDFDocument.load(pdfBuffer);

    const totalPages = sourcePdf.getPageCount();
    const baseName = file.name.replace(/\.pdf$/i, '');
    const results: Array<PutBlobResult & { pages: number }> = [];

    switch (splitType) {
      case 'single': {
        for (let i = 0; i < totalPages; i++) {
          const blob = await createPdfFromPages(sourcePdf, [i], baseName, `page_${i + 1}`);
          results.push({ ...blob, pages: 1 });
        }
        break;
      }
      case 'range': {
        const range = formData.get('range') as string;
        if (!range) {
          return NextResponse.json({ error: 'Page range is required for range split' }, { status: 400 });
        }
        const pageIndices = parseRangeString(range).map(p => p - 1);
        const validIndices = pageIndices.filter(index => index >= 0 && index < totalPages);
        if (validIndices.length === 0) {
          return NextResponse.json({ error: 'No valid pages selected' }, { status: 400 });
        }
        const blob = await createPdfFromPages(sourcePdf, validIndices, baseName, 'selected_pages');
        results.push({ ...blob, pages: validIndices.length });
        break;
      }
      case 'every': {
        const everyN = parseInt(formData.get('every') as string, 10);
        if (isNaN(everyN) || everyN < 1) {
            return NextResponse.json({ error: 'Invalid number for splitting every N pages' }, { status: 400 });
        }
        for (let i = 0; i < totalPages; i += everyN) {
          const endIndex = Math.min(i + everyN, totalPages);
          const pageIndices = Array.from({ length: endIndex - i }, (_, k) => i + k);
          const suffix = `pages_${i + 1}-${endIndex}`;
          const blob = await createPdfFromPages(sourcePdf, pageIndices, baseName, suffix);
          results.push({ ...blob, pages: pageIndices.length });
        }
        break;
      }
      default:
        return NextResponse.json({ error: 'Invalid split type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, files: results });

  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: `Failed to split PDF: ${message}` }, { status: 500 });
  }
}
