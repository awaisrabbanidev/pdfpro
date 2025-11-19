<<<<<<< HEAD
export const runtime = 'nodejs';
=======
export const runtime = 'edge';
>>>>>>> main
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, unlink } from 'fs/promises';
import { join } from 'path';
import { ensureDirectories, getDirectories } from '@/lib/api-config';
import puppeteer from 'puppeteer';

export async function POST(request: NextRequest) {
  try {
    ensureDirectories();
    const dirs = getDirectories();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const htmlContent = formData.get('htmlContent') as string;

    let html = '';

    if (file) {
      // Handle uploaded HTML file
      if (!file.type.includes('text/html') && !file.name.endsWith('.html') && !file.name.endsWith('.htm')) {
        return NextResponse.json({
          error: 'Invalid file type. Please upload an HTML file.'
        }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      html = buffer.toString('utf-8');
    } else if (htmlContent) {
      // Handle direct HTML content
      html = htmlContent;
    } else {
      return NextResponse.json({
        error: 'Please provide either an HTML file or HTML content.'
      }, { status: 400 });
    }

    const timestamp = Date.now();
    const outputPath = join(dirs.OUTPUTS, `${timestamp}-html-to.pdf`);

    try {
      // Launch Puppeteer for HTML to PDF conversion
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      const page = await browser.newPage();

      // Set content and wait for it to load
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        preferCSSPageSize: true
      });

      await browser.close();

      // Write PDF to file
      await writeFile(outputPath, pdfBuffer);

    } catch (conversionError) {
      console.error('HTML conversion error:', conversionError);
      throw new Error('Failed to convert HTML to PDF');
    }

    // Read the output file for base64 encoding
    const outputBuffer = await readFile(outputPath);
    const base64 = outputBuffer.toString('base64');

    const filename = file
      ? `${file.name.replace(/\.(html?|htm)$/i, '.pdf')}`
      : `${timestamp}-html-to.pdf`;

    return NextResponse.json({
      success: true,
      filename: filename,
      base64: base64,
      message: 'HTML content converted to PDF successfully'
    });

  } catch (error) {
    console.error('HTML to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert HTML to PDF' },
      { status: 500 }
    );
  }
}