'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../ui/Button';
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

  // Helper function to make API calls with timeout and error handling
  const makeApiCall = async (url: string, options: RequestInit): Promise<Response> => {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(59000) // 59 second timeout (less than 60s Vercel limit)
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`API Error (${response.status}):`, errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout after 59 seconds. Please try again with a smaller file.');
      }
      throw error;
    }
  };

  // Processing function moved to client side
  const processFiles = async (files: File[]): Promise<DownloadFile[]> => {
    try {
      // Solution 2: File Size Validation (Vercel limit is 4.5MB)
      const MAX_FILE_SIZE = 4.5 * 1024 * 1024; // 4.5MB in bytes
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File "${file.name}" is too large. Maximum file size is 4.5MB. File size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        }
      }

      if (totalSize > MAX_FILE_SIZE) {
        throw new Error(`Total file size is too large. Maximum total size is 4.5MB. Total size: ${(totalSize / 1024 / 1024).toFixed(1)}MB`);
      }

      let response;
      // Dynamic API URL detection for all domain variants (www, non-www, development)
      const baseUrl = typeof window !== 'undefined'
        ? (window.location.hostname === 'localhost' || window.location.hostname === '172.19.3.10')
          ? 'http://localhost:3001'
          : `${window.location.protocol}//${window.location.hostname}`
        : 'https://www.pdfpro.pro';

      console.log('🔍 API Debug Info:', {
        NODE_ENV: process.env.NODE_ENV,
        baseUrl,
        windowOrigin: typeof window !== 'undefined' ? window.location.origin : 'N/A',
        currentHostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
        fileSizeValidation: `✅ File sizes validated (Max: 4.5MB each, Total: ${(totalSize / 1024 / 1024).toFixed(1)}MB)`
      });

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
          console.log('🚀 Making API call to:', `${baseUrl}/api/pdf/merge`);
          response = await makeApiCall(`${baseUrl}/api/pdf/merge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              files: filesAsBase64,
              outputName: `merged_${Date.now()}.pdf`
            })
          });
          console.log('📥 API Response status:', response.status);
          break;

        case 'split-pdf':
          response = await makeApiCall(`${baseUrl}/api/pdf/split`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              splitType: 'single'
            })
          });
          break;

        case 'compress-pdf':
          response = await makeApiCall(`${baseUrl}/api/pdf/compress`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              compressionLevel: 'medium'
            })
          });
          break;

        case 'pdf-to-word':
          response = await makeApiCall(`${baseUrl}/api/pdf/pdf-to-word`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/word-to-pdf`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/ocr`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/crop`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/compare`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/pdf-to-powerpoint`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/pdf-to-excel`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/powerpoint-to-pdf`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/excel-to-pdf`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/pdf-to-jpg`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/jpg-to-pdf`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/rotate`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/protect`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/watermark`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/html-to-pdf`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/sign`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/unlock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              file: filesAsBase64[0],
              password: 'unlock'
            })
          });
          break;

        case 'page-numbers':
          response = await makeApiCall(`${baseUrl}/api/pdf/page-numbers`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/organize`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/edit`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/repair`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/redact`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/pdf-to-pdfa`, {
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
          response = await makeApiCall(`${baseUrl}/api/pdf/scan-to-pdf`, {
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

    } catch (error) {
      console.error('Processing error:', error);
      throw error;
    }
  };

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
      const result = await processFiles(files);
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