import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

<<<<<<< HEAD
export const runtime = 'nodejs';
=======
export const runtime = 'edge';
>>>>>>> main

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface MergeRequest {
  files: Array<{
    name: string;
    data: string; // Base64 encoded
  }>;
  outputName?: string;
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    let files: Array<{ name: string; data: string } | File>;
    let outputName: string | undefined;

    if (contentType?.includes('application/json')) {
      const body: MergeRequest = await request.json();
      if (!body.files || body.files.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }
      if (body.files.length > 20) {
        return NextResponse.json({ error: 'Maximum 20 files can be merged at once' }, { status: 400 });
      }
      files = body.files;
      outputName = body.outputName;
    } else {
      const formData = await request.formData();
      const uploadedFiles = formData.getAll('files') as File[];
      if (!uploadedFiles || uploadedFiles.length === 0) {
        return NextResponse.json({ error: 'No files provided' }, { status: 400 });
      }
      if (uploadedFiles.length > 20) {
        return NextResponse.json({ error: 'Maximum 20 files can be merged at once' }, { status: 400 });
      }
      files = uploadedFiles;
      outputName = formData.get('outputName') as string;
    }

    const pdfDocs = [];
    for (const file of files) {
      try {
        const isJsonRequest = 'data' in file;
        const buffer = isJsonRequest ? Buffer.from(file.data, 'base64') : await (file as File).arrayBuffer();
        const pdfDoc = await PDFDocument.load(buffer);
        pdfDocs.push({
          doc: pdfDoc,
          name: file.name
        });
      } catch (error) {
        return NextResponse.json({ error: `Invalid PDF file: ${file.name}` }, { status: 400 });
      }
    }

    if (pdfDocs.length === 0) {
      return NextResponse.json({ error: 'No valid PDF files found' }, { status: 400 });
    }

    const mergedPdf = await PDFDocument.create();
    let totalPages = 0;
    for (const { doc } of pdfDocs) {
      const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
      totalPages += doc.getPageCount();
    }

    const finalOutputName = outputName || `merged_${uuid()}.pdf`;
    mergedPdf.setTitle(finalOutputName.replace(/\.pdf$/, ''));
    mergedPdf.setProducer('PDFPro.pro');
    mergedPdf.setCreator('PDFPro.pro');

    const pdfBytes = await mergedPdf.save();

<<<<<<< HEAD
    const blob = await put(finalOutputName, Buffer.from(pdfBytes), {
=======
    const blob = await put(finalOutputName, pdfBytes, {
>>>>>>> main
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      success: true,
      message: 'PDFs merged successfully',
      ...blob,
      size: pdfBytes.length,
      totalPages,
      filesMerged: files.length,
    });

  } catch (error) {
    console.error('PDF merge error:', error);
    const message = error instanceof Error ? error.message : 'Failed to merge PDF files';
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
