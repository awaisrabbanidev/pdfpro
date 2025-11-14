import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata() {
  return {
    title: 'PDF to Word Converter - Free Online PDF to Word Tool | PDFPro.pro',
    description: 'Convert PDF documents to editable Microsoft Word (.docx) files while preserving formatting. Fast, secure, and free PDF to Word conversion.',
    keywords: 'pdf to word, pdf converter, document conversion, word converter, pdf to docx',
    canonical: getCanonicalUrl('/pdf-to-word'),
    openGraph: {
      title: 'PDF to Word Converter - PDFPro.pro',
      description: 'Convert PDF to Word for free. Preserve formatting and layout.',
      url: getCanonicalUrl('/pdf-to-word'),
      images: [
        {
          url: getCanonicalUrl('/og-image.jpg'),
          width: 1200,
          height: 630,
          alt: 'PDF to Word Converter'
        }
      ]
    }
  };
}

export default function PDFToWordPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'pdf-to-word');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF to Word converter...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Convert PDF to editable Word documents',
              'Preserves original formatting and layout',
              'Extract text and images from PDFs',
              'High conversion accuracy',
              'Fast and secure processing'
            ]}
            instructions={[
              'Upload your PDF file',
              'Wait for the conversion to complete',
              'Download your Word document',
              'Edit as needed in Microsoft Word'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="pdf-to-word"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file' },
              { id: 'analyze', label: 'Analyze document structure' },
              { id: 'extract', label: 'Extract text and layout' },
              { id: 'convert', label: 'Convert to Word format' },
              { id: 'format', label: 'Format document' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}