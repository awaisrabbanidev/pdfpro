'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  digest?: string;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo, digest?: string) => void;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Generate a digest for this error
    const digest = this.generateDigest(error, errorInfo);

    // Update state with error info including digest
    this.setState({
      hasError: true,
      error,
      errorInfo,
      digest
    });

    // Log detailed error information for debugging
    console.error('🔥 SERVER COMPONENT ERROR', {
      error: error.message,
      stack: error.stack,
      digest,
      componentStack: errorInfo.componentStack,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server-side'
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo, digest);
    }
  }

  // Generate a deterministic digest from error information
  private generateDigest(error: Error, errorInfo: ErrorInfo): string {
    // Create a deterministic hash from error information
    const errorString = `${error.name}:${error.message}:${errorInfo.componentStack}:${errorInfo.componentName}`;

    // Simple hash function to create a deterministic digest
    let hash = 0;
    for (let i = 0; i < errorString.length; i++) {
      const char = errorString.charCodeAt(i);
      hash = ((hash << 5) - hash + char) & 0xffffffff;
    }

    return hash.toString(16).padStart(8, '0');
  }

  private handleResetError = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return <Fallback error={this.state.error} resetError={this.handleResetError} />;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
          <div className="bg-red-900 border border-red-700 rounded-lg p-8 max-w-md w-full text-center">
            <div className="text-red-300 text-2xl mb-4">⚠️ Something went wrong</div>
            <div className="text-white text-lg mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </div>

            <div className="text-gray-400 text-sm mb-6">
              <p className="mb-2">Error ID: {this.state.digest}</p>
              {this.state.errorInfo?.componentName && (
                <p>Component: {this.state.errorInfo.componentName}</p>
              )}
            </div>

            <button
              onClick={this.handleResetError}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Try Again
            </button>

            {this.state.error && process.env.NODE_ENV === 'development' && (
              <details className="text-left mt-6 text-left">
                <summary className="cursor-pointer text-gray-400 hover:text-white">
                  Show Debug Information (Development Only)
                </summary>
                <div className="mt-4 p-4 bg-black bg-opacity-50 rounded text-left text-xs font-mono text-gray-300">
                  <div className="mb-2"><strong>Error:</strong> {this.state.error.message}</div>
                  {this.state.error.stack && (
                    <div className="mb-2">
                      <strong>Stack Trace:</strong>
                      <pre className="whitespace-pre-wrap break-words">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mb-2">
                      <strong>Component Stack:</strong>
                      <pre className="whitespace-pre-wrap break-words">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                  <div>
                    <strong>Timestamp:</strong> {new Date().toISOString()}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to add error boundary to any component
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Preserve component name for debugging
  WrappedComponent.displayName = `withErrorBoundary(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}

export default ErrorBoundary;