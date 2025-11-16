import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '../../lib/constants';
import { getCanonicalUrl } from '../../lib/url-config';
import ToolPage from '../../components/tools/ToolPage';
import ErrorBoundary from '../../components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const tool = PDF_TOOLS.find(t => t.id === 'sign-pdf');
  if (!tool) notFound();

  return {
    title: `${tool.title} Online - Free Digital Signature | PDFPro.pro`,
    description: tool.description,
    keywords: tool.keywords.join(', '),
    canonical: getCanonicalUrl(tool.href),
  };
}

export default function SignPDFPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'sign-pdf');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF signer...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Add digital signatures legally binding',
              'Draw or type your signature',
              'Upload signature image files',
              'Multiple signature support',
              'Maintain document integrity'
            ]}
            instructions={[
              'Upload your PDF document',
              'Choose signature type (draw/type/upload)',
              'Place signature on document',
              'Save your signed PDF'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="sign-pdf"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file' },
              { id: 'prepare', label: 'Prepare signature' },
              { id: 'sign', label: 'Add signature' },
              { id: 'save', label: 'Save signed document' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
