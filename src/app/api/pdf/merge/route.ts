import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface MergeRequest {
  files: Array<{
    name: string;
    data: string; // Base64 encoded
  }>;
  outputName?: string;
}

const UPLOAD_DIR = join('/tmp', 'uploads');
const OUTPUT_DIR = join('/tmp', 'outputs');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: MergeRequest = await request.json();

    if (!body.files || body.files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    if (body.files.length > 20) {
      return NextResponse.json(
        { error: 'Maximum 20 files can be merged at once' },
        { status: 400 }
      );
    }

    // Validate and decode files
    const pdfDocs = [];
    for (const file of body.files) {
      try {
        const buffer = Buffer.from(file.data, 'base64');
        const pdfDoc = await PDFDocument.load(buffer);
        pdfDocs.push({
          doc: pdfDoc,
          name: file.name
        });
      } catch (error) {
        return NextResponse.json(
          { error: `Invalid PDF file: ${file.name}` },
          { status: 400 }
        );
      }
    }

    if (pdfDocs.length === 0) {
      return NextResponse.json(
        { error: 'No valid PDF files found' },
        { status: 400 }
      );
    }

    // Create a new PDF document
    const mergedPdf = await PDFDocument.create();

    // Copy all pages from each PDF to the merged document
    let totalPages = 0;
    for (const { doc, name } of pdfDocs) {
      const pages = await mergedPdf.copyPages(doc, doc.getPageIndices());
      pages.forEach((page) => mergedPdf.addPage(page));
      totalPages += doc.getPageCount();
    }

    // Add metadata
    const outputName = body.outputName || `merged_${uuid()}.pdf`;
    mergedPdf.setTitle(outputName.replace('.pdf', ''));
    mergedPdf.setSubject('PDF created by PDFPro.pro Merge Tool');
    mergedPdf.setProducer('PDFPro.pro');
    mergedPdf.setCreator('PDFPro.pro');
    mergedPdf.setCreationDate(new Date());
    mergedPdf.setModificationDate(new Date());

    // Add table of contents if more than 10 pages
    if (totalPages > 10) {
      // Create a simple table of contents
      const tocPdf = await PDFDocument.create();
      const page = tocPdf.addPage([595, 842]); // A4 size

      // Add TOC content
      const { width, height } = page.getSize();
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      let yPosition = height - 50;

      page.drawText('Table of Contents', {
        x: 50,
        y: yPosition,
        size: 18,
        color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
      });

      yPosition -= 40;
      let pageNumber = 1;

      for (const { name } of pdfDocs) {
        if (yPosition < 50) {
          const newPage = tocPdf.addPage([595, 842]);
          yPosition = height - 50;
        }

        page.drawText(`${name} ................... ${pageNumber}`, {
          x: 50,
          y: yPosition,
          size: fontSize,
          color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
        });

        yPosition -= lineHeight;
      }

      // Insert TOC at the beginning
      const tocPages = await mergedPdf.copyPages(tocPdf, tocPdf.getPageIndices());
      tocPages.forEach((page, index) => {
        mergedPdf.insertPage(index, page);
      });
    }

    // Serialize the PDF to bytes
    const pdfBytes = await mergedPdf.save();

    // Save the merged PDF
    const outputPath = join(OUTPUT_DIR, outputName);
    await writeFile(outputPath, pdfBytes);

    // Return success response with file info
    return NextResponse.json({
      success: true,
      message: 'PDFs merged successfully',
      data: {
        filename: outputName,
        size: pdfBytes.length,
        totalPages,
        filesMerged: body.files.length,
        downloadUrl: `/api/download/${outputName}`,
        // Include base64 data for immediate preview
        data: Buffer.from(pdfBytes).toString('base64')
      }
    });

  } catch (error) {
    console.error('PDF merge error:', error);
    return NextResponse.json(
      { error: 'Failed to merge PDF files' },
      { status: 500 }
    );
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