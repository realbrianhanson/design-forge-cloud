import { Component, ReactNode } from 'react';
import { RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
          <div className="text-center max-w-md animate-fade-in">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </div>
            
            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
              Something went wrong
            </h1>
            
            {/* Subtext */}
            <p className="text-muted-foreground mb-8 leading-relaxed">
              We're working on it. Please try again later or refresh the page.
            </p>
            
            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="gap-2" onClick={this.handleRefresh}>
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="gap-2"
                onClick={this.handleGoHome}
              >
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </div>
            
            {/* Error Details (dev mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-8 text-left p-4 bg-muted rounded-lg">
                <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto text-destructive">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
