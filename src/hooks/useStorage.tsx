import { useState } from "react";
import * as storageService from "@/services/storageService";

export const useStorage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const uploadFile = async (file: File, path: string, metadata?: any) => {
    setUploading(true);
    setProgress(0);
    setError(null);
    setUrl(null);

    try {
      // Parse the path to extract folder and filename
      // Expected format: 'folder-path/filename.ext'
      const lastSlashIndex = path.lastIndexOf('/');
      const folderPath = lastSlashIndex !== -1 ? path.substring(0, lastSlashIndex) : '';
      const fileName = lastSlashIndex !== -1 ? path.substring(lastSlashIndex + 1) : path;

      // Upload the file with progress tracking
      const result = await storageService.uploadFile(file, {
        folderPath,
        fileName,
        metadata,
        onProgress: (progressValue) => {
          setProgress(progressValue);
        }
      });

      if (result.error) {
        throw result.error;
      }

      if (result.url) {
        setUrl(result.url);
      }

      setUploading(false);
      setProgress(100);
      return result.url;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setUploading(false);
      return null;
    }
  };

  const getDownloadURL = async (path: string) => {
    try {
      const url = await storageService.getDownloadURL(path);
      if (url) {
        setUrl(url);
      }
      return url;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      return await storageService.deleteFile(path);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  };

  return {
    uploadFile,
    getDownloadURL,
    deleteFile,
    uploading,
    progress,
    error,
    url,
  };
};
