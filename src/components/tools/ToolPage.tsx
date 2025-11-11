'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import FileUploader from './FileUploader';
import ProcessingStatus, { ProcessingStep } from './ProcessingStatus';
import ResultDownload, { DownloadFile } from './ResultDownload';
import { PDFTool } from '@/lib/constants';

interface ToolPageProps {
  tool: PDFTool;
  description: string;
  features: string[];
  instructions: string[];
  acceptedFileTypes: string[];
  maxFiles?: number;
  onProcessFiles: (files: File[]) => Promise<DownloadFile[]>;
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
  onProcessFiles,
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

    // Initialize processing steps
    const initialSteps: ProcessingStep[] = processingSteps.map((step, index) => ({
      ...step,
      status: index === 0 ? 'processing' : 'pending'
    }));
    setProcessingStepsWithStatus(initialSteps);

    try {
      // Simulate processing progress
      const updateStep = (stepIndex: number, status: ProcessingStep['status'], error?: string) => {
        setProcessingStepsWithStatus(prev => prev.map((step, index) =>
          index === stepIndex ? { ...step, status, error } : step
        ));
        setProgress(((stepIndex + 1) / processingSteps.length) * 100);
      };

      // Process each step
      for (let i = 0; i < processingSteps.length; i++) {
        updateStep(i, 'processing');

        // Simulate processing time for each step
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

        updateStep(i, 'completed');
      }

      // Process files
      const result = await onProcessFiles(files);
      setProcessedFiles(result);
      setState('complete');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);

      // Mark current step as failed
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

  const currentProcessingStep = processingStepsWithStatus.find(step => step.status === 'processing')?.label;

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Tool Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="text-5xl mb-4">{tool.icon}</div>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{tool.title}</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">{description}</p>
      </motion.div>

      {/* Features */}
      {features.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-2 text-gray-300">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8"
      >
        {state === 'upload' && (
          <div className="space-y-6">
            {/* Instructions */}
            {instructions.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">How to use:</h3>
                <ol className="space-y-2">
                  {instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-3 text-gray-300 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-black rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* File Upload */}
            <div>
              <h3 className="text-white font-medium mb-4">Upload your files:</h3>
              <FileUploader
                onFilesChange={handleFilesChange}
                accept={acceptedFileTypes}
                maxFiles={maxFiles}
              />
            </div>

            {/* Action Button */}
            {files.length > 0 && (
              <div className="flex justify-center">
                <Button
                  onClick={startProcessing}
                  glow
                  size="lg"
                  className="min-w-48"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Process {files.length} {files.length === 1 ? 'File' : 'Files'}
                </Button>
              </div>
            )}
          </div>
        )}

        {state === 'processing' && (
          <div className="space-y-6">
            <h3 className="text-white font-medium mb-4">Processing your files...</h3>
            <ProcessingStatus
              steps={processingStepsWithStatus}
              currentStep={currentProcessingStep}
              progress={progress}
            />
          </div>
        )}

        {state === 'complete' && (
          <ResultDownload
            files={processedFiles}
            className="py-8"
          />
        )}

        {state === 'error' && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-xl font-semibold text-white mb-4">Processing Failed</h3>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                <p className="text-red-400">{error}</p>
              </div>
            )}
            <div className="flex justify-center space-x-4">
              <Button onClick={resetTool} variant="outline">
                Try Again
              </Button>
              <Button onClick={() => window.history.back()} variant="ghost">
                Go Back
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Tips Section */}
      {state === 'upload' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-white font-medium mb-4 flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Pro Tips
          </h3>
          <ul className="space-y-2 text-gray-300 text-sm">
            <li>• Supported file types: {acceptedFileTypes.map(type => type.split('/')[1]?.toUpperCase() || type).join(', ')}</li>
            <li>• Maximum file size: 20MB per file</li>
            <li>• All files are processed securely and automatically deleted after 2 hours</li>
            <li>• You can process up to {maxFiles} files at once for better efficiency</li>
          </ul>
        </motion.div>
      )}
    </div>
  );
};

export default ToolPage;