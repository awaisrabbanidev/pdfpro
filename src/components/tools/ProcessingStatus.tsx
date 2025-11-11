'use client';

import { motion } from 'framer-motion';

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  currentStep?: string;
  progress?: number;
  className?: string;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({
  steps,
  currentStep,
  progress = 0,
  className = ''
}) => {
  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending':
        return (
          <div className="w-4 h-4 border-2 border-gray-500 rounded-full" />
        );
      case 'processing':
        return (
          <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        );
      case 'completed':
        return (
          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-black" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
    }
  };

  const getStepColor = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'processing': return 'text-green-400';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-400';
    }
  };

  const getStepProgress = (step: ProcessingStep) => {
    if (step.status === 'completed') return 100;
    if (step.status === 'processing') return progress || 50;
    if (step.status === 'error') return 100;
    return 0;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-green-500 to-green-400 h-full rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      </div>

      {/* Progress text */}
      {currentStep && (
        <div className="text-center">
          <p className="text-gray-300 text-sm">
            Processing: <span className="text-green-400 font-medium">{currentStep}</span>
          </p>
          <p className="text-gray-500 text-xs mt-1">{Math.round(progress)}% complete</p>
        </div>
      )}

      {/* Steps list */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-3"
          >
            {/* Step icon */}
            <div className={`flex-shrink-0 ${getStepColor(step.status)}`}>
              {getStepIcon(step.status)}
            </div>

            {/* Step content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${getStepColor(step.status)}`}>
                  {step.label}
                </p>
                {step.status === 'error' && (
                  <span className="text-red-400 text-xs">Failed</span>
                )}
              </div>

              {/* Step error */}
              {step.error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="text-red-400 text-xs mt-1"
                >
                  {step.error}
                </motion.p>
              )}

              {/* Step progress bar */}
              {step.status !== 'pending' && (
                <div className="w-full bg-gray-700 rounded-full h-1 mt-2">
                  <motion.div
                    className={`h-full rounded-full ${
                      step.status === 'error' ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${getStepProgress(step)}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Processing animation for active processing */}
      {steps.some(step => step.status === 'processing') && (
        <div className="flex justify-center py-4">
          <div className="flex space-x-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-green-500 rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;