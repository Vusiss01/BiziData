import {
  ref,
  uploadBytes,
  getDownloadURL as getFirebaseDownloadURL,
  deleteObject,
  uploadBytesResumable,
  UploadTaskSnapshot
} from "firebase/storage";
import { storage } from "@/lib/firebase";
import { logError, ErrorCategory, ErrorSeverity } from "@/utils/errorHandler";

/**
 * File upload options
 */
export interface FileUploadOptions {
  folderPath?: string;
  fileName?: string;
  contentType?: string;
  generateUniqueFilename?: boolean;
  metadata?: Record<string, string>;
  onProgress?: (progress: number) => void;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  path: string | null;
  url: string | null;
  error: Error | null;
}

/**
 * Generate a unique filename
 */
function generateUniqueFilename(originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = originalName.split('.').pop();

  return `${timestamp}-${randomString}.${extension}`;
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  file: File,
  options: FileUploadOptions = {}
): Promise<FileUploadResult> {
  try {
    console.log(`Starting file upload: ${file.name} (${file.size} bytes, ${file.type})`);

    const {
      folderPath = '',
      fileName,
      contentType = file.type,
      generateUniqueFilename: shouldGenerateUniqueFilename = true,
      metadata = {},
      onProgress
    } = options;

    console.log(`Upload options: folderPath=${folderPath}, fileName=${fileName}, contentType=${contentType}`);

    // Generate or use provided filename
    const finalFileName = shouldGenerateUniqueFilename
      ? generateUniqueFilename(fileName || file.name)
      : (fileName || file.name);

    console.log(`Final filename: ${finalFileName}`);

    // Create the full path
    const fullPath = folderPath
      ? `${folderPath}/${finalFileName}`.replace(/\/+/g, '/')
      : finalFileName;

    console.log(`Full storage path: ${fullPath}`);

    // Create a storage reference
    const storageRef = ref(storage, fullPath);

    // Set up metadata
    const fileMetadata = {
      contentType,
      customMetadata: metadata
    };

    console.log(`Starting upload to Firebase Storage`);

    // If progress callback is provided, use resumable upload
    if (onProgress) {
      console.log(`Using resumable upload with progress monitoring`);
      const uploadTask = uploadBytesResumable(storageRef, file, fileMetadata);

      // Set up progress monitoring
      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress: ${progress.toFixed(2)}%`);
          onProgress(progress);
        },
        (error) => {
          console.error(`Upload error during progress monitoring:`, error);
          throw error;
        }
      );

      // Wait for the upload to complete
      await uploadTask;
      console.log(`Resumable upload completed`);
    } else {
      // Use simple upload without progress monitoring
      console.log(`Using simple upload without progress monitoring`);
      await uploadBytes(storageRef, file, fileMetadata);
      console.log(`Simple upload completed`);
    }

    // Get the download URL
    console.log(`Getting download URL for uploaded file`);
    const url = await getFirebaseDownloadURL(storageRef);
    console.log(`Download URL obtained: ${url}`);

    return {
      path: fullPath,
      url,
      error: null
    };
  } catch (error) {
    console.error(`Error uploading file:`, error);

    logError(error, {
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.ERROR,
      context: {
        fileName: file.name,
        fileSize: file.size,
        options
      },
    });

    return { path: null, url: null, error: error as Error };
  }
}

/**
 * Get a download URL for a file
 */
export async function getDownloadURL(path: string): Promise<string | null> {
  try {
    const storageRef = ref(storage, path);
    return await getFirebaseDownloadURL(storageRef);
  } catch (error) {
    logError(error, {
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.ERROR,
      context: {
        path
      },
    });

    return null;
  }
}

/**
 * Delete a file from storage
 */
export async function deleteFile(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    logError(error, {
      category: ErrorCategory.STORAGE,
      severity: ErrorSeverity.ERROR,
      context: {
        path
      },
    });

    return false;
  }
}
