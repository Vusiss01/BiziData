import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, XCircle } from 'lucide-react';

interface ErrorDisplayProps {
  error: string | null;
  title?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'compact' | 'inline';
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = 'Error',
  onRetry,
  onDismiss,
  variant = 'default',
  className = '',
}) => {
  if (!error) return null;

  // Compact variant (just an alert with error message)
  if (variant === 'compact') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Inline variant (text only with icon)
  if (variant === 'inline') {
    return (
      <div className={`flex items-center text-red-600 text-sm ${className}`}>
        <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
        <span>{error}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 text-gray-500 hover:text-gray-700"
            aria-label="Dismiss error"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // Default variant (alert with buttons)
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <div className="flex flex-col">
        <AlertDescription className="mb-3">{error}</AlertDescription>
        <div className="flex gap-2 justify-end">
          {onDismiss && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="h-8 px-2 text-xs"
            >
              Dismiss
            </Button>
          )}
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 px-2 text-xs flex items-center"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};

export default ErrorDisplay;
