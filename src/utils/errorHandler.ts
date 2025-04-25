import { PostgrestError } from '@supabase/supabase-js';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

/**
 * Error categories for better organization
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown',
}

/**
 * Structured error interface
 */
export interface AppError {
  message: string;
  userMessage: string;
  code?: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  originalError?: any;
  context?: Record<string, any>;
  timestamp: string;
}

/**
 * Error handler configuration
 */
interface ErrorHandlerConfig {
  logToConsole: boolean;
  logToServer: boolean;
  captureContext: boolean;
}

/**
 * Default configuration
 */
const defaultConfig: ErrorHandlerConfig = {
  logToConsole: true,
  logToServer: false,
  captureContext: true,
};

/**
 * Global configuration
 */
let config: ErrorHandlerConfig = { ...defaultConfig };

/**
 * Configure the error handler
 */
export const configureErrorHandler = (newConfig: Partial<ErrorHandlerConfig>) => {
  config = { ...config, ...newConfig };
};

/**
 * Format an error into a structured AppError
 */
export const formatError = (
  error: any,
  options?: {
    userMessage?: string;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    context?: Record<string, any>;
  }
): AppError => {
  const timestamp = new Date().toISOString();
  
  // Handle Supabase PostgrestError
  if (error && 'code' in error && 'message' in error && 'details' in error) {
    const postgrestError = error as PostgrestError;
    
    // Determine category based on error code
    let category = ErrorCategory.DATABASE;
    let severity = options?.severity || ErrorSeverity.ERROR;
    
    if (postgrestError.code === '42501') {
      category = ErrorCategory.PERMISSION;
    } else if (postgrestError.code === '23505') {
      category = ErrorCategory.VALIDATION;
      severity = ErrorSeverity.WARNING;
    } else if (postgrestError.code === '23503') {
      category = ErrorCategory.VALIDATION;
    } else if (postgrestError.code?.startsWith('28')) {
      category = ErrorCategory.AUTHENTICATION;
    }
    
    return {
      message: postgrestError.message,
      userMessage: options?.userMessage || getUserFriendlyMessage(postgrestError),
      code: postgrestError.code,
      severity: severity,
      category: options?.category || category,
      originalError: postgrestError,
      context: options?.context || {},
      timestamp,
    };
  }
  
  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      message: error.message,
      userMessage: options?.userMessage || 'An unexpected error occurred. Please try again.',
      severity: options?.severity || ErrorSeverity.ERROR,
      category: options?.category || ErrorCategory.UNKNOWN,
      originalError: error,
      context: options?.context || {},
      timestamp,
    };
  }
  
  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      userMessage: options?.userMessage || error,
      severity: options?.severity || ErrorSeverity.ERROR,
      category: options?.category || ErrorCategory.UNKNOWN,
      context: options?.context || {},
      timestamp,
    };
  }
  
  // Handle unknown errors
  return {
    message: 'Unknown error occurred',
    userMessage: options?.userMessage || 'An unexpected error occurred. Please try again.',
    severity: options?.severity || ErrorSeverity.ERROR,
    category: options?.category || ErrorCategory.UNKNOWN,
    originalError: error,
    context: options?.context || {},
    timestamp,
  };
};

/**
 * Log an error with full details
 */
export const logError = (
  error: any,
  options?: {
    userMessage?: string;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    context?: Record<string, any>;
  }
): AppError => {
  const formattedError = formatError(error, options);
  
  if (config.logToConsole) {
    const { severity, category, message, code, context, timestamp } = formattedError;
    
    // Format the console output based on severity
    switch (severity) {
      case ErrorSeverity.INFO:
        console.info(
          `[${timestamp}] [${category.toUpperCase()}] ${message}`,
          code ? `(Code: ${code})` : '',
          context && Object.keys(context).length > 0 ? { context } : ''
        );
        break;
      case ErrorSeverity.WARNING:
        console.warn(
          `[${timestamp}] [${category.toUpperCase()}] ${message}`,
          code ? `(Code: ${code})` : '',
          context && Object.keys(context).length > 0 ? { context } : ''
        );
        break;
      case ErrorSeverity.CRITICAL:
        console.error(
          `[${timestamp}] [${category.toUpperCase()}] [CRITICAL] ${message}`,
          code ? `(Code: ${code})` : '',
          context && Object.keys(context).length > 0 ? { context } : '',
          formattedError.originalError || ''
        );
        break;
      case ErrorSeverity.ERROR:
      default:
        console.error(
          `[${timestamp}] [${category.toUpperCase()}] ${message}`,
          code ? `(Code: ${code})` : '',
          context && Object.keys(context).length > 0 ? { context } : '',
          formattedError.originalError || ''
        );
    }
  }
  
  if (config.logToServer) {
    // Here you would implement server-side logging
    // For example, sending the error to a logging service
    // This is a placeholder for future implementation
  }
  
  return formattedError;
};

/**
 * Get a user-friendly error message based on the error
 */
export const getUserFriendlyMessage = (error: any): string => {
  // Handle Supabase PostgrestError
  if (error && 'code' in error) {
    const postgrestError = error as PostgrestError;
    
    switch (postgrestError.code) {
      case '23505':
        return 'This record already exists. Please try with different information.';
      case '23503':
        return 'This operation references data that doesn\'t exist or has been deleted.';
      case '42501':
        return 'You don\'t have permission to perform this action.';
      case '28000':
      case '28P01':
        return 'Authentication failed. Please check your credentials and try again.';
      case '23502':
        return 'Required information is missing. Please fill in all required fields.';
      case '22P02':
        return 'Invalid input format. Please check your data and try again.';
      default:
        if (postgrestError.code?.startsWith('08')) {
          return 'Database connection error. Please try again later.';
        }
        if (postgrestError.code?.startsWith('53')) {
          return 'The system is currently busy. Please try again later.';
        }
        if (postgrestError.code?.startsWith('57')) {
          return 'The operation was canceled. Please try again.';
        }
        return 'A database error occurred. Please try again later.';
    }
  }
  
  // Handle authentication errors
  if (error && typeof error === 'object' && 'message' in error) {
    const message = error.message as string;
    
    if (message.includes('email') && message.includes('password')) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (message.includes('JWT')) {
      return 'Your session has expired. Please log in again.';
    }
    
    if (message.includes('permission') || message.includes('access')) {
      return 'You don\'t have permission to perform this action.';
    }
  }
  
  return 'An unexpected error occurred. Please try again.';
};

/**
 * Handle an error and return a user-friendly message
 */
export const handleError = (
  error: any,
  options?: {
    userMessage?: string;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    context?: Record<string, any>;
  }
): string => {
  const formattedError = logError(error, options);
  return formattedError.userMessage;
};

/**
 * Create a context object for error logging
 */
export const createErrorContext = (
  component: string,
  action: string,
  data?: Record<string, any>
): Record<string, any> => {
  return {
    component,
    action,
    ...data,
  };
};
