import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';
import * as XLSX from 'xlsx';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface ExcelToPDFRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    preserveFormatting: boolean;
    pageSize: 'A4' | 'Letter';
    orientation: 'portrait' | 'landscape';
    includeGridlines: boolean;
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

// Convert Excel to PDF
async function convertExcelToPDF(
  xlsxBuffer: Buffer,
  options: ExcelToPDFRequest['options'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    // Parse Excel file using xlsx library
    const workbook = XLSX.read(xlsxBuffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames;

    if (sheetNames.length === 0) {
      throw new Error('Excel file contains no sheets');
    }

    // Page dimensions based on options
    const pageSizes = {
      'A4': { width: 595, height: 842 },
      'Letter': { width: 612, height: 792 }
    };

    let { width, height } = pageSizes[options.pageSize];

    // Swap dimensions for landscape
    if (options.orientation === 'landscape') {
      [width, height] = [height, width];
    }

    const pdfDoc = await PDFDocument.create();

    // Process each sheet
    for (let sheetIndex = 0; sheetIndex < sheetNames.length; sheetIndex++) {
      const sheetName = sheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      if (!jsonData || jsonData.length === 0) {
        continue; // Skip empty sheets
      }

      // Create PDF page for this sheet
      const page = pdfDoc.addPage([width, height]);
      const margins = { top: 50, right: 50, bottom: 50, left: 50 };
      const usableWidth = width - margins.left - margins.right;
      const usableHeight = height - margins.top - margins.bottom;

      // Add sheet header
      page.drawText(`Sheet: ${sheetName}`, {
        x: margins.left,
        y: height - margins.top,
        size: 16,
        color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
      });

      page.drawText(`From: ${originalFilename}`, {
        x: margins.left,
        y: height - margins.top - 20,
        size: 10,
        color: { type: 'RGB', r: 100, g: 100, b: 100 } as any
      });

      // Table settings
      const fontSize = 9;
      const lineHeight = fontSize * 1.5;
      const rowHeight = lineHeight;
      const maxRowsPerPage = Math.floor((usableHeight - 80) / rowHeight);
      const startRow = 2; // Start data rows

      // Calculate column widths based on content
      const columnWidths: number[] = [];
      const maxCols = Math.max(...jsonData.map((row: any[]) => row ? row.length : 0));

      for (let col = 0; col < maxCols; col++) {
        columnWidths[col] = Math.max(
          80, // Minimum width
          ...jsonData.map((row: any[]) => (row && row[col] !== undefined ? String(row[col]).length * 6 : 0))
        );
      }

      // Adjust column widths to fit page
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      if (totalWidth > usableWidth) {
        const scaleFactor = usableWidth / totalWidth;
        for (let i = 0; i < columnWidths.length; i++) {
          columnWidths[i] *= scaleFactor;
        }
      }

      // Render table data
      let currentPage = page;
      let currentY = height - margins.top - 50;
      let rowsOnThisPage = 0;

      for (let row = 0; row < jsonData.length; row++) {
        if (!jsonData[row]) continue;

        // Check if we need a new page
        if (rowsOnThisPage >= maxRowsPerPage) {
          currentPage = pdfDoc.addPage([width, height]);
          currentY = height - margins.top;
          rowsOnThisPage = 0;

          // Add sheet name on new page
          currentPage.drawText(`Sheet: ${sheetName} (continued)`, {
            x: margins.left,
            y: currentY,
            size: 14,
            color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
          });
          currentY -= 30;
        }

        // Draw row data
        for (let col = 0; col < maxCols; col++) {
          const cellValue = Array.isArray(jsonData[row]) ? jsonData[row][col] : undefined;
          if (cellValue !== undefined && cellValue !== null) {
            const text = String(cellValue);
            let xPos = margins.left;

            // Calculate x position for this column
            for (let i = 0; i < col; i++) {
              xPos += columnWidths[i];
            }

            // Draw text with word wrap
            const words = text.split(' ');
            let currentLine = '';
            let lineY = currentY;

            for (const word of words) {
              const testLine = currentLine ? `${currentLine} ${word}` : word;
              const textWidth = testLine.length * 6; // Rough estimate

              if (textWidth > columnWidths[col] - 10 && currentLine) {
                // Draw current line
                currentPage.drawText(currentLine, {
                  x: xPos + 5,
                  y: lineY,
                  size: fontSize,
                  color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
                });
                currentLine = word;
                lineY -= lineHeight;
              } else {
                currentLine = testLine;
              }
            }

            // Draw remaining text
            if (currentLine) {
              currentPage.drawText(currentLine, {
                x: xPos + 5,
                y: lineY,
                size: fontSize,
                color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
              });
            }
          }
        }

        // Draw gridlines if requested
        if (options.includeGridlines) {
          let xPos = margins.left;
          for (let col = 0; col <= maxCols; col++) {
            if (col < maxCols) xPos += columnWidths[col];

            currentPage.drawLine({
              start: { x: xPos, y: currentY + rowHeight },
              end: { x: xPos, y: currentY },
              thickness: 1,
              color: { type: 'RGB', r: 200, g: 200, b: 200 } as any
            });
          }
        }

        currentY -= rowHeight;
        rowsOnThisPage++;

        // Add spacing between rows
        currentY -= 2;
      }

      // Add sheet footer
      currentPage.drawText(`Page ${sheetIndex + 1} of ${sheetNames.length} - Sheet ${sheetIndex + 1}`, {
        x: width - 150,
        y: 30,
        size: 8,
        color: { type: 'RGB', r: 150, g: 150, b: 150 } as any
      });
    }

    // Set metadata
    const outputName = `${originalFilename.replace(/\.(xlsx?|xls)$/, '')}.pdf`;
    pdfDoc.setTitle(outputName.replace('.pdf', ''));
    pdfDoc.setSubject('Excel converted to PDF by PDFPro.pro');
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
    console.error('Excel to PDF conversion error:', error);
    throw new Error('Failed to convert Excel to PDF: ' + error.message);
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: ExcelToPDFRequest = await request.json();

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

    // Validate file type (should be XLSX/XLS)
    const filename = body.file.name.toLowerCase();
    if (!filename.endsWith('.xlsx') && !filename.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Only XLSX and XLS files are supported' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(body.file.data, 'base64');

    // Validate file size (Excel files can be large)
    const maxSize = 30 * 1024 * 1024; // 30MB
    if (buffer.length > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 30MB' },
        { status: 400 }
      );
    }

    const originalSize = buffer.length;
    const originalFilename = body.file.name;

    // Parse Excel file first to get sheet count
    const workbookInfo = XLSX.read(buffer, { type: 'buffer' });
    const sheetsCount = workbookInfo.SheetNames.length;

    // Convert Excel to PDF
    const conversionResult = await convertExcelToPDF(
      buffer,
      body.options,
      originalFilename
    );

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        type: originalFilename.endsWith('.xlsx') ? 'Excel XML' : 'Excel Binary',
        sheetsCount
      },
      convertedFile: {
        name: conversionResult.filename,
        size: conversionResult.size,
        pages: sheetsCount
      },
      options: body.options,
      processing: {
        pageSize: body.options.pageSize,
        orientation: body.options.orientation,
        formattingPreserved: body.options.preserveFormatting,
        gridlinesIncluded: body.options.includeGridlines
      }
    };

    return NextResponse.json({
      success: true,
      message: 'Excel converted to PDF successfully',
      data: {
        filename: conversionResult.filename,
        originalSize,
        convertedSize: conversionResult.size,
        sheetsConverted: sheetsCount,
        downloadUrl: `/api/download/${conversionResult.filename}`,
        data: Buffer.from(conversionResult.data).toString('base64'),
        conversionReport
      }
    });

  } catch (error) {
    console.error('Excel to PDF conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert Excel to PDF' },
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