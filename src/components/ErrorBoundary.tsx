import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="h-full flex items-center justify-center bg-dark-bg">
          <div className="text-center p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-4">
              An unexpected error occurred. Please try refreshing the application.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-gray-500 bg-darker-bg p-3 rounded">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="whitespace-pre-wrap">{this.state.error.message}</pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-roblox-blue hover:bg-blue-600 text-white rounded transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 