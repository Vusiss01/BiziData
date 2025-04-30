import { AppError, ErrorSeverity, ErrorCategory } from "@/utils/errorHandler";

/**
 * Configuration for the error logger
 */
interface ErrorLoggerConfig {
  enabled: boolean;
  logToConsole: boolean;
  logToDatabase: boolean;
  logToLocalStorage: boolean;
  maxLocalStorageLogs: number;
  minSeverityForDatabase: ErrorSeverity;
}

/**
 * Default configuration
 */
const defaultConfig: ErrorLoggerConfig = {
  enabled: true,
  logToConsole: true,
  logToDatabase: process.env.NODE_ENV === 'production',
  logToLocalStorage: true,
  maxLocalStorageLogs: 100,
  minSeverityForDatabase: ErrorSeverity.ERROR,
};

/**
 * Current configuration
 */
let config: ErrorLoggerConfig = { ...defaultConfig };

/**
 * Configure the error logger
 */
export const configureErrorLogger = (newConfig: Partial<ErrorLoggerConfig>) => {
  config = { ...config, ...newConfig };
};

/**
 * Log an error to the database
 * This is a placeholder that will be replaced with actual implementation
 */
const logToDatabase = async (error: AppError): Promise<void> => {
  if (!config.logToDatabase) return;

  // Only log errors of specified severity or higher
  if (
    error.severity === ErrorSeverity.INFO && config.minSeverityForDatabase !== ErrorSeverity.INFO ||
    error.severity === ErrorSeverity.WARNING && (
      config.minSeverityForDatabase !== ErrorSeverity.INFO &&
      config.minSeverityForDatabase !== ErrorSeverity.WARNING
    )
  ) {
    return;
  }

  try {
    // Database logging not implemented
    console.log("Database error logging not implemented");
  } catch (err) {
    // If we can't log to the database, at least log to console
    if (config.logToConsole) {
      console.error('Failed to log error to database:', err);
      console.error('Original error:', error);
    }
  }
};

/**
 * Log an error to local storage
 */
const logToLocalStorage = (error: AppError): void => {
  if (!config.logToLocalStorage) return;

  try {
    // Get existing logs
    const logsJson = localStorage.getItem('error_logs');
    const logs = logsJson ? JSON.parse(logsJson) : [];

    // Add new log
    logs.unshift({
      ...error,
      originalError: undefined, // Don't store the original error object
    });

    // Limit the number of logs
    if (logs.length > config.maxLocalStorageLogs) {
      logs.length = config.maxLocalStorageLogs;
    }

    // Save logs
    localStorage.setItem('error_logs', JSON.stringify(logs));
  } catch (err) {
    // If we can't log to local storage, at least log to console
    if (config.logToConsole) {
      console.error('Failed to log error to local storage:', err);
      console.error('Original error:', error);
    }
  }
};

/**
 * Log an error to the console
 */
const logToConsole = (error: AppError): void => {
  if (!config.logToConsole) return;

  const { severity, category, message, code, context, timestamp, originalError } = error;

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
        originalError || ''
      );
      break;
    case ErrorSeverity.ERROR:
    default:
      console.error(
        `[${timestamp}] [${category.toUpperCase()}] ${message}`,
        code ? `(Code: ${code})` : '',
        context && Object.keys(context).length > 0 ? { context } : '',
        originalError || ''
      );
  }
};

/**
 * Log an error to all configured destinations
 */
export const logError = async (error: AppError): Promise<void> => {
  if (!config.enabled) return;

  // Log to console
  if (config.logToConsole) {
    logToConsole(error);
  }

  // Log to local storage
  if (config.logToLocalStorage) {
    logToLocalStorage(error);
  }

  // Log to database
  if (config.logToDatabase) {
    await logToDatabase(error);
  }
};

/**
 * Get all error logs from local storage
 */
export const getLocalErrorLogs = (): AppError[] => {
  try {
    const logsJson = localStorage.getItem('error_logs');
    return logsJson ? JSON.parse(logsJson) : [];
  } catch (err) {
    console.error('Failed to get error logs from local storage:', err);
    return [];
  }
};

/**
 * Clear all error logs from local storage
 */
export const clearLocalErrorLogs = (): void => {
  try {
    localStorage.removeItem('error_logs');
  } catch (err) {
    console.error('Failed to clear error logs from local storage:', err);
  }
};
