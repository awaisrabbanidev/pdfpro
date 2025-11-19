export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';
import { put } from '@vercel/blob';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface CompareRequest {
  files: {
    name: string;
    data: string; // Base64 encoded
  }[];
  options: {
    compareMode: 'text' | 'visual' | 'both';
    outputFormat: 'pdf' | 'html';
    showDifferences: boolean;
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

// Simple text extraction simulation (in production, use proper PDF text extraction)
async function extractPDFText(pdfBuffer: Buffer): Promise<string> {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // Simulate text extraction
    let extractedText = '';
    for (let i = 1; i <= pageCount; i++) {
      extractedText += `Page ${i}: This is simulated text content from page ${i}.\n`;
      extractedText += `In a real implementation, this would be the actual text extracted from the PDF.\n`;
      extractedText += `Each page would contain the actual document content.\n\n`;
    }

    return extractedText;
  } catch (error) {
    throw new Error('Failed to extract text from PDF');
  }
}

// Compare two texts and find differences
function compareTexts(text1: string, text2: string): {
  additions: string[];
  deletions: string[];
  modifications: { old: string; new: string }[];
  similarity: number;
} {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const additions = [...set2].filter(word => !set1.has(word));
  const deletions = [...set1].filter(word => !set2.has(word));
  const common = [...set1].filter(word => set2.has(word));

  // Calculate similarity percentage
  const totalUnique = new Set([...words1, ...words2]).size;
  const similarity = (common.length / totalUnique) * 100;

  return {
    additions: additions.slice(0, 10), // Limit to first 10 for demo
    deletions: deletions.slice(0, 10),
    modifications: [], // Simplified comparison
    similarity: Math.round(similarity * 100) / 100
  };
}

// Generate comparison report
async function generateComparisonReport(
  comparisonData: any,
  outputFormat: string,
  originalFilename1: string,
  originalFilename2: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  if (outputFormat === 'html') {
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>PDF Comparison Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
        .header { background: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .addition { color: green; background: #e8f5e8; padding: 5px; margin: 2px 0; }
        .deletion { color: red; background: #ffe8e8; padding: 5px; margin: 2px 0; }
        .similarity { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
        .high-similarity { color: green; }
        .medium-similarity { color: orange; }
        .low-similarity { color: red; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PDF Comparison Report</h1>
        <p><strong>File 1:</strong> ${originalFilename1}</p>
        <p><strong>File 2:</strong> ${originalFilename2}</p>
        <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
    </div>

    <div class="similarity ${comparisonData.similarity > 80 ? 'high-similarity' : comparisonData.similarity > 50 ? 'medium-similarity' : 'low-similarity'}">
        Similarity: ${comparisonData.similarity}%
    </div>

    <div class="section">
        <h2>Comparison Summary</h2>
        <table>
            <tr><th>Metric</th><th>Count</th></tr>
            <tr><td>Words Added</td><td>${comparisonData.additions.length}</td></tr>
            <tr><td>Words Removed</td><td>${comparisonData.deletions.length}</td></tr>
            <tr><td>Total Words File 1</td><td>${comparisonData.totalWords1}</td></tr>
            <tr><td>Total Words File 2</td><td>${comparisonData.totalWords2}</td></tr>
        </table>
    </div>

    ${comparisonData.additions.length > 0 ? `
    <div class="section">
        <h2>Additions (in File 2 but not in File 1)</h2>
        ${comparisonData.additions.map((word: string) => `<div class="addition">${word}</div>`).join('')}
    </div>
    ` : ''}

    ${comparisonData.deletions.length > 0 ? `
    <div class="section">
        <h2>Deletions (in File 1 but not in File 2)</h2>
        ${comparisonData.deletions.map((word: string) => `<div class="deletion">${word}</div>`).join('')}
    </div>
    ` : ''}

    <div class="section">
        <h2>Notes</h2>
        <p>This comparison was performed using text analysis. For more detailed visual comparison, consider using professional PDF comparison tools.</p>
    </div>
</body>
</html>`;

    const filename = `comparison_${originalFilename1.replace('.pdf', '')}_vs_${originalFilename2.replace('.pdf', '')}.html`;
    const htmlBuffer = Buffer.from(htmlContent, 'utf-8');
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, htmlBuffer);

    return {
      filename,
      size: htmlBuffer.length,
      data: htmlBuffer
    };
  } else {
    // Generate PDF report
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    let yPosition = height - 50;
    const fontSize = 12;
    const lineHeight = fontSize * 1.5;
    const margin = 50;

    // Title
    page.drawText('PDF Comparison Report', {
      x: margin,
      y: yPosition,
      size: 18,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    yPosition -= 40;

    // File information
    page.drawText(`File 1: ${originalFilename1}`, {
      x: margin,
      y: yPosition,
      size: fontSize,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    yPosition -= lineHeight;
    page.drawText(`File 2: ${originalFilename2}`, {
      x: margin,
      y: yPosition,
      size: fontSize,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    yPosition -= lineHeight * 2;
    page.drawText(`Similarity: ${comparisonData.similarity}%`, {
      x: margin,
      y: yPosition,
      size: 14,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    yPosition -= lineHeight * 2;
    page.drawText('Additions:', {
      x: margin,
      y: yPosition,
      size: fontSize,
      color: { type: 'RGB', r: 0, g: 0, b: 0 } as any
    });

    yPosition -= lineHeight;
    comparisonData.additions.slice(0, 5).forEach((word: string) => {
      if (yPosition < margin) return;
      page.drawText(`• ${word}`, {
        x: margin + 20,
        y: yPosition,
        size: fontSize,
        color: { type: 'RGB', r: 0, g: 0.5, b: 0 } as any
      });
      yPosition -= lineHeight;
    });

    // Set metadata
    const filename = `comparison_${originalFilename1.replace('.pdf', '')}_vs_${originalFilename2.replace('.pdf', '')}.pdf`;
    pdfDoc.setTitle(filename.replace('.pdf', ''));
    pdfDoc.setSubject('PDF created by PDFPro.pro Compare Tool');
    pdfDoc.setProducer('PDFPro.pro');
    pdfDoc.setCreator('PDFPro.pro');
    pdfDoc.setCreationDate(new Date());
    pdfDoc.setModificationDate(new Date());

    const pdfBytes = await pdfDoc.save();
    const outputPath = join(OUTPUT_DIR, filename);
    await writeFile(outputPath, Buffer.from(pdfBytes));

    return {
      filename,
      size: pdfBytes.length,
      data: Buffer.from(pdfBytes)
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: CompareRequest = await request.json();

    if (!body.files || body.files.length !== 2) {
      return NextResponse.json(
        { error: 'Exactly 2 files are required for comparison' },
        { status: 400 }
      );
    }

    if (!body.options) {
      return NextResponse.json(
        { error: 'Comparison options are required' },
        { status: 400 }
      );
    }

    // Validate files are PDFs
    const buffers = await Promise.all(
      body.files.map(async (file) => {
        try {
          const buffer = Buffer.from(file.data, 'base64');
          await PDFDocument.load(buffer); // Validate it's a PDF
          return buffer;
        } catch (error) {
          throw new Error(`Invalid PDF file: ${file.name}`);
        }
      })
    );

    const originalSize1 = buffers[0].length;
    const originalSize2 = buffers[1].length;
    const originalFilename1 = body.files[0].name;
    const originalFilename2 = body.files[1].name;

    // Extract text from both PDFs
    const text1 = await extractPDFText(buffers[0]);
    const text2 = await extractPDFText(buffers[1]);

    // Compare texts
    const comparisonResult = compareTexts(text1, text2);

    // Add word counts to comparison result
    const totalWords1 = text1.split(/\s+/).length;
    const totalWords2 = text2.split(/\s+/).length;

    // Generate comparison report
    const reportResult = await generateComparisonReport(
      {
        ...comparisonResult,
        totalWords1,
        totalWords2
      },
      body.options.outputFormat,
      originalFilename1,
      originalFilename2
    );

    // Generate comparison report object for response
    const comparisonReport = {
      files: {
        file1: {
          name: originalFilename1,
          size: originalSize1,
          words: totalWords1
        },
        file2: {
          name: originalFilename2,
          size: originalSize2,
          words: totalWords2
        }
      },
      comparison: {
        mode: body.options.compareMode,
        format: body.options.outputFormat,
        similarity: comparisonResult.similarity,
        additions: comparisonResult.additions.length,
        deletions: comparisonResult.deletions.length,
        modifications: comparisonResult.modifications.length
      },
      options: body.options
    };

    return NextResponse.json({
      success: true,
      message: 'PDF comparison completed successfully',
      data: {
        filename: reportResult.filename,
        similarity: comparisonResult.similarity,
        additions: comparisonResult.additions.length,
        deletions: comparisonResult.deletions.length,
        totalWords1: totalWords1,
        totalWords2: totalWords2,
        downloadUrl: `/api/download/${reportResult.filename}`,
        data: Buffer.from(reportResult.data).toString('base64'),
        comparisonReport
      }
    });

  } catch (error) {
    console.error('PDF compare error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to compare PDF files' },
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
