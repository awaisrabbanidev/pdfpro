

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PDF_TOOLS } from '@/lib/constants';
import { getCanonicalUrl } from '@/lib/url-config';
import ToolPage from '@/components/tools/ToolPage';
import ErrorBoundary from '@/components/ErrorBoundary';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'Convert PDF to Excel - XLSX Converter | PDFPro.pro',
    description: 'Extract tables and data from PDF files into Excel spreadsheets. Convert PDF to XLSX format with accurate formatting. Free online PDF to Excel converter.',
    keywords: 'pdf to excel, pdf to xlsx, table extraction, data conversion, spreadsheet converter',
    canonical: getCanonicalUrl('/pdf-to-excel'),
    openGraph: {
      title: 'PDF to Excel Converter - PDFPro.pro',
      description: 'Extract tables and data from PDFs into Excel spreadsheets.',
      url: getCanonicalUrl('/pdf-to-excel'),
      images: [{ url: getCanonicalUrl('/og-image.jpg'), width: 1200, height: 630, alt: 'PDF to Excel' }]
    }
  };
}

export default function PDFToExcelPage() {
  const tool = PDF_TOOLS.find(t => t.id === 'pdf-to-excel');

  if (!tool) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">Loading PDF to Excel converter...</div>
      </div>}>
        <div className="min-h-screen bg-black py-12 px-4">
          <ToolPage
            tool={tool}
            description={tool.description}
            features={[
              'Extract tables from PDF to Excel',
              'Preserve data formatting',
              'Convert multiple worksheets',
              'Maintain cell structure',
              'Accurate data recognition'
            ]}
            instructions={[
              'Upload your PDF file',
              'Select extraction options',
              'Convert to Excel format',
              'Download your spreadsheet'
            ]}
            acceptedFileTypes={['application/pdf']}
            maxFiles={1}
            toolId="pdf-to-excel"
            processingSteps={[
              { id: 'upload', label: 'Upload PDF file' },
              { id: 'analyze', label: 'Analyze data structure' },
              { id: 'extract', label: 'Extract tables' },
              { id: 'format', label: 'Format Excel file' },
              { id: 'complete', label: 'Complete' }
            ]}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}