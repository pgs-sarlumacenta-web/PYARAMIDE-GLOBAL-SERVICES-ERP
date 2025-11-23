import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-red-50 dark:bg-red-900/10 rounded-xl p-8 text-center border border-red-200 dark:border-red-800 m-4">
          <div className="bg-red-100 dark:bg-red-800 p-4 rounded-full mb-4">
             <ExclamationTriangleIcon className="h-10 w-10 text-red-600 dark:text-red-200" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Oups, une erreur est survenue.</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
            Le module a rencontré un problème inattendu. Nos équipes techniques ont été notifiées.
          </p>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm mb-6 text-left w-full max-w-lg overflow-auto max-h-32 border border-gray-200 dark:border-gray-700">
             <code className="text-xs text-red-500 font-mono">
                {this.state.error?.toString()}
             </code>
          </div>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-lg"
          >
            <ArrowPathIcon className="h-5 w-5 mr-2" />
            Recharger la page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;