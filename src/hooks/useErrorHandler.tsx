import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { 
  logError, 
  handleError, 
  ErrorSeverity, 
  ErrorCategory, 
  createErrorContext 
} from '@/utils/errorHandler';

interface UseErrorHandlerOptions {
  component: string;
  showToast?: boolean;
}

/**
 * Custom hook for handling errors in components
 */
export const useErrorHandler = (options: UseErrorHandlerOptions) => {
  const { component, showToast = true } = options;
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle an async operation with proper error handling
   */
  const handleAsync = useCallback(async <T extends any>(
    asyncFn: () => Promise<T>,
    options?: {
      action: string;
      onSuccess?: (result: T) => void;
      onError?: (error: any) => void;
      context?: Record<string, any>;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      userMessage?: string;
      showToast?: boolean;
    }
  ): Promise<T | null> => {
    const { 
      action, 
      onSuccess, 
      onError, 
      context = {}, 
      severity = ErrorSeverity.ERROR,
      category = ErrorCategory.UNKNOWN,
      userMessage,
      showToast: showToastOverride = showToast
    } = options || { action: 'unknown' };

    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      
      setIsLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err: any) {
      setIsLoading(false);
      
      const errorContext = createErrorContext(component, action, context);
      
      const formattedError = logError(err, {
        severity,
        category,
        userMessage,
        context: errorContext,
      });
      
      const errorMessage = formattedError.userMessage;
      setError(errorMessage);
      
      if (showToastOverride) {
        toast({
          title: severity === ErrorSeverity.CRITICAL ? 'Critical Error' : 
                 severity === ErrorSeverity.ERROR ? 'Error' : 
                 severity === ErrorSeverity.WARNING ? 'Warning' : 'Notice',
          description: errorMessage,
          variant: severity === ErrorSeverity.INFO ? 'default' : 'destructive',
        });
      }
      
      if (onError) {
        onError(err);
      }
      
      return null;
    }
  }, [component, showToast, toast]);

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Set a custom error message
   */
  const setCustomError = useCallback((message: string, showToastOverride = showToast) => {
    setError(message);
    
    if (showToastOverride) {
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    }
  }, [showToast, toast]);

  return {
    error,
    isLoading,
    handleAsync,
    clearError,
    setError: setCustomError,
  };
};

export default useErrorHandler;
