import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

interface WatermarkSettings {
  type: 'text' | 'image';
  content: string;
  opacity: number;
  rotation: number;
  fontSize?: number;
  color?: string;
  position: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  scale: number;
  pages: 'all' | number[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const settingsJSON = formData.get('settings') as string;
    const imageFile = formData.get('imageFile') as File | null;

    if (!file || !settingsJSON) {
      return NextResponse.json({ error: 'Missing file or watermark settings' }, { status: 400 });
    }

    const watermarkSettings = JSON.parse(settingsJSON) as WatermarkSettings;
    const pdfBuffer = Buffer.from(await file.arrayBuffer());
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();

    let imageBytes: Uint8Array | undefined;
    if (watermarkSettings.type === 'image' && imageFile) {
      imageBytes = new Uint8Array(await imageFile.arrayBuffer());
    }

    const pagesToWatermark = watermarkSettings.pages === 'all'
      ? pdfDoc.getPageIndices()
      : watermarkSettings.pages.map(p => p - 1).filter(p => p >= 0 && p < pageCount);

    for (const pageIndex of pagesToWatermark) {
      const page = pdfDoc.getPage(pageIndex);
      const { width, height } = page.getSize();

      if (watermarkSettings.type === 'text') {
        const font = await pdfDoc.embedFont('Helvetica');
        const fontSize = watermarkSettings.fontSize || 24;
        const hex = (watermarkSettings.color || '#808080').replace('#', '');
        const color = rgb(
          parseInt(hex.substring(0, 2), 16) / 255,
          parseInt(hex.substring(2, 4), 16) / 255,
          parseInt(hex.substring(4, 6), 16) / 255
        );

        page.drawText(watermarkSettings.content, {
          size: fontSize * watermarkSettings.scale,
          font,
          color,
          opacity: watermarkSettings.opacity,
          rotate: degrees(watermarkSettings.rotation),
        });

      } else if (watermarkSettings.type === 'image' && imageBytes) {
        const watermarkImage = imageFile?.type === 'image/png'
            ? await pdfDoc.embedPng(imageBytes)
            : await pdfDoc.embedJpg(imageBytes);

        const imgWidth = watermarkImage.width * watermarkSettings.scale;
        const imgHeight = watermarkImage.height * watermarkSettings.scale;

        let x = (width - imgWidth) / 2;
        let y = (height - imgHeight) / 2;

        page.drawImage(watermarkImage, {
          x, y, width: imgWidth, height: imgHeight,
          opacity: watermarkSettings.opacity,
          rotate: degrees(watermarkSettings.rotation)
        });
      }
    }

    const pdfBytes = await pdfDoc.save();
    const filename = `watermarked-${file.name}`;
    const blob = await put(filename, Buffer.from(pdfBytes), {
      access: 'public',
      contentType: 'application/pdf',
    });

    return NextResponse.json(blob);

  } catch (error) {
    console.error('Watermark error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error while adding watermark';
    return NextResponse.json({ error: `Failed to add watermark: ${message}` }, { status: 500 });
  }
}
