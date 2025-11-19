import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';
import type { PutBlobResult } from '@vercel/blob';

export const runtime = 'nodejs';

interface SplitRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  splitType: 'single' | 'range' | 'every';
  splitOption?: {
    pages?: number[]; // For single/range
    every?: number; // For every N pages
    range?: string; // Range string like "1-5,8,10-12"
  };
}

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

  const blob = await put(filename, pdfBytes, {
    access: 'public',
    contentType: 'application/pdf',
    addRandomSuffix: false,
  });

  return blob;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let buffer: ArrayBuffer;
    let originalFilename: string;
    let splitType: SplitRequest['splitType'];
    let splitOption: SplitRequest['splitOption'];

    if (contentType?.includes('application/json')) {
      const body: SplitRequest = await request.json();
      if (!body.file || !body.file.data) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      if (!body.splitType) {
        return NextResponse.json({ error: 'Split type is required' }, { status: 400 });
      }
      buffer = Buffer.from(body.file.data, 'base64');
      originalFilename = body.file.name;
      splitType = body.splitType;
      splitOption = body.splitOption;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const type = formData.get('splitType') as string;
      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }
      if (!type) {
        return NextResponse.json({ error: 'Split type is required' }, { status: 400 });
      }
      buffer = await file.arrayBuffer();
      originalFilename = file.name;
      splitType = type as SplitRequest['splitType'];
      if (splitType === 'range') {
        const pages = formData.get('pages') as string;
        const range = formData.get('range') as string;
        splitOption = {
          pages: pages ? pages.split(',').map(p => parseInt(p.trim())) : undefined,
          range: range || undefined
        };
      } else if (splitType === 'every') {
        const every = formData.get('every') as string;
        splitOption = { every: every ? parseInt(every) : undefined };
      }
    }

    let sourcePdf: PDFDocument;
    try {
      sourcePdf = await PDFDocument.load(buffer);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid PDF file' }, { status: 400 });
    }

    const totalPages = sourcePdf.getPageCount();
    const baseName = originalFilename.replace(/\.pdf$/i, '');

    if (totalPages === 0) {
      return NextResponse.json({ error: 'PDF file has no pages' }, { status: 400 });
    }

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
        if (!splitOption?.pages && !splitOption?.range) {
          return NextResponse.json({ error: 'Page selection is required for range split' }, { status: 400 });
        }
        let pageIndices = (splitOption.range ? parseRangeString(splitOption.range) : splitOption.pages || []).map(p => p - 1);
        const validIndices = pageIndices.filter(index => index >= 0 && index < totalPages);
        if (validIndices.length === 0) {
          return NextResponse.json({ error: 'No valid pages selected' }, { status: 400 });
        }
        const blob = await createPdfFromPages(sourcePdf, validIndices, baseName, 'selected_pages');
        results.push({ ...blob, pages: validIndices.length });
        break;
      }
      case 'every': {
        const every = splitOption?.every || 1;
        if (every < 1 || every > totalPages) {
          return NextResponse.json({ error: `Invalid "every" value: ${every}` }, { status: 400 });
        }
        for (let i = 0; i < totalPages; i += every) {
          const endIndex = Math.min(i + every, totalPages);
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

    return NextResponse.json({
      success: true,
      message: 'PDF split successfully',
      data: {
        originalPages: totalPages,
        filesCreated: results.length,
        files: results
      }
    });
  } catch (error) {
    console.error('PDF split error:', error);
    const message = error instanceof Error ? error.message : 'Failed to split PDF file';
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
