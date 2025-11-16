import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '../../lib/constants';
import { getCanonicalUrl } from '../../lib/url-config';
import ToolPage from '../../components/tools/ToolPage';
import ErrorBoundary from '../../components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Compress PDF - Reduce PDF File Size | PDFPro.pro',
    description: 'Compress PDF files to reduce file size while maintaining quality. Free online PDF compression tool with multiple compression levels.',
    keywords: 'compress pdf, reduce pdf size, optimize pdf, shrink pdf',
    canonical: getCanonicalUrl('/compress-pdf'),
    openGraph: {
      title: 'Compress PDF Files - PDFPro.pro',
      description: 'Reduce PDF file size without losing quality.',
      url: getCanonicalUrl('/compress-pdf'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'Compress PDF' }]
    }
  };
}

export default function CompressPDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'compress-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF compressor...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Reduce file size significantly',
              'Multiple compression levels',
              'Maintain quality',
              'Optimize images and fonts'
            ]}
            instructions={[
              'Upload your PDF file',
              'Select compression level',
              'Click to compress file',
              'Download compressed PDF'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="compress-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file' },
              { id: 'analyze', label: 'Analyze content' },
              { id: 'compress', label: 'Compress images and fonts' },
              { id: 'optimize', label: 'Optimize file size' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
