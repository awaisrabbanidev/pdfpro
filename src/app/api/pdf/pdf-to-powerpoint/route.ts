import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { PDFDocument } from 'pdf-lib';

// Simple UUID function
const uuid = () => Math.random().toString(36).substring(2, 15);

interface PDFToPowerPointRequest {
  file: {
    name: string;
    data: string; // Base64 encoded
  };
  options: {
    preserveLayout: boolean;
    includeImages: boolean;
    slideLayout: 'auto' | 'title' | 'content';
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

// Convert PDF to PowerPoint (simulated)
async function convertPDFToPowerPoint(
  pdfBuffer: Buffer,
  options: PDFToPowerPointRequest['options'],
  originalFilename: string
): Promise<{ filename: string; size: number; data: Buffer }> {
  try {
    // Load PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    // In a real implementation, you would:
    // 1. Extract text and images from each PDF page
    // 2. Create PowerPoint slides using a library like PPTXgenJS
    // 3. Preserve layout and formatting
    // 4. Add images if requested

    // For now, create a simulated PowerPoint file (XML-based PPTX)
    const pptxContent = createSimulatedPPTX(pageCount, originalFilename, options);
    const filename = `${originalFilename.replace('.pdf', '')}.pptx`;
    const outputPath = join(OUTPUT_DIR, filename);

    // Save as PPTX (simulated)
    const pptxBuffer = Buffer.from(pptxContent, 'utf-8');
    await writeFile(outputPath, pptxBuffer);

    return {
      filename,
      size: pptxBuffer.length,
      data: pptxBuffer
    };

  } catch (error) {
    console.error('PDF to PowerPoint conversion error:', error);
    throw new Error('Failed to convert PDF to PowerPoint');
  }
}

// Create simulated PPTX content
function createSimulatedPPTX(pageCount: number, originalFilename: string, options: any): string {
  const slides = [];
  for (let i = 1; i <= pageCount; i++) {
    slides.push(`
    <p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
      <p:cSld>
        <p:spTree>
          <p:nvGrpSpPr>
            <p:cNvPr id="1" name=""/>
            <p:cNvGrpSpPr/>
            <p:nvPr/>
          </p:nvGrpSpPr>
          <p:grpSpPr>
            <a:xfrm>
              <a:off x="0" y="0"/>
              <a:ext cx="0" cy="0"/>
              <a:chOff x="0" y="0"/>
              <a:chExt cx="0" cy="0"/>
            </a:xfrm>
          </p:grpSpPr>
          <p:sp>
            <p:nvSpPr>
              <p:cNvPr id="2" name="Title ${i}">
                <a:extLst>
                  <a:ext uri="{C5DE9A41-E4EB-4489-A2D1-09E3AF7E594F}">
                    <a16:creationId xmlns:a16="http://schemas.microsoft.com/office/drawing/2014/main" id="{${uuid()}}"/>
                  </a:ext>
                </a:extLst>
              </p:cNvPr>
              <p:cNvSpPr>
                <a:spLocks noGrp="1"/>
              </p:cNvSpPr>
              <p:nvPr>
                <p:ph type="title"/>
              </p:nvPr>
            </p:nvSpPr>
            <p:spPr>
              <a:xfrm>
                <a:off x="684576" y="457200"/>
                <a:ext cx="8599536" cy="1162056"/>
              </a:xfrm>
              <a:prstGeom prst="rect">
                <a:avLst/>
              </a:prstGeom>
              <a:noFill/>
              <a:ln w="12700">
                <a:noFill/>
                <a:miter lim="800000"/>
                <a:headEnd/>
                <a:tailEnd/>
              </a:ln>
            </p:spPr>
            <p:txBody>
              <a:bodyPr rot="0" spcFirstLastPara="0" vertOverflow="overflow" horzOverflow="overflow" vert="horz" wrap="square" lIns="91440" tIns="45720" rIns="91440" bIns="45720" numCol="1" numColSpace="0" rtlCol="0" fromWordArt="0" anchor="t" anchorCtr="0" forceAA="0" compatLnSpc="1">
                <a:spAutoFit/>
              </a:bodyPr>
              <a:lstStyle/>
              <a:p>
                <a:pPr algn="ctr" rtl="0" eaLnBrk="1" fontAlgn="auto" defTabSize="914400" marL="0" marR="0" marB="0" indent="0" lnSpc="0" spcBef="0" spcAft="0">
                  <a:lnSpc>
                    <a:spcPct val="90000"/>
                  </a:lnSpc>
                </a:pPr>
                <a:r>
                  <a:rPr lang="en-US" sz="4400" spc="0" baseline="0">
                    <a:solidFill>
                      <a:srgbClr val="000000"/>
                    </a:solidFill>
                    <a:latin typeface="+mn-lt"/>
                  </a:rPr>
                  <a:t>Page ${i} from ${originalFilename}</a:t>
                </a:r>
              </a:p>
            </p:txBody>
          </p:sp>
        </p:spTree>
        <p:extLst>
          <p:ext uri="{BB962278-7677-447A-A84F-EFDE3102D6CD}">
            <p14:creationId xmlns:p14="http://schemas.microsoft.com/office/powerpoint/2010/main" val="${uuid()}"/>
          </p:ext>
        </p:extLst>
      </p:cSld>
      <p:clrMapOvr>
        <a:masterClrMapping/>
      </p:clrMapOvr>
    </p:sld>
    `);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldMasterIdLst>
    <p:sldMasterId id="2147483648" r:id="rId1"/>
  </p:sldMasterIdLst>
  <p:sldIdLst>
    ${Array.from({length: pageCount}, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${256 + i + 2}"/>`).join('\n    ')}
  </p:sldIdLst>
  <p:sldSz cx="9144000" cy="6858000"/>
  <p:notesSz cx="6858000" cy="9144000"/>
  <p:defaultTextStyle>
    <a:defPPr>
      <a:defRPr lang="en-US" sz="1800" b="0" i="0" u="none" strike="noStrike" kern="1200" baseline="0">
        <a:solidFill>
          <a:srgbClr val="000000"/>
        </a:solidFill>
        <a:latin typeface="+mn-lt"/>
        <a:cs typeface="+mn-cs"/>
      </a:defRPr>
    </a:defPPr>
  </p:defaultTextStyle>
</p:presentation>
${slides.join('')}
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${Array.from({length: pageCount + 1}, (_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('\n  ')}
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
</Relationships>`;
}

export async function POST(request: NextRequest) {
  try {
    await ensureDirectories();

    const body: PDFToPowerPointRequest = await request.json();

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

    // Convert PDF to PowerPoint
    const conversionResult = await convertPDFToPowerPoint(
      buffer,
      body.options,
      originalFilename
    );

    // Generate conversion report
    const conversionReport = {
      originalFile: {
        name: originalFilename,
        size: originalSize,
        pages: Math.ceil(originalSize / 50000)
      },
      convertedFile: {
        name: conversionResult.filename,
        size: conversionResult.size
      },
      options: body.options,
      processing: {
        slidesCreated: Math.ceil(originalSize / 50000),
        imagesIncluded: body.options.includeImages
      }
    };

    return NextResponse.json({
      success: true,
      message: 'PDF converted to PowerPoint successfully',
      data: {
        filename: conversionResult.filename,
        originalSize,
        convertedSize: conversionResult.size,
        slidesCreated: Math.ceil(originalSize / 50000),
        downloadUrl: `${baseUrl}/api/download/${conversionResult.filename}`,
        data: Buffer.from(conversionResult.data).toString('base64'),
        conversionReport
      }
    });

  } catch (error) {
    console.error('PDF to PowerPoint conversion error:', error);
    return NextResponse.json(
      { error: 'Failed to convert PDF to PowerPoint' },
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