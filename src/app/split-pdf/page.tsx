import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '../../lib/constants';
import { getCanonicalUrl } from '../../lib/url-config';
import ToolPage from '../../components/tools/ToolPage';
import ErrorBoundary from '../../components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Split PDF - Extract Pages from PDF | PDFPro.pro',
    description: 'Split PDF files into separate pages or page ranges. Extract specific pages from PDF documents. Free online PDF splitter tool.',
    keywords: 'split pdf, extract pdf pages, pdf separator, divide pdf',
    canonical: getCanonicalUrl('/split-pdf'),
    openGraph: {
      title: 'Split PDF Files - PDFPro.pro',
      description: 'Extract specific pages from your PDF documents.',
      url: getCanonicalUrl('/split-pdf'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'Split PDF' }]
    }
  };
}

export default function SplitPDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'split-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF splitter...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Extract specific pages from PDF',
              'Split by page ranges',
              'Create separate PDF files',
              'Maintain original formatting'
            ]}
            instructions={[
              'Upload the PDF file you want to split',
              'Specify page ranges or select individual pages',
              'Choose split options',
              'Download the split files'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="split-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file' },
              { id: 'validate', label: 'Validate PDF structure' },
              { id: 'analyze', label: 'Analyze pages' },
              { id: 'split', label: 'Split pages' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
