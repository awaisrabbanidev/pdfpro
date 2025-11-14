import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Convert JPG to PDF - Image to PDF Converter | PDFPro.pro',
    description: 'Combine multiple JPG images into a single PDF document. Convert JPEG, PNG, and other image formats to PDF. Free online image to PDF converter.',
    keywords: 'jpg to pdf, image to pdf, photo converter, jpeg to pdf, picture to pdf',
    canonical: getCanonicalUrl('/jpg-to-pdf'),
    openGraph: {
      title: 'JPG to PDF Converter - PDFPro.pro',
      description: 'Convert images to PDF documents easily.',
      url: getCanonicalUrl('/jpg-to-pdf'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'JPG to PDF' }]
    }
  };
}

export default function JPGToPDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'jpg-to-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading JPG to PDF converter...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Convert JPG, PNG images to PDF',
              'Combine multiple images',
              'Maintain image quality',
              'Auto-arrange images',
              'Support various formats'
            ]}
            instructions={[
              'Upload your image files',
              'Arrange images if needed',
              'Choose page size options',
              'Download your PDF document'
            ]}
            acceptedFileTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/bmp', 'image/tiff']}
            maxFiles={20}
            toolId="jpg-to-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload images' },
              { id: 'process', label: 'Process images' },
              { id: 'arrange', label: 'Arrange layout' },
              { id: 'convert', label: 'Create PDF' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}