import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';

interface PageOperation {
  type: 'move' | 'delete' | 'rotate';
  from?: number;
  to?: number;
  page?: number;
  degrees?: number;
}

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const operations = formData.get('operations') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!operations) {
      return NextResponse.json({ error: 'No operations specified' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-organized.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);

      // Parse operations
      const pageOps: PageOperation[] = JSON.parse(operations);
      const pageCount = pdfDoc.getPageCount();

      // Apply page operations
      for (const op of pageOps) {
        switch (op.type) {
          case 'rotate':
            if (op.page !== undefined && op.degrees) {
              const pageIndex = op.page - 1; // Convert to 0-based index
              if (pageIndex >= 0 && pageIndex < pageCount) {
                const page = pdfDoc.getPage(pageIndex);
                page.setRotation({
                  type: page.getRotation().type,
                  degrees: op.degrees
                });
              }
            }
            break;

          case 'delete':
            if (op.page !== undefined) {
              const pageIndex = op.page - 1; // Convert to 0-based index
              if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
                pdfDoc.removePage(pageIndex);
              }
            }
            break;

          case 'move':
            // Move operation - this is complex with pdf-lib
            // For now, we'll focus on rotate and delete
            console.warn('Move operation not fully implemented yet');
            break;
        }
      }

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('PDF organization error:', conversionError);
      throw new Error('Failed to organize PDF');
    } finally {
      // Clean up input file
      try {
        await unlink(inputPath);
      } catch (error) {
        console.error('Failed to clean up input file:', error);
      }
    }

    // Read the output file for base64 encoding
    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      filename: `${file.name.replace('.pdf', '-organized.pdf')}`,
      base64: base64,
      message: 'PDF organized successfully'
    });

  } catch (error) {
    console.error('PDF organization error:', error);
    return NextResponse.json(
      { error: 'Failed to organize PDF' },
      { status: 500 }
    );
  }
}