import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

async function fetchAndLoadPdf(url: string): Promise<PDFDocument> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return await PDFDocument.load(arrayBuffer);
}

export async function POST(request: NextRequest) {
  try {
    const { fileUrls } = await request.json();

    if (!Array.isArray(fileUrls) || fileUrls.length < 2) {
      return NextResponse.json({ error: 'Please provide at least two files to merge.' }, { status: 400 });
    }

    const mergedPdf = await PDFDocument.create();
    mergedPdf.setProducer('PDFPro.pro');
    mergedPdf.setCreator('PDFPro.pro');

    for (const url of fileUrls) {
      const sourcePdf = await fetchAndLoadPdf(url);
      const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const finalOutputName = `pdfpro_merged_${Date.now()}.pdf`;
    const pdfBytes = await mergedPdf.save();
    
    const blob = await put(finalOutputName, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      message: 'Files merged successfully!',
      ...blob
    });

  } catch (error) {
    console.error('PDF merge error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred during merging.';
    return NextResponse.json({ error: `Failed to merge files. ${message}` }, { status: 500 });
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
