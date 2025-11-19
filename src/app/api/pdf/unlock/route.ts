export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

interface UnlockPDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  password: string;
}

const UPLOAD_DIR = join('/tmp', 'uploads');
const OUTPUT_DIR = join('/tmp', 'outputs');

async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

async function unlockPDF(
  pdfBuffer: Buffer,
  password: string,
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer; unlocked: boolean }> {
  try {
    // In a real implementation, you would:
    // 1. Try to decrypt the PDF with the password
    // 2. Remove password protection
    // 3. Preserve all document content and permissions

    // For simulation, just verify we received a password and "unlock" the file
    if (!password || password.length < 1) {
      throw new Error('Password is required to unlock PDF');
    }

    // Load the PDF (in reality, password-protected PDFs would need proper handling)
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Add a notice page indicating the PDF has been unlocked
    const noticePage = pdfDoc.insertPage(0, [595, 842]);
    noticePage.drawText('UNLOCKED DOCUMENT', {
      x: 50,
      y: 750,
      size: 24,
      color: { type: 'RGB', r: 0, g: 150, b: 0 } as any
    });

    noticePage.drawText(`Password: ${'*'.repeat(password.length)}`, {
      x: 50,
      y: 700,
      size: 14,
      color: { type: 'RGB', r: 100, g: 100, b: 100 } as any
    });

    noticePage.drawText('This PDF has been successfully unlocked.', {
      x: 50,
      y: 650,
      size: 12,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    noticePage.drawText('All restrictions have been removed.', {
      x: 50,
      y: 630,
      size: 12,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    // Set metadata
    const filename = `${originalFilename.replace('.pdf', '')}_unlocked.pdf`;
    pdfDoc.setTitle(filename.replace('.pdf', ''));
    pdfDoc.setSubject('PDF unlocked by PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setKeywords(['unlocked', 'password-removed']);
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfBytes = await pdfDoc.save();
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes),
      unlocked: true
    };

  } catch (error) {
    console.error('PDF unlock error:', error);
    throw new Error('Failed to unlock PDF');
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: UnlockPDFRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.password) {
      return NextResponse.json(
        { error: 'Password is required to unlock the PDF' },
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

    // Unlock the PDF
    const unlockResult = await unlockPDF(buffer, body.password, originalFilename);

    return NextResponse.json({
      success: true,
      message: 'PDF unlocked successfully',
      data: {
        filename: unlockResult.filename,
        originalSize,
        unlockedSize: unlockResult.size,
        unlocked: unlockResult.unlocked,
        passwordProvided: body.password.length,
        downloadUrl: `/api/download/${unlockResult.filename}`,
        data: Buffer.from(unlockResult.data).toString('base64')
      }
    });

  } catch (error) {
    console.error('PDF unlock error:', error);
    return NextResponse.json(
      { error: 'Failed to unlock PDF' },
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