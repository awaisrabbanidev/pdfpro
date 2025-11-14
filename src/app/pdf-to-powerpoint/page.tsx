'use client';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Convert PDF to PowerPoint - PPT Converter | PDFPro.pro',
    description: 'Convert PDF documents to editable PowerPoint presentations. Extract slides and content from PDF to PPTX format. Free online PDF to PPT converter.',
    keywords: 'pdf to powerpoint, pdf to ppt, pdf converter, presentation converter, slide extraction',
    canonical: getCanonicalUrl('/pdf-to-powerpoint'),
    openGraph: {
      title: 'PDF to PowerPoint Converter - PDFPro.pro',
      description: 'Convert PDF files to editable PowerPoint presentations.',
      url: getCanonicalUrl('/pdf-to-powerpoint'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'PDF to PowerPoint' }]
    }
  };
}

export default function PDFToPowerPointPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'pdf-to-powerpoint');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF to PowerPoint converter...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Convert PDF to editable PowerPoint slides',
              'Preserve layout and formatting',
              'Extract text and images',
              'Maintain presentation structure',
              'High-quality conversion'
            ]}
            instructions={[
              'Upload your PDF file',
              'Wait for conversion to complete',
              'Download your PowerPoint file',
              'Edit slides as needed'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="pdf-to-powerpoint"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file', status: 'pending' },
              { id: 'analyze', label: 'Analyze PDF content', status: 'pending' },
              { id: 'convert', label: 'Convert to PowerPoint', status: 'pending' },
              { id: 'format', label: 'Format slides', status: 'pending' },
              { id: 'complete', label: 'Complete', status: 'pending' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}