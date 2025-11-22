import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, degrees } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface OrganizeOperation {
  type: 'move' | 'delete' | 'rotate';
  page: number; // The original 1-based page number
  to?: number; // For move: the new 1-based position
  degrees?: number; // For rotate
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operationsJSON = formData.get('operations') as string;

    if (!file || !operationsJSON) {
      return NextResponse.json({ error: 'Missing file or operations data' }, { status: 400 });
    }

    const operations = JSON.parse(operationsJSON) as OrganizeOperation[];
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const sourcePdf = await PDFDocument.load(pdfBuffer);
    const pageCount = sourcePdf.getPageCount();

    // 1. Apply rotations to the source document in-place
    operations.filter(op => op.type === 'rotate').forEach(op => {
      if (op.page > 0 && op.page <= pageCount && op.degrees !== undefined) {
        const pageToRotate = sourcePdf.getPage(op.page - 1);
        pageToRotate.rotate(degrees(op.degrees));
      }
    });

    // 2. Determine the final order and which pages to exclude
    let finalPageOrder: number[] = Array.from({ length: pageCount }, (_, i) => i);
    const pagesToDelete = new Set<number>();

    operations.filter(op => op.type === 'delete').forEach(op => {
        if (op.page > 0 && op.page <= pageCount) {
            pagesToDelete.add(op.page - 1);
        }
    });

    finalPageOrder = finalPageOrder.filter(index => !pagesToDelete.has(index));

    operations.filter(op => op.type === 'move').forEach(op => {
        if (op.page > 0 && op.to !== undefined && op.to > 0) {
            const pageToMove = op.page - 1;
            const fromIndex = finalPageOrder.indexOf(pageToMove);
            if (fromIndex > -1) {
                const [item] = finalPageOrder.splice(fromIndex, 1);
                finalPageOrder.splice(op.to - 1, 0, item);
            }
        }
    });

    // 3. Create the new PDF with the pages in the correct order
    const organizedPdf = await PDFDocument.create();
    const copiedPages = await organizedPdf.copyPages(sourcePdf, finalPageOrder);
    copiedPages.forEach(page => organizedPdf.addPage(page));

    organizedPdf.setProducer('PDFPro.pro');
    organizedPdf.setCreator('PDFPro.pro');

    const pdfBytes = await organizedPdf.save();
    const filename = `organized-${file.name}`;
    const blob = await put(filename, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('PDF organization error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error during organization';
    return NextResponse.json({ error: `Failed to organize PDF: ${message}` }, { status: 500 });
  }
}
