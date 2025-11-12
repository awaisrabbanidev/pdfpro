import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';

interface EditPDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  edits: Array<{
    type: 'text' | 'image' | 'annotation';
    page: number;
    x: number;
    y: number;
    content: string;
    fontSize?: number;
    color?: string;
  }>;
}


async function editPDF(
  pdfBuffer: Buffer,
  edits: EditPDFRequest['edits'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Group edits by page
    const pageEdits = edits.reduce((acc, edit) => {
      const pageNum = edit.page - 1;
      if (pageNum >= 0 && pageNum < pageCount) {
        if (!acc[pageNum]) acc[pageNum] = [];
        acc[pageNum].push(edit);
      }
      return acc;
    }, {} as Record<number, typeof edits>);

    // Apply edits to each page
    Object.entries(pageEdits).forEach(([pageNum, pageEdits]) => {
      const page = pdfDoc.getPage(parseInt(pageNum));
      const { height } = page.getSize();

      pageEdits.forEach(edit => {
        if (edit.type === 'text') {
          const fontSize = edit.fontSize || 12;
          const y = height - edit.y; // Convert to PDF coordinate system

          page.drawText(edit.content, {
            x: edit.x,
            y: y,
            size: fontSize,
            color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
          });
        }
      });
    });

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_edited.pdf`;
    pdfDoc.setTitle(filename.replace('.pdf', ''));
    pdfDoc.setSubject('PDF edited by PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setKeywords(['edited', 'modified']);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfBytes = await pdfDoc.save();

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PDF edit error:', error);
    throw new Error('Failed to edit PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    // No need to create directories - we return data directly

    const body: EditPDFRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.edits || body.edits.length === 0) {
      return NextResponse.json(
        { error: 'At least one edit is required' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const buffer = Buffer.from(body.file.data, 'base64');

    try {
      const pdfDoc = await PDFDocument.load(buffer);
      if (pdfDoc.getPageCount() === 0) {
        return NextResponse.json(
          { error: 'PDF file has no pages' },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Apply edits
    const editResult = await editPDF(buffer, body.edits, originalFilename);

    // Generate edit report
    const editReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize
      },
      edits: body.edits,
      processing: {
        totalEdits: body.edits.length,
        pagesEdited: [...new Set(body.edits.map(e => e.page))].length,
        editTypes: [...new Set(body.edits.map(e => e.type))]
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF edits applied successfully',
      data: {
        filename: editResult.filename,
        originalSize,
        editedSize: editResult.size,
        editsApplied: body.edits.length,
        downloadUrl: `data:application/pdf;base64,${editResult.data.toString('base64')}`,
        data: editResult.data.toString('base64'),
        editReport
      }
    });

  } catch (error) {
    console.error('PDF edit error:', error);
    return NextResponse.json(
      { error: 'Failed to edit PDF' },
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