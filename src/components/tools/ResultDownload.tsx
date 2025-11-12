'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { saveAs } from 'file-saver';
import Button from '../ui/Button';

export interface DownloadFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type?: string;
  data?: string;
}

interface ResultDownloadProps {
  files: DownloadFile[];
  onDownloadAll?: () => void;
  onDownloadSingle?: (file: DownloadFile) => void;
  showPreview?: boolean;
  className?: string;
}

const ResultDownload: React.FC<ResultDownloadProps> = ({
  files,
  onDownloadAll,
  onDownloadSingle,
  showPreview = false,
  className = ''
}) => {
  const [downloading, setDownloading] = useState<Set<string>>(new Set());

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type?: string) => {
    if (!type) return '📄';

    if (type === 'application/pdf') return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel')) return '📊';
    if (type.includes('powerpoint')) return '📊';
    if (type.includes('image')) return '🖼️';
    if (type.includes('zip')) return '🗜️';

    return '📄';
  };

  const handleDownload = async (file: DownloadFile) => {
    if (downloading.has(file.id)) return;

    setDownloading(prev => new Set(prev).add(file.id));

    try {
      if (onDownloadSingle) {
        onDownloadSingle(file);
      } else {
        // Default download behavior
        const response = await fetch(file.url);
        const blob = await response.blob();
        saveAs(blob, file.name);
      }
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      setDownloading(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleDownloadAll = async () => {
    if (downloading.size > 0) return;

    if (onDownloadAll) {
      onDownloadAll();
      return;
    }

    // Download all files sequentially
    for (const file of files) {
      await handleDownload(file);
    }
  };

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-4">📂</div>
        <p className="text-gray-400">No files to download</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Success message */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6"
      >
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-semibold text-white mb-2">
          Processing Complete!
        </h3>
        <p className="text-gray-400">
          Your {files.length === 1 ? 'file' : 'files'} are ready for download
        </p>
      </motion.div>

      {/* Download all button */}
      {files.length > 1 && (
        <div className="flex justify-center">
          <Button
            onClick={handleDownloadAll}
            disabled={downloading.size > 0}
            glow
            size="lg"
            className="min-w-48"
          >
            {downloading.size > 0 ? (
              <>
                <div className="loading-spinner mr-2" />
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download All ({files.length})
              </>
            )}
          </Button>
        </div>
      )}

      {/* Individual files */}
      <div className="space-y-3 mt-6">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg hover:border-green-500/50 transition-all"
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="text-2xl flex-shrink-0">
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{file.name}</p>
                <p className="text-gray-400 text-sm">{formatFileSize(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {showPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(file.url, '_blank')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Button>
              )}

              <Button
                onClick={() => handleDownload(file)}
                disabled={downloading.has(file.id)}
                variant="outline"
                size="sm"
              >
                {downloading.has(file.id) ? (
                  <div className="loading-spinner" />
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <Button variant="ghost" onClick={() => window.history.back()}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Process More Files
        </Button>
        <Button variant="ghost" onClick={() => window.location.reload()}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Start New Task
        </Button>
      </div>

      {/* Security notice */}
      <div className="text-center text-xs text-gray-500 mt-6">
        <p>🔒 All files are automatically deleted from our servers after 2 hours for your privacy</p>
      </div>
    </div>
  );
};

export default ResultDownload;