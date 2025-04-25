import { supabase } from "@/lib/supabase";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";

/**
 * File upload options
 */
export interface FileUploadOptions {
  /**
   * The bucket to upload to
   */
  bucket: string;
  
  /**
   * The folder path within the bucket
   */
  folderPath?: string;
  
  /**
   * Whether to make the file public
   */
  isPublic?: boolean;
  
  /**
   * The maximum file size in bytes (default: 5MB)
   */
  maxSize?: number;
  
  /**
   * Allowed file types (e.g., ['image/jpeg', 'image/png'])
   */
  allowedTypes?: string[];
  
  /**
   * Whether to generate a unique filename
   */
  generateUniqueFilename?: boolean;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  /**
   * The uploaded file path
   */
  path: string | null;
  
  /**
   * The public URL of the file (if applicable)
   */
  url: string | null;
  
  /**
   * Any error that occurred during upload
   */
  error: Error | null;
}

/**
 * Default upload options
 */
const defaultOptions: FileUploadOptions = {
  bucket: 'avatars',
  folderPath: '',
  isPublic: true,
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  generateUniqueFilename: true,
};

/**
 * Generate a unique filename
 */
const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 1000);
  const extension = originalFilename.split('.').pop();
  
  return `${timestamp}-${random}.${extension}`;
};

/**
 * Validate a file before upload
 */
const validateFile = (
  file: File,
  options: FileUploadOptions
): Error | null => {
  // Check file size
  if (options.maxSize && file.size > options.maxSize) {
    return new Error(`File size exceeds the maximum allowed size of ${options.maxSize / 1024 / 1024}MB`);
  }
  
  // Check file type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    return new Error(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
  }
  
  return null;
};

/**
 * Upload a file to Supabase Storage
 */
export const uploadFile = async (
  file: File,
  customOptions?: Partial<FileUploadOptions>
): Promise<FileUploadResult> => {
  try {
    // Merge default options with custom options
    const options = { ...defaultOptions, ...customOptions };
    
    // Validate file
    const validationError = validateFile(file, options);
    if (validationError) {
      return { path: null, url: null, error: validationError };
    }
    
    // Generate filename
    let filename = file.name;
    if (options.generateUniqueFilename) {
      filename = generateUniqueFilename(file.name);
    }
    
    // Construct file path
    const filePath = options.folderPath
      ? `${options.folderPath}/${filename}`
      : filename;
    
    // Upload file
    const { data, error } = await supabase.storage
      .from(options.bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });
    
    if (error) {
      throw error;
    }
    
    // Get public URL if applicable
    let url = null;
    if (options.isPublic) {
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);
      
      url = urlData.publicUrl;
    }
    
    return { path: data.path, url, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'uploadFile',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      },
    });
    
    return { path: null, url: null, error: error as Error };
  }
};

/**
 * Delete a file from Supabase Storage
 */
export const deleteFile = async (
  path: string,
  bucket: string = defaultOptions.bucket
): Promise<{ success: boolean; error: Error | null }> => {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) {
      throw error;
    }
    
    return { success: true, error: null };
  } catch (error) {
    logError(error, {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.ERROR,
      context: {
        action: 'deleteFile',
        path,
        bucket,
      },
    });
    
    return { success: false, error: error as Error };
  }
};

/**
 * Get a public URL for a file
 */
export const getPublicUrl = (
  path: string,
  bucket: string = defaultOptions.bucket
): string => {
  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);
  
  return data.publicUrl;
};

/**
 * Create an image URL from a File object
 */
export const createImagePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revoke an image URL created with createImagePreview
 */
export const revokeImagePreview = (url: string): void => {
  URL.revokeObjectURL(url);
};
