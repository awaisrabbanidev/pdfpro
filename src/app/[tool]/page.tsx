import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolPage from '@/components/tools/ToolPage';
import { PDF_TOOLS, SEO_CONFIG } from '@/lib/constants';

interface ToolPageProps {
  params: Promise<{
    tool: string;
  }>;
}

// Processing step type (inline definition to avoid import issues)
interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

// Default processing steps for tools
const getDefaultProcessingSteps = (toolId: string): Omit<ProcessingStep, 'status' | 'error'>[] => {
  const commonSteps = [
    { id: 'upload', label: 'Upload files' },
    { id: 'validate', label: 'Validate files' },
    { id: 'process', label: 'Process files' },
    { id: 'generate', label: 'Generate result' },
    { id: 'complete', label: 'Complete' }
  ];

  // Tool-specific steps
  switch (toolId) {
    case 'merge-pdf':
      return [
        { id: 'upload', label: 'Upload PDF files' },
        { id: 'validate', label: 'Validate PDF integrity' },
        { id: 'merge', label: 'Merge PDF pages' },
        { id: 'optimize', label: 'Optimize merged file' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'split-pdf':
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'validate', label: 'Validate PDF structure' },
        { id: 'analyze', label: 'Analyze pages' },
        { id: 'split', label: 'Split pages' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'compress-pdf':
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'analyze', label: 'Analyze content' },
        { id: 'compress', label: 'Compress images and fonts' },
        { id: 'optimize', label: 'Optimize file size' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'ocr-pdf':
      return [
        { id: 'upload', label: 'Upload scanned PDF' },
        { id: 'analyze', label: 'Analyze document layout' },
        { id: 'ocr', label: 'Extract text using OCR' },
        { id: 'verify', label: 'Verify extracted text' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'crop-pdf':
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'configure', label: 'Set crop margins' },
        { id: 'crop', label: 'Crop pages' },
        { id: 'optimize', label: 'Optimize cropped file' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'compare-pdf':
      return [
        { id: 'upload', label: 'Upload 2 PDF files' },
        { id: 'extract', label: 'Extract text content' },
        { id: 'compare', label: 'Compare documents' },
        { id: 'generate', label: 'Generate comparison report' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'pdf-to-word':
    case 'pdf-to-excel':
    case 'pdf-to-powerpoint':
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'extract', label: 'Extract text and layout' },
        { id: 'convert', label: `Convert to ${toolId.includes('word') ? 'Word' : toolId.includes('excel') ? 'Excel' : 'PowerPoint'}` },
        { id: 'format', label: 'Format document' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'ocr-pdf':
      return [
        { id: 'upload', label: 'Upload scanned PDF' },
        { id: 'analyze', label: 'Analyze document layout' },
        { id: 'ocr', label: 'Extract text using OCR' },
        { id: 'verify', label: 'Verify extracted text' },
        { id: 'complete', label: 'Complete' }
      ];

    default:
      return commonSteps;
  }
};

// Real processing functions that connect to APIs
const getDefaultProcessFunction = (toolId: string) => {
  return async (files: File[]) => {
    try {
      let response;
      const baseUrl = process.env.NODE_ENV === 'production'
        ? 'https://pdfpro.pro'
        : 'http://localhost:3001';

      // Convert files to base64
      const filesAsBase64 = await Promise.all(
        files.map(async (file) => {
          const arrayBuffer = await file.arrayBuffer();
          const base64 = Buffer.from(arrayBuffer).toString('base64');
          return {
            name: file.name,
            data: base64
          };
        })
      );

      switch (toolId) {
        case 'merge-pdf':
          response = await fetch(`${baseUrl}/api/pdf/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: filesAsBase64,
              outputName: `merged_${Date.now()}.pdf`
            })
          });
          break;

        case 'split-pdf':
          response = await fetch(`${baseUrl}/api/pdf/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              splitType: 'single'
            })
          });
          break;

        case 'compress-pdf':
          response = await fetch(`${baseUrl}/api/pdf/compress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              compressionLevel: 'medium'
            })
          });
          break;

        case 'pdf-to-word':
          response = await fetch(`${baseUrl}/api/pdf/pdf-to-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                preserveFormatting: true,
                includeImages: false,
                ocrEnabled: false
              }
            })
          });
          break;

        case 'word-to-pdf':
          response = await fetch(`${baseUrl}/api/pdf/word-to-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                preserveFormatting: true,
                pageSize: 'A4',
                margins: { top: 72, bottom: 72, left: 72, right: 72 }
              }
            })
          });
          break;

        case 'ocr-pdf':
          response = await fetch(`${baseUrl}/api/pdf/ocr`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                language: 'en',
                outputFormat: 'pdf',
                preserveLayout: true
              }
            })
          });
          break;

        case 'crop-pdf':
          response = await fetch(`${baseUrl}/api/pdf/crop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              cropOptions: {
                pages: 'all',
                margins: { top: 10, bottom: 10, left: 10, right: 10 },
                units: 'mm'
              }
            })
          });
          break;

        case 'compare-pdf':
          if (files.length !== 2) {
            throw new Error('Compare tool requires exactly 2 files');
          }
          response = await fetch(`${baseUrl}/api/pdf/compare`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: filesAsBase64,
              options: {
                compareMode: 'text',
                outputFormat: 'html',
                showDifferences: true
              }
            })
          });
          break;

        // NEW API INTEGRATIONS
        case 'pdf-to-powerpoint':
          response = await fetch(`${baseUrl}/api/pdf/pdf-to-powerpoint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                preserveLayout: true,
                includeImages: false,
                slideLayout: 'auto'
              }
            })
          });
          break;

        case 'pdf-to-excel':
          response = await fetch(`${baseUrl}/api/pdf/pdf-to-excel`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                extractTables: true,
                includeFormatting: true,
                sheetLayout: 'auto'
              }
            })
          });
          break;

        case 'powerpoint-to-pdf':
          response = await fetch(`${baseUrl}/api/pdf/powerpoint-to-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                preserveAnimations: false,
                includeNotes: false,
                pageSize: 'A4',
                quality: 'medium'
              }
            })
          });
          break;

        case 'excel-to-pdf':
          response = await fetch(`${baseUrl}/api/pdf/excel-to-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                preserveFormatting: true,
                pageSize: 'A4',
                orientation: 'portrait',
                includeGridlines: true
              }
            })
          });
          break;

        case 'pdf-to-jpg':
          response = await fetch(`${baseUrl}/api/pdf/pdf-to-jpg`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                pageRange: 'all',
                quality: 'medium',
                format: 'jpg',
                dpi: 150
              }
            })
          });
          break;

        case 'jpg-to-pdf':
          response = await fetch(`${baseUrl}/api/pdf/jpg-to-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: filesAsBase64,
              options: {
                pageSize: 'A4',
                orientation: 'portrait',
                margins: { top: 20, bottom: 20, left: 20, right: 20 },
                imageLayout: 'fit'
              }
            })
          });
          break;

        case 'rotate-pdf':
          response = await fetch(`${baseUrl}/api/pdf/rotate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              rotation: {
                angle: 90,
                pages: 'all'
              }
            })
          });
          break;

        case 'protect-pdf':
          response = await fetch(`${baseUrl}/api/pdf/protect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              protection: {
                password: 'protected',
                permissions: {
                  printing: true,
                  copying: false,
                  modifying: false,
                  annotating: false
                }
              }
            })
          });
          break;

        case 'watermark':
          response = await fetch(`${baseUrl}/api/pdf/watermark`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              watermark: {
                type: 'text',
                content: 'PDFPro.pro',
                position: 'diagonal',
                opacity: 0.3,
                color: '#cccccc'
              }
            })
          });
          break;

        case 'html-to-pdf':
          response = await fetch(`${baseUrl}/api/pdf/html-to-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                pageSize: 'A4',
                orientation: 'portrait',
                margins: { top: 20, bottom: 20, left: 20, right: 20 },
                header: true,
                footer: true
              }
            })
          });
          break;

        case 'sign-pdf':
          response = await fetch(`${baseUrl}/api/pdf/sign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              signature: {
                text: 'Digitally Signed',
                position: { x: 100, y: 100 },
                style: 'text'
              }
            })
          });
          break;

        case 'unlock-pdf':
          response = await fetch(`${baseUrl}/api/pdf/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              password: 'unlock'
            })
          });
          break;

        case 'page-numbers':
          response = await fetch(`${baseUrl}/api/pdf/page-numbers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                position: 'bottom-center',
                format: '1 of N',
                startNumber: 1,
                fontSize: 10,
                color: '#000000',
                margin: 20
              }
            })
          });
          break;

        case 'organize-pdf':
          response = await fetch(`${baseUrl}/api/pdf/organize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              operations: [
                { type: 'move', sourcePage: 1, targetPage: 3 }
              ]
            })
          });
          break;

        case 'edit-pdf':
          response = await fetch(`${baseUrl}/api/pdf/edit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              edits: [
                { type: 'text', page: 1, x: 100, y: 100, content: 'Edited Text', fontSize: 12 }
              ]
            })
          });
          break;

        case 'repair-pdf':
          response = await fetch(`${baseUrl}/api/pdf/repair`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                attemptRecovery: true,
                reconstructStructure: true,
                removeCorruptedObjects: true
              }
            })
          });
          break;

        case 'redact-pdf':
          response = await fetch(`${baseUrl}/api/pdf/redact`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              redactions: [
                { text: 'CONFIDENTIAL', type: 'text', pages: 'all', style: 'blackout' }
              ]
            })
          });
          break;

        case 'pdf-to-pdfa':
          response = await fetch(`${baseUrl}/api/pdf/pdf-to-pdfa`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                conformance: 'A1b',
                preserveColor: true,
                embedFonts: true
              }
            })
          });
          break;

        case 'scan-to-pdf':
          response = await fetch(`${baseUrl}/api/pdf/scan-to-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              options: {
                enhancement: 'auto',
                ocrEnabled: true,
                compression: 'medium',
                pageSize: 'A4'
              }
            })
          });
          break;

        default:
          throw new Error(`Tool ${toolId} is not yet implemented`);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Processing failed with status ${response.status}`);
      }

      const result = await response.json();

      // Handle different response formats
      if (toolId === 'merge-pdf') {
        return [{
          id: result.data.filename,
          name: result.data.filename,
          url: result.data.downloadUrl,
          size: result.data.size,
          type: 'application/pdf',
          data: result.data.data
        }];
      } else if (toolId === 'split-pdf') {
        return result.data.files.map((file: any) => ({
          id: file.filename,
          name: file.filename,
          url: file.downloadUrl,
          size: file.size,
          type: 'application/pdf',
          data: file.data
        }));
      } else if (toolId === 'compare-pdf') {
        return [{
          id: result.data.filename,
          name: result.data.filename,
          url: result.data.downloadUrl,
          size: result.data.size,
          type: result.data.filename.endsWith('.html') ? 'text/html' : 'application/pdf',
          data: result.data.data
        }];
      } else {
        return [{
          id: result.data.filename,
          name: result.data.filename,
          url: result.data.downloadUrl,
          size: result.data.convertedSize || result.data.size,
          type: toolId.includes('word') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf',
          data: result.data.data
        }];
      }

      throw new Error('Unknown response format');

    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }
  };
};

// Tool-specific configurations
const getToolConfig = (toolId: string) => {
  const baseConfig = {
    processingSteps: getDefaultProcessingSteps(toolId).map(step => ({
      ...step,
      status: 'pending' as const,
      error: undefined
    })),
    onProcessFiles: getDefaultProcessFunction(toolId),
    maxFiles: 10,
    acceptedFileTypes: ['application/pdf']
  };

  switch (toolId) {
    case 'pdf-to-word':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Preserves original formatting',
          'Extracts text and images',
          'Maintains document structure',
          'High conversion accuracy'
        ],
        instructions: [
          'Upload your PDF file',
          'Wait for the conversion to complete',
          'Download your Word document',
          'Edit as needed in Microsoft Word'
        ]
      };

    case 'merge-pdf':
      return {
        ...baseConfig,
        maxFiles: 20,
        features: [
          'Combine multiple PDFs into one',
          'Maintain original quality',
          'Custom merge order',
          'Add bookmarks automatically'
        ],
        instructions: [
          'Upload all PDF files you want to merge',
          'Arrange files in desired order (drag and drop)',
          'Click "Process Files" to merge',
          'Download your merged PDF'
        ]
      };

    case 'split-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        features: [
          'Extract specific pages',
          'Split by page ranges',
          'Create separate PDF files',
          'Maintain original formatting'
        ],
        instructions: [
          'Upload the PDF file you want to split',
          'Specify page ranges or select individual pages',
          'Choose split options',
          'Download the split files'
        ]
      };

    case 'compress-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        features: [
          'Reduce file size significantly',
          'Multiple compression levels',
          'Maintain quality',
          'Optimize images and fonts'
        ],
        instructions: [
          'Upload your PDF file',
          'Select compression level (Low, Medium, High)',
          'Click "Process File" to compress',
          'Download your compressed PDF'
        ]
      };

    case 'ocr-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        features: [
          'Extract text from scanned PDFs',
          'Support for multiple languages',
          'Preserve document layout',
          'Export to PDF or text format'
        ],
        instructions: [
          'Upload your scanned PDF file',
          'Choose OCR options and language',
          'Click "Process File" to extract text',
          'Download the text or searchable PDF'
        ]
      };

    case 'crop-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        features: [
          'Remove unwanted margins',
          'Crop specific pages or all pages',
          'Support for multiple units (px, mm, in)',
          'Maintain original quality'
        ],
        instructions: [
          'Upload the PDF file you want to crop',
          'Set crop margins for each side',
          'Choose which pages to crop',
          'Download your cropped PDF'
        ]
      };

    case 'compare-pdf':
      return {
        ...baseConfig,
        maxFiles: 2,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Compare two PDF documents',
          'Text and visual comparison',
          'Detailed difference report',
          'Export comparison results'
        ],
        instructions: [
          'Upload 2 PDF files to compare',
          'Select comparison options',
          'Click "Process Files" to compare',
          'Download the comparison report'
        ]
      };

    default:
      return {
        ...baseConfig,
        features: [
          'Fast and secure processing',
          'High-quality results',
          'No registration required',
          'Files deleted after 2 hours'
        ],
        instructions: [
          'Upload your files',
          'Configure options if available',
          'Click "Process Files"',
          'Download the result'
        ]
      };
  }
};

// Generate dynamic metadata for each tool page
export async function generateMetadata({ params }: ToolPageProps): Promise<Metadata> {
  const { tool: toolId } = await params;
  const tool = PDF_TOOLS.find(t => t.id === toolId);

  if (!tool) {
    return {
      title: 'Tool Not Found - PDFPro.pro',
      description: 'The requested PDF tool could not be found.',
    };
  }

  return {
    title: `${tool.title} - Free Online ${tool.title} Tool | PDFPro.pro`,
    description: tool.description,
    keywords: tool.keywords.join(', ') + ', ' + SEO_CONFIG.keywords,
    openGraph: {
      title: `${tool.title} - PDFPro.pro`,
      description: tool.description,
      url: `${SEO_CONFIG.url}${tool.href}`,
      images: [
        {
          url: SEO_CONFIG.ogImage,
          width: 1200,
          height: 630,
          alt: `${tool.title} - PDFPro.pro`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.title} - PDFPro.pro`,
      description: tool.description,
      images: [SEO_CONFIG.ogImage],
    },
    alternates: {
      canonical: `${SEO_CONFIG.url}${tool.href}`,
    },
  };
}

export default async function ToolPageRoute({ params }: ToolPageProps) {
  const { tool: toolId } = await params;
  const tool = PDF_TOOLS.find(t => t.id === toolId);

  if (!tool) {
    notFound();
  }

  const config = getToolConfig(toolId);

  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <ToolPage
        tool={tool}
        description={tool.description}
        features={config.features}
        instructions={config.instructions}
        acceptedFileTypes={config.acceptedFileTypes}
        maxFiles={config.maxFiles}
        toolId={toolId}
        processingSteps={config.processingSteps}
      />
    </div>
  );
}