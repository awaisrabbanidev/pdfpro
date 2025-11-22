import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length < 2) {
      return NextResponse.json({ error: 'Please provide at least two PDF files to merge.' }, { status: 400 });
    }

    const mergedPdf = await PDFDocument.create();
    mergedPdf.setProducer('PDFPro.pro');
    mergedPdf.setCreator('PDFPro.pro');

    for (const file of files) {
        if (file.type !== 'application/pdf') {
            console.warn(`Skipping non-PDF file: ${file.name}`);
            continue;
        }
      const pdfBuffer = Buffer.from(await file.arrayBuffer());
      const sourcePdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    if (mergedPdf.getPageCount() === 0) {
        return NextResponse.json({ error: 'No valid PDF pages found to merge.' }, { status: 400 });
    }

    const finalOutputName = `pdfpro-merged-${Date.now()}.pdf`;
    const pdfBytes = await mergedPdf.save();

    const blob = await put(finalOutputName, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('PDF merge error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during merging.';
    return NextResponse.json({ error: `Failed to merge files: ${message}` }, { status: 500 });
  }
}
