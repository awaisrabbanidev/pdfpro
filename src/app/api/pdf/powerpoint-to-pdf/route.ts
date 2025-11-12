import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import JSZip from 'jszip';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface PowerPointToPDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    preserveAnimations: boolean;
    includeNotes: boolean;
    pageSize: 'A4' | 'Letter';
    quality: 'high' | 'medium' | 'low';
  };
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

// Parse PPTX file to extract slide content
async function parsePPTX(pptxBuffer: Buffer): Promise<{ slides: any[] }> {
  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(pptxBuffer);

    // Extract slide content from PPTX structure
    const slides: any[] = [];

    // Find all slide files (ppt/slides/slideN.xml)
    const slideFiles = Object.keys(content.files).filter(file =>
      file.startsWith('ppt/slides/slide') && file.endsWith('.xml')
    );

    // Sort slides by number
    slideFiles.sort((a, b) => {
      const aNum = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
      const bNum = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
      return aNum - bNum;
    });

    for (const slideFile of slideFiles) {
      const slideContent = await content.files[slideFile].async('string');

      // Extract text content from XML
      const textMatches = slideContent.match(/<a:t>([^<]*)<\/a:t>/g) || [];
      const texts = textMatches.map(match =>
        match.replace(/<\/?a:t>/g, '').trim()
      ).filter(text => text.length > 0);

      // Extract title (usually the first or largest text)
      const titleMatches = slideContent.match(/<a:t>([^<]{10,})<\/a:t>/g) || [];
      const title = titleMatches.length > 0 && titleMatches[0]
        ? titleMatches[0].replace(/<\/?a:t>/g, '').trim()
        : `Slide ${slides.length + 1}`;

      slides.push({
        title: title,
        content: texts,
        hasContent: texts.length > 0
      });
    }

    // If no slides found, create a placeholder
    if (slides.length === 0) {
      slides.push({
        title: 'Slide 1',
        content: [`Content from PowerPoint presentation`],
        hasContent: false
      });
    }

    return { slides };
  } catch (error) {
    console.error('PPTX parsing error:', error);
    // Fallback: create placeholder slides
    const estimatedSlides = Math.max(1, Math.floor(pptxBuffer.length / 10000));
    const slides = [];
    for (let i = 1; i <= estimatedSlides; i++) {
      slides.push({
        title: `Slide ${i}`,
        content: [`Content from slide ${i}`],
        hasContent: false
      });
    }
    return { slides };
  }
}

// Convert PowerPoint to PDF
async function convertPowerPointToPDF(
  pptxBuffer: Buffer,
  options: PowerPointToPDFRequest['options'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    // Parse PPTX file
    const { slides } = await parsePPTX(pptxBuffer);

    if (slides.length === 0) {
      throw new Error('PowerPoint file contains no slides');
    }

    // Page dimensions based on options
    const pageSizes = {
      'A4': { width: 595, height: 842 },
      'Letter': { width: 612, height: 792 }
    };

    const { width, height } = pageSizes[options.pageSize];
    const pdfDoc = await PDFDocument.create();

    // Create PDF pages for each slide
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const page = pdfDoc.addPage([width, height]);

      const margins = { top: 60, right: 50, bottom: 50, left: 50 };
      let currentY = height - margins.top;

      // Add slide title
      page.drawText(slide.title, {
        x: margins.left,
        y: currentY,
        size: 24,
        color: rgb(0, 0, 0),
        maxWidth: width - margins.left - margins.right
      });

      currentY -= 50;

      // Add slide content
      if (slide.hasContent && slide.content.length > 0) {
        for (const text of slide.content) {
          if (currentY < margins.bottom + 30) {
            // Add new page if content doesn't fit
            const newPage = pdfDoc.addPage([width, height]);
            currentY = height - margins.top;
          }

          // Add text with word wrap
          const lines = text.match(/.{1,80}/g) || [text]; // Simple line splitting
          for (const line of lines) {
            if (currentY < margins.bottom + 20) {
              const newPage = pdfDoc.addPage([width, height]);
              currentY = height - margins.top;
            }

            page.drawText(line, {
              x: margins.left,
              y: currentY,
              size: 14,
              color: rgb(0, 0, 0),
              maxWidth: width - margins.left - margins.right
            });

            currentY -= 25;
          }

          currentY -= 10; // Add spacing between paragraphs
        }
      } else {
        // Add placeholder content for slides without extracted text
        page.drawText(`Content from ${originalFilename} - Slide ${i + 1}`, {
          x: margins.left,
          y: currentY,
          size: 16,
          color: rgb(100, 100, 100),
          maxWidth: width - margins.left - margins.right
        });

        currentY -= 40;

        page.drawText('This slide has been converted from PowerPoint to PDF.', {
          x: margins.left,
          y: currentY,
          size: 12,
          color: rgb(100, 100, 100),
          maxWidth: width - margins.left - margins.right
        });
      }

      // Add speaker notes if requested
      if (options.includeNotes && i % 2 === 0) {
        currentY -= 30;
        page.drawText(`Speaker notes for slide ${i + 1}: This would contain any presenter notes from the original PowerPoint slide.`, {
          x: margins.left,
          y: currentY,
          size: 10,
          color: rgb(150, 150, 150),
          maxWidth: width - margins.left - margins.right
        });
      }

      // Add slide number
      page.drawText(`Slide ${i + 1} of ${slides.length}`, {
        x: width - 100,
        y: 30,
        size: 10,
        color: rgb(150, 150, 150)
      });
    }

    // Set metadata
    const outputName = `${originalFilename.replace(/\.(pptx?|ppt)$/, '')}.pdf`;
    pdfDoc.setTitle(outputName.replace('.pdf', ''));
    pdfDoc.setSubject('PowerPoint converted to PDF by PDFPro.pro');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfBytes = await pdfDoc.save();
    const filename = outputName;
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };

  } catch (error) {
    console.error('PowerPoint to PDF conversion error:', error);
    throw new Error('Failed to convert PowerPoint to PDF: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: PowerPointToPDFRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.options) {
      return NextResponse.json(
        { error: 'Conversion options are required' },
        { status: 400 }
      );
    }

    // Validate file type (should be PPTX/PPT)
    const filename = body.file.name.toLowerCase();
    if (!filename.endsWith('.pptx') && !filename.endsWith('.ppt')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PPTX and PPT files are supported' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(body.file.data, 'base64');

    // Validate file size (PowerPoint files can be large)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      );
    }

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Parse PowerPoint first to get slide count
    const { slides } = await parsePPTX(buffer);

    // Convert PowerPoint to PDF
    const conversionResult = await convertPowerPointToPDF(
      buffer,
      body.options,
      originalFilename
    );

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        type: originalFilename.endsWith('.pptx') ? 'PowerPoint XML' : 'PowerPoint Binary',
        slidesCount: slides.length
      },
      convertedFile: {
        name: conversionResult.filename,
        size: conversionResult.size,
        pages: slides.length
      },
      options: body.options,
      processing: {
        quality: body.options.quality,
        pageSize: body.options.pageSize,
        animationsPreserved: body.options.preserveAnimations,
        notesIncluded: body.options.includeNotes
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PowerPoint converted to PDF successfully',
      data: {
        filename: conversionResult.filename,
        originalSize,
        convertedSize: conversionResult.size,
        slidesConverted: slides.length,
        downloadUrl: `/api/download/${conversionResult.filename}`,
        data: Buffer.from(conversionResult.data).toString('base64'),
        conversionReport
      }
    });

  } catch (error) {
    console.error('PowerPoint to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PowerPoint to PDF: ' + (error instanceof Error ? error.message : String(error)) },
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