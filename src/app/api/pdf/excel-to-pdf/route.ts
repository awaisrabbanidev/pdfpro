export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { ensureTempDirs, OUTPUTS_DIR, UPLOADS_DIR } from '@/lib/temp-dirs';
import * as XLSX from 'xlsx';

// Ensure directories exist
async function ensureDirectories() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    await mkdir(OUTPUTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

export async function POST(request: NextRequest) {
  ensureTempDirs();
  await ensureDirectories();

  try {
    const contentType = request.headers.get('content-type');
    let buffer: Buffer;
    let originalFilename: string;

    if (contentType?.includes('application/json')) {
      const body = await request.json();

      if (!body.file || !body.file.data) {
        return NextResponse.json(
          { error: 'No file provided' },
          { status: 400 }
        );
      }

      buffer = Buffer.from(body.file.data, 'base64');
      originalFilename = body.file.name;
    } else {
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
      }

      if (file.type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' &&
          file.type !== 'application/vnd.ms-excel') {
        return NextResponse.json({ error: 'Invalid file type. Please upload an Excel file.' }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
      originalFilename = file.name;
    }

    const timestamp = Date.now();
    const inputPath = join(UPLOADS_DIR, `${timestamp}-${originalFilename}`);
    const outputPath = join(OUTPUTS_DIR, `${timestamp}-converted.pdf`);

    await writeFile(inputPath, buffer);

    try {
      // Read the Excel file
      const inputBuffer = await readFile(inputPath);
      const workbook = XLSX.read(inputBuffer, { type: 'buffer' });

      // Convert to PDF using pdf-lib
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.create();

      // Process each worksheet
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Create a page for each worksheet
        const page = pdfDoc.addPage([595.28, 841.89]); // A4 size

        // Add worksheet title
        page.drawText(`Worksheet: ${sheetName}`, {
          x: 50,
          y: 800,
          size: 16,
          color: rgb(0, 0, 0),
        });

        // Add worksheet data
        let yPosition = 750;
        const lineHeight = 20;

        data.forEach((row: any, rowIndex: number) => {
          if (yPosition < 50) {
            // Add new page if space runs out
            const newPage = pdfDoc.addPage([595.28, 841.89]);
            yPosition = 750;
          }

          if (Array.isArray(row)) {
            const rowText = row.map(cell => String(cell || '')).join('\t');
            page.drawText(rowText, {
              x: 50,
              y: yPosition,
              size: 10,
              color: rgb(0, 0, 0),
            });
            yPosition -= lineHeight;
          }
        });
      });

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('Excel conversion error:', conversionError);
      throw new Error('Failed to convert Excel to PDF');
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
      message: 'Excel file converted to PDF successfully',
      filename: `${originalFilename.replace(/\.(xlsx|xls)$/, '.pdf')}`,
      data: base64
    });

  } catch (error) {
    console.error('Excel to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert Excel to PDF' },
      { status: 500 }
    );
  }
}

function rgb(r: number, g: number, b: number) {
  return { r: r / 255, g: g / 255, b: b / 255 };
}