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

// Default processing functions
const getDefaultProcessFunction = (toolId: string) => {
  return async (files: File[]) => {
    // Simulate processing for now
    await new Promise(resolve => setTimeout(resolve, 2000));

    return files.map((file, index) => ({
      id: `${file.name}-${index}`,
      name: `processed_${file.name}`,
      url: '#', // Will be replaced with actual file URL
      size: file.size,
      type: file.type
    }));
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