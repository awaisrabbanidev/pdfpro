import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ToolPage from '@/components/tools/ToolPage';
import { PDF_TOOLS, SEO_CONFIG } from '@/lib/constants';

export const dynamic = 'force-dynamic';

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
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'analyze', label: 'Analyze document structure' },
        { id: 'extract', label: 'Extract text and layout' },
        { id: 'convert', label: 'Convert to Word format' },
        { id: 'format', label: 'Format document' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'pdf-to-excel':
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'analyze', label: 'Analyze document structure' },
        { id: 'extract', label: 'Extract tables and data' },
        { id: 'convert', label: 'Convert to Excel format' },
        { id: 'format', label: 'Format spreadsheet' },
        { id: 'complete', label: 'Complete' }
      ];

    case 'pdf-to-powerpoint':
      return [
        { id: 'upload', label: 'Upload PDF file' },
        { id: 'analyze', label: 'Analyze document layout' },
        { id: 'extract', label: 'Extract slides and content' },
        { id: 'convert', label: 'Convert to PowerPoint format' },
        { id: 'format', label: 'Format presentation' },
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


// Tool-specific configurations
const getToolConfig = (toolId: string) => {
  const baseConfig = {
    processingSteps: getDefaultProcessingSteps(toolId).map(step => ({
      ...step,
      status: 'pending' as const,
      error: undefined
    })),
    maxFiles: 10,
    acceptedFileTypes: ['application/pdf']
  };

  switch (toolId) {
    // Conversion Tools - FROM different formats TO PDF
    case 'word-to-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        acceptedFileTypes: [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
          'application/msword', // .doc
          'application/vnd.ms-word', // .doc
          'application/vnd.ms-word.document.macroEnabled.12', // .docm
          'application/vnd.openxmlformats-officedocument.wordprocessingml.template', // .dotx
          'application/vnd.ms-word.template.macroEnabled.12' // .dotm
        ],
        features: [
          'Convert DOC and DOCX files to PDF',
          'Preserves original formatting',
          'Maintains images and layouts',
          'High-quality PDF output'
        ],
        instructions: [
          'Upload your Word document (.doc, .docx)',
          'Wait for the conversion to complete',
          'Download your PDF file',
          'Share or print as needed'
        ]
      };

    case 'excel-to-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        acceptedFileTypes: [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
          'application/vnd.ms-excel', // .xls
          'application/vnd.ms-excel.sheet.macroEnabled.12', // .xlsm
          'application/vnd.openxmlformats-officedocument.spreadsheetml.template', // .xltx
          'application/vnd.ms-excel.template.macroEnabled.12' // .xltm
        ],
        features: [
          'Convert Excel spreadsheets to PDF',
          'Preserves tables and formatting',
          'Maintains charts and graphs',
          'Supports multiple worksheets'
        ],
        instructions: [
          'Upload your Excel file (.xls, .xlsx)',
          'Choose worksheet options',
          'Wait for the conversion to complete',
          'Download your PDF file'
        ]
      };

    case 'powerpoint-to-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        acceptedFileTypes: [
          'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
          'application/vnd.ms-powerpoint', // .ppt
          'application/vnd.ms-powerpoint.presentation.macroEnabled.12', // .pptm
          'application/vnd.openxmlformats-officedocument.presentationml.template', // .potx
          'application/vnd.ms-powerpoint.template.macroEnabled.12' // .potm
        ],
        features: [
          'Convert PowerPoint presentations to PDF',
          'Preserves slides and animations',
          'Maintains speaker notes',
          'High-quality output for printing'
        ],
        instructions: [
          'Upload your PowerPoint file (.ppt, .pptx)',
          'Wait for the conversion to complete',
          'Download your PDF file',
          'Perfect for sharing and printing'
        ]
      };

    case 'jpg-to-pdf':
      return {
        ...baseConfig,
        maxFiles: 20,
        acceptedFileTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/gif',
          'image/bmp',
          'image/webp'
        ],
        features: [
          'Convert multiple images to PDF',
          'Supports JPG, PNG, GIF, BMP formats',
          'Maintain image quality',
          'Custom page layout options'
        ],
        instructions: [
          'Upload one or more images',
          'Arrange order if needed (drag and drop)',
          'Click "Process Files" to convert',
          'Download your PDF file'
        ]
      };

    case 'html-to-pdf':
      return {
        ...baseConfig,
        maxFiles: 1,
        acceptedFileTypes: [
          'text/html',
          'application/html',
          'text/plain',
          'application/xhtml+xml'
        ],
        features: [
          'Convert HTML files to PDF',
          'Preserve CSS styling',
          'Maintain web page layout',
          'Support for interactive content'
        ],
        instructions: [
          'Upload your HTML file',
          'Configure page settings',
          'Click "Process File" to convert',
          'Download your PDF file'
        ]
      };

    // Conversion Tools - FROM PDF TO different formats
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

    // Add remaining tool configurations
    case 'pdf-to-excel':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Extract tables from PDFs to Excel',
          'Preserve data formatting',
          'Convert PDF tables accurately',
          'Supports complex spreadsheet layouts'
        ],
        instructions: [
          'Upload your PDF file containing tables',
          'Wait for the extraction to complete',
          'Download your Excel spreadsheet',
          'Edit data in Microsoft Excel'
        ]
      };

    case 'pdf-to-powerpoint':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Convert PDF pages to PowerPoint slides',
          'Preserve text and images',
          'Create editable presentations',
          'Maintain slide layout'
        ],
        instructions: [
          'Upload your PDF file',
          'Wait for the conversion to complete',
          'Download your PowerPoint file',
          'Edit slides in PowerPoint'
        ]
      };

    case 'pdf-to-jpg':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Convert PDF pages to high-quality JPG images',
          'Choose resolution and quality',
          'Extract specific pages',
          'Batch conversion support'
        ],
        instructions: [
          'Upload your PDF file',
          'Choose image quality and pages',
          'Wait for the conversion to complete',
          'Download your JPG images'
        ]
      };

    case 'sign-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Add digital signatures to PDFs',
          'Draw or type your signature',
          'Add signature fields',
          'Legally binding signatures'
        ],
        instructions: [
          'Upload your PDF file',
          'Create or upload your signature',
          'Place signature on the document',
          'Download your signed PDF'
        ]
      };

    case 'repair-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Fix corrupted or damaged PDFs',
          'Recover content from broken files',
          'Repair PDF structure errors',
          'Restore document formatting'
        ],
        instructions: [
          'Upload your damaged PDF file',
          'Wait for the repair process',
          'Review the recovered content',
          'Download your repaired PDF'
        ]
      };

    case 'protect-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Add password protection',
          'Encrypt PDF content',
          'Set printing and copying restrictions',
          'Secure sensitive documents'
        ],
        instructions: [
          'Upload your PDF file',
          'Set your password and security options',
          'Choose protection level',
          'Download your protected PDF'
        ]
      };

    case 'unlock-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Remove password protection',
          'Unlock restricted PDFs',
          'Restore access to content',
          'Multiple password attempts'
        ],
        instructions: [
          'Upload your password-protected PDF',
          'Enter the PDF password',
          'Wait for the unlock process',
          'Download your unlocked PDF'
        ]
      };

    case 'watermark':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Add text or image watermarks',
          'Custom watermark position',
          'Adjust opacity and size',
          'Batch watermark support'
        ],
        instructions: [
          'Upload your PDF file',
          'Create your watermark (text or image)',
          'Set position and opacity',
          'Download your watermarked PDF'
        ]
      };

    case 'redact-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Permanently remove sensitive content',
          'Black out text and images',
          'Search and redact specific terms',
          'Secure document sanitization'
        ],
        instructions: [
          'Upload your PDF file',
          'Highlight areas to redact',
          'Confirm redaction selections',
          'Download your redacted PDF'
        ]
      };

    case 'scan-to-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: [
          'image/jpeg',
          'image/jpg',
          'image/png',
          'image/tiff',
          'image/bmp'
        ],
        features: [
          'Convert scanned documents to searchable PDFs',
          'OCR text recognition technology',
          'Multiple language support',
          'Preserve original image quality'
        ],
        instructions: [
          'Upload your scanned document images',
          'Choose OCR language options',
          'Wait for processing to complete',
          'Download your searchable PDF'
        ]
      };

    case 'organize-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Rearrange pages easily',
          'Add or remove pages',
          'Rotate page orientation',
          'Combine with other PDFs'
        ],
        instructions: [
          'Upload your PDF file',
          'Drag and drop to reorder pages',
          'Add, remove, or rotate pages',
          'Download your organized PDF'
        ]
      };

    case 'rotate-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Rotate pages 90°, 180°, 270°',
          'Rotate individual pages',
          'Batch rotation support',
          'Preserve document quality'
        ],
        instructions: [
          'Upload your PDF file',
          'Select pages and rotation angle',
          'Preview the rotation',
          'Download your rotated PDF'
        ]
      };

    case 'page-numbers':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Add page numbers automatically',
          'Custom number formatting',
          'Position numbers on page',
          'Starting number options'
        ],
        instructions: [
          'Upload your PDF file',
          'Choose number format and position',
          'Set starting number',
          'Download your numbered PDF'
        ]
      };

    case 'edit-pdf':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Edit text in PDFs',
          'Add or modify images',
          'Annotate and markup',
          'Form field editing'
        ],
        instructions: [
          'Upload your PDF file',
          'Use editing tools to modify content',
          'Save your changes',
          'Download your edited PDF'
        ]
      };

    case 'pdf-to-pdfa':
      return {
        ...baseConfig,
        acceptedFileTypes: ['application/pdf'],
        features: [
          'Convert to PDF/A format for archiving',
          'Long-term document preservation',
          'ISO standard compliance',
          'Metadata optimization'
        ],
        instructions: [
          'Upload your PDF file',
          'Choose PDF/A version (PDF/A-1, PDF/A-2, PDF/A-3)',
          'Wait for the conversion to complete',
          'Download your PDF/A file'
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