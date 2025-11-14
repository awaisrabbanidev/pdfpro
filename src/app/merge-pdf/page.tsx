import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Merge PDF - Combine Multiple PDFs into One | PDFPro.pro',
    description: 'Merge multiple PDF files into a single document. Combine PDFs in any order. Free online PDF merger tool.',
    keywords: 'merge pdf, combine pdf, pdf merger, join pdf files',
    canonical: getCanonicalUrl('/merge-pdf'),
    openGraph: {
      title: 'Merge PDF Files - PDFPro.pro',
      description: 'Combine multiple PDFs into one document easily.',
      url: getCanonicalUrl('/merge-pdf'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'Merge PDF' }]
    }
  };
}

export default function MergePDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'merge-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF merger...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Combine multiple PDFs into one',
              'Maintain original quality',
              'Custom merge order',
              'Add bookmarks automatically'
            ]}
            instructions={[
              'Upload all PDF files you want to merge',
              'Arrange files in desired order',
              'Click to merge and combine',
              'Download your merged PDF'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={20}
            toolId="merge-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF files' },
              { id: 'validate', label: 'Validate PDF integrity' },
              { id: 'merge', label: 'Merge PDF pages' },
              { id: 'optimize', label: 'Optimize merged file' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}