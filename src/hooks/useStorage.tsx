import { useState } from "react";
import { getFoodBaseClient } from "./useAuth";

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
      const foodbase = getFoodBaseClient();
      const storage = foodbase.getStorage();
      const storageRef = storage.ref(path);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 200);

      // Upload the file
      const result = await storageRef.upload(file, metadata);
      setUrl(result.url);
      setUploading(false);
      clearInterval(progressInterval);
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
      const foodbase = getFoodBaseClient();
      const storage = foodbase.getStorage();
      const storageRef = storage.ref(path);
      const downloadUrl = await storageRef.getDownloadURL();
      return downloadUrl;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      const foodbase = getFoodBaseClient();
      const storage = foodbase.getStorage();
      const storageRef = storage.ref(path);
      await storageRef.delete();
      return true;
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
