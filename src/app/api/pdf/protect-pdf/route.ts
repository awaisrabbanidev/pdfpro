import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';

interface ProtectionSettings {
  password: string;
  userPassword?: string;
  ownerPassword?: string;
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
  };
}

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settings = formData.get('settings') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!settings) {
      return NextResponse.json({ error: 'No protection settings specified' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const timestamp = Date.now();
    const inputPath = join(dirs.UPLOADS, `${timestamp}-${file.name}`);
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-protected.pdf`);

    await writeFile(inputPath, buffer);

    try {
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(buffer);

      const protectionSettings: ProtectionSettings = JSON.parse(settings);

      // Validate password
      if (!protectionSettings.password || protectionSettings.password.length < 4) {
        throw new Error('Password must be at least 4 characters long');
      }

      // Set permissions
      const permissions = {
        printing: protectionSettings.permissions.printing,
        modifying: protectionSettings.permissions.modifying,
        copying: protectionSettings.permissions.copying,
        annotating: protectionSettings.permissions.annotating,
        fillingForms: false,
        contentAccessibility: true,
        documentAssembly: false,
      };

      // Encrypt the PDF with password protection
      await pdfDoc.encrypt({
        userPassword: protectionSettings.password,
        ownerPassword: protectionSettings.ownerPassword || protectionSettings.password,
        permissions: permissions,
      });

      const pdfBytes = await pdfDoc.save();
      await writeFile(outputPath, pdfBytes);

    } catch (conversionError) {
      console.error('PDF protection error:', conversionError);
      throw new Error('Failed to protect PDF');
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
      filename: `${file.name.replace('.pdf', '-protected.pdf')}`,
      base64: base64,
      message: 'PDF protected successfully'
    });

  } catch (error) {
    console.error('PDF protection error:', error);
    return NextResponse.json(
      { error: 'Failed to protect PDF' },
      { status: 500 }
    );
  }
}