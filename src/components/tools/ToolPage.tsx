'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
import FileUploader from './FileUploader';
import ProcessingStatus, { ProcessingStep } from './ProcessingStatus';
import ResultDownload, { DownloadFile } from './ResultDownload';
// [FIXED] Replaced path aliases with relative paths
import { PDFTool } from '../../lib/constants';
import { getCanonicalUrl } from '../../lib/url-config';

interface ToolPageProps {
  tool: PDFTool;
  description: string;
  features: string[];
  instructions: string[];
  acceptedFileTypes: string[];
  maxFiles?: number;
  toolId: string;
  processingSteps: Omit<ProcessingStep, 'status' | 'error'>[];
  className?: string;
}

type ToolState = 'upload' | 'processing' | 'complete' | 'error';

const ToolPage: React.FC<ToolPageProps> = ({
  tool,
  description,
  features,
  instructions,
  acceptedFileTypes,
  maxFiles = 10,
  toolId,
  processingSteps,
  className = ''
}) => {
  const [state, setState] = useState<ToolState>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<DownloadFile[]>([]);
  const [processingStepsWithStatus, setProcessingStepsWithStatus] = useState<ProcessingStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
    setError(null);
  };

  const startProcessing = async () => {
    if (files.length === 0) return;

    setState('processing');
    setError(null);
    setProgress(0);

    const initialSteps: ProcessingStep[] = processingSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'processing' : 'pending'
    }));
    setProcessingStepsWithStatus(initialSteps);

    try {
      for (let i = 0; i < processingSteps.length; i++) {
        setProcessingStepsWithStatus(prev => prev.map((step, index) =>
          index === i ? { ...step, status: 'processing' } : step
        ));
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        setProcessingStepsWithStatus(prev => prev.map((step, index) =>
          index === i ? { ...step, status: 'completed' } : step
        ));
        setProgress(((i + 1) / processingSteps.length) * 100);
      }

      const formData = new FormData();
      files.forEach((file) => {
        if (files.length === 1) {
          formData.append('file', file);
        } else {
          formData.append('files', file);
        }
      });

      const response = await fetch(`/api/pdf/${toolId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown processing error' }));
        throw new Error(errorData.error || 'Processing failed');
      }

      const data = await response.json();
      if (data.success && data.base64) {
        const blob = new Blob([Uint8Array.from(atob(data.base64), c => c.charCodeAt(0))], { type: 'application/pdf' });
        const downloadFile: DownloadFile = {
          id: `file-${Date.now()}`,
          name: data.filename || `processed-${Date.now()}.pdf`,
          url: URL.createObjectURL(blob),
          size: blob.size,
          type: 'application/pdf'
        };
        setProcessedFiles([downloadFile]);
        setState('complete');
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);

      setProcessingStepsWithStatus(prev => {
        const updated = [...prev];
        const currentStep = updated.find(step => step.status === 'processing');
        if (currentStep) {
          currentStep.status = 'error';
          currentStep.error = errorMessage;
        }
        return updated;
      });
      setState('error');
    }
  };

  const resetTool = () => {
    setState('upload');
    setFiles([]);
    setProcessedFiles([]);
    setProcessingStepsWithStatus([]);
    setProgress(0);
    setError(null);
  };

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-4">{tool.icon}</div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{tool.title}</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">{description}</p>
      </motion.div>

      {state === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Upload your files:</h3>
              <FileUploader
                onFilesChange={handleFilesChange}
                accept={acceptedFileTypes}
                maxFiles={maxFiles}
              />
            </div>
            {files.length > 0 && (
              <div className="flex justify-center">
                <Button onClick={startProcessing} glow size="lg" className="min-w-48">
                  Process {files.length} {files.length === 1 ? 'File' : 'Files'}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {state === 'processing' && (
        <ProcessingStatus
          steps={processingStepsWithStatus}
          progress={progress}
        />
      )}
      
      {state === 'complete' && (
        <ResultDownload
          files={processedFiles}
          className="py-8"
        />
      )}

      {state === 'error' && (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-4">Processing Failed</h3>
          {error && <p className="text-red-400 mb-6">{error}</p>}
          <Button onClick={resetTool} variant="outline">Try Again</Button>
        </div>
      )}
    </div>
  );
};

export default ToolPage;
