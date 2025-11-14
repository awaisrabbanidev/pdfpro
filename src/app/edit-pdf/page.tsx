import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Edit PDF Online - Free PDF Editor | PDFPro.pro',
    description: 'Edit PDF documents online. Add text, images, annotations and modify content directly in your browser. Free PDF editor with professional features.',
    keywords: 'edit pdf, pdf editor, modify pdf, annotate pdf, fill pdf forms',
    canonical: getCanonicalUrl('/edit-pdf'),
    openGraph: {
      title: 'Edit PDF Online - PDFPro.pro',
      description: 'Edit PDF documents online with our free PDF editor.',
      url: getCanonicalUrl('/edit-pdf'),
      images: [
        {
          url: getCanonicalUrl('/og-image.jpg'),
          width: 1200,
          height: 630,
          alt: 'Edit PDF Online'
        }
      ]
    }
  };
}

export default function EditPDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'edit-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF editor...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Edit text directly in PDF documents',
              'Add and modify images',
              'Insert annotations and markup',
              'Fill out PDF forms',
              'Professional editing tools'
            ]}
            instructions={[
              'Upload your PDF file',
              'Use editing tools to modify content',
              'Add or edit text and images',
              'Save your edited PDF document'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="edit-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file' },
              { id: 'parse', label: 'Parse PDF structure' },
              { id: 'edit', label: 'Edit content' },
              { id: 'preview', label: 'Preview changes' },
              { id: 'save', label: 'Save document' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}