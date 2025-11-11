import { notFound } from 'next/navigation';
import ToolPage from '@/components/tools/ToolPage';
import { PDF_TOOLS } from '@/lib/constants';

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
      } else if (toolId === 'compress-pdf' || toolId === 'pdf-to-word' || toolId === 'word-to-pdf') {
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
        onProcessFiles={config.onProcessFiles}
        processingSteps={config.processingSteps}
      />
    </div>
  );
}