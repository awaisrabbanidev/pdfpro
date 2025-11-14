import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface EditPDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  editOptions: {
    action: 'text' | 'image' | 'annotation' | 'form';
    operations: EditOperation[];
  };
}

interface EditOperation {
  type: 'add-text' | 'replace-text' | 'add-image' | 'highlight' | 'underline' | 'strikeout';
  page: number;
  position?: {
    x: number;
    y: number;
  };
  content?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
  };
  imageData?: string; // Base64 encoded image
  area?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

const UPLOAD_DIR = join(process.cwd(), 'uploads');
const OUTPUT_DIR = join(process.cwd(), 'outputs');

// Ensure directories exist
async function ensureDirectories() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    await mkdir(OUTPUT_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Edit PDF function
async function editPDF(
  pdfBuffer: Buffer,
  editOptions: EditPDFRequest['editOptions'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Process each edit operation
    for (const operation of editOptions.operations) {
      const pageIndex = operation.page - 1; // Convert to 0-based index

      if (pageIndex < 0 || pageIndex >= pageCount) {
        console.warn(`Invalid page number: ${operation.page}. Skipping operation.`);
        continue;
      }

      const page = pdfDoc.getPages()[pageIndex];

      switch (operation.type) {
        case 'add-text':
          if (operation.content && operation.position) {
            page.drawText(operation.content, {
              x: operation.position.x,
              y: operation.position.y,
              size: operation.style?.fontSize || 12,
              color: parseColor(operation.style?.color || '#000000'),
              bold: operation.style?.bold || false,
              italic: operation.style?.italic || false,
            });
          }
          break;

        case 'highlight':
          if (operation.area) {
            page.drawRectangle({
              x: operation.area.x,
              y: operation.area.y,
              width: operation.area.width,
              height: operation.area.height,
              color: { type: 'RGB', r: 1, g: 1, b: 0 }, // Yellow highlight
              opacity: 0.3,
            });
          }
          break;

        case 'underline':
          if (operation.area) {
            page.drawLine({
              start: { x: operation.area.x, y: operation.area.y },
              end: { x: operation.area.x + operation.area.width, y: operation.area.y },
              thickness: 1,
              color: parseColor('#000000'),
            });
          }
          break;

        case 'strikeout':
          if (operation.area) {
            const midY = operation.area.y + operation.area.height / 2;
            page.drawLine({
              start: { x: operation.area.x, y: midY },
              end: { x: operation.area.x + operation.area.width, y: midY },
              thickness: 1,
              color: parseColor('#000000'),
            });
          }
          break;

        case 'add-image':
          if (operation.imageData) {
            try {
              const imageBytes = Buffer.from(operation.imageData.split(',')[1], 'base64');
              let image;

              if (operation.imageData.includes('image/png')) {
                image = await pdfDoc.embedPng(imageBytes);
              } else if (operation.imageData.includes('image/jpeg')) {
                image = await pdfDoc.embedJpg(imageBytes);
              }

              if (image && operation.area) {
                page.drawImage(image, {
                  x: operation.area.x,
                  y: operation.area.y,
                  width: operation.area.width,
                  height: operation.area.height,
                });
              }
            } catch (error) {
              console.warn(`Failed to embed image: ${error}`);
            }
          }
          break;

        default:
          console.warn(`Unsupported operation type: ${operation.type}`);
      }
    }

    // Set metadata
    const outputName = `${originalFilename.replace('.pdf', '')}_edited.pdf`;
    pdfDoc.setTitle(outputName.replace('.pdf', ''));
    pdfDoc.setSubject('PDF edited by PDFPro.pro');
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
    console.error('PDF edit error:', error);
    throw new Error('Failed to edit PDF file: ' + (error instanceof Error ? error.message : String(error)));
  }
}

// Parse color string to RGB values
function parseColor(color: string): any {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    return {
      type: 'RGB',
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
    };
  }
  return { type: 'RGB', r: 0, g: 0, b: 0 }; // Default black
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: EditPDFRequest = await request.json();

    if (!body.file || !body.file.data) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!body.editOptions) {
      return NextResponse.json(
        { error: 'Edit options are required' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!body.file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      );
    }

    // Validate edit operations
    if (!body.editOptions.operations || body.editOptions.operations.length === 0) {
      return NextResponse.json(
        { error: 'At least one edit operation is required' },
        { status: 400 }
      );
    }

    // Load and validate the PDF
    const buffer = Buffer.from(body.file.data, 'base64');
    let sourcePdf: PDFDocument;

    try {
      sourcePdf = await PDFDocument.load(buffer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid PDF file' },
        { status: 400 }
      );
    }

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Edit the PDF
    const editResult = await editPDF(
      buffer,
      body.editOptions,
      originalFilename
    );

    // Generate edit report
    const editReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: sourcePdf.getPageCount()
      },
      editedFile: {
        name: editResult.filename,
        size: editResult.size
      },
      editOptions: body.editOptions,
      processing: {
        operationsPerformed: body.editOptions.operations.length,
        editType: body.editOptions.action
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF edited successfully',
      data: {
        filename: editResult.filename,
        originalSize,
        editedSize: editResult.size,
        operationsPerformed: body.editOptions.operations.length,
        downloadUrl: `/api/download/${editResult.filename}`,
        data: Buffer.from(editResult.data).toString('base64'),
        editReport
      }
    });

  } catch (error) {
    console.error('PDF edit error:', error);
    return NextResponse.json(
      { error: 'Failed to edit PDF file: ' + (error instanceof Error ? error.message : String(error)) },
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