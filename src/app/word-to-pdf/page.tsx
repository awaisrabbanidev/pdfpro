

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Convert Word to PDF - DOCX to PDF Converter | PDFPro.pro',
    description: 'Convert Microsoft Word documents to high-quality PDF files. Transform DOCX files to PDF format while preserving formatting and layout. Free online Word to PDF converter.',
    keywords: 'word to pdf, docx to pdf, document conversion, office to pdf, word converter',
    canonical: getCanonicalUrl('/word-to-pdf'),
    openGraph: {
      title: 'Word to PDF Converter - PDFPro.pro',
      description: 'Convert Word documents to high-quality PDF files.',
      url: getCanonicalUrl('/word-to-pdf'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'Word to PDF' }]
    }
  };
}

export default function WordToPDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'word-to-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading Word to PDF converter...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Convert Word documents to PDF',
              'Preserve formatting and layout',
              'Maintain images and tables',
              'High-quality output',
              'Fast conversion process'
            ]}
            instructions={[
              'Upload your Word document (.docx)',
              'Wait for conversion to complete',
              'Preview the PDF output',
              'Download your PDF file'
            ]}
            acceptedFileTypes={['application/vnd.openxmlformats-officedocument.wordprocessingml.document']}
            maxFiles={1}
            toolId="word-to-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload Word document' },
              { id: 'analyze', label: 'Analyze document structure' },
              { id: 'convert', label: 'Convert to PDF' },
              { id: 'optimize', label: 'Optimize output' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}