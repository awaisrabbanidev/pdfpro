'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';
import { MAX_FILE_SIZE, SUPPORTED_FILE_TYPES } from '@/lib/constants';

interface FileUploaderProps {
  onFilesChange: (files: File[]) => void;
  accept?: string[];
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesChange,
  accept = SUPPORTED_FILE_TYPES,
  maxFiles = 10,
  maxSize = MAX_FILE_SIZE,
  disabled = false,
  className = ''
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    setError(null);

    if (rejectedFiles.length > 0) {
      const firstRejection = rejectedFiles[0];
      if (firstRejection.errors.some((error: any) => error.code === 'file-too-large')) {
        setError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      } else if (firstRejection.errors.some((error: any) => error.code === 'file-invalid-type')) {
        setError('Invalid file type. Please upload supported file formats');
      } else {
        setError('File upload failed. Please try again');
      }
      return;
    }

    setFiles(acceptedFiles);
    onFilesChange(acceptedFiles);
  }, [maxSize, onFilesChange]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    maxFiles,
    maxSize,
    disabled
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  const clearFiles = () => {
    setFiles([]);
    onFilesChange([]);
    setError(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-green-500 bg-green-500/10'
            : isDragReject
            ? 'border-red-500 bg-red-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />

        <div className="space-y-4">
          <div className="text-4xl">
            {isDragActive ? '📁' : '📄'}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-white">
              {isDragActive
                ? 'Drop your files here'
                : 'Click to upload or drag and drop'
              }
            </h3>
            <p className="text-gray-400 text-sm">
              {accept.includes('application/pdf') ? 'PDF files' : 'Supported files'} up to {maxSize / (1024 * 1024)}MB
            </p>
          </div>

          {!isDragActive && (
            <Button variant="outline" size="sm" disabled={disabled}>
              Choose Files
            </Button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-white font-medium">
              {files.length} {files.length === 1 ? 'file' : 'files'} selected
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFiles}
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-2">
            {files.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="text-2xl flex-shrink-0">
                    {file.type === 'application/pdf' ? '📄' :
                     file.type.includes('word') ? '📝' :
                     file.type.includes('excel') ? '📊' :
                     file.type.includes('powerpoint') ? '📊' :
                     file.type.includes('image') ? '🖼️' : '📄'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{file.name}</p>
                    <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="flex-shrink-0 ml-3"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FileUploader;