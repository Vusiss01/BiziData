import { useState } from "react";
import { getSupabaseClient } from "./useAuth";

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
      const supabase = getSupabaseClient();

      // Extract bucket name and file path from the path string
      // Expected format: 'bucket-name/file-path'
      const [bucketName, ...filePath] = path.split('/');
      const filePathStr = filePath.join('/');

      if (!bucketName || !filePathStr) {
        throw new Error('Invalid path format. Expected format: bucket-name/file-path');
      }

      // Upload the file
      const { data, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePathStr, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
          ...(metadata || {})
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePathStr);

      setUrl(publicUrl);
      setUploading(false);
      setProgress(100);
      return publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setUploading(false);
      return null;
    }
  };

  const getDownloadURL = async (path: string) => {
    try {
      const supabase = getSupabaseClient();

      // Extract bucket name and file path
      const [bucketName, ...filePath] = path.split('/');
      const filePathStr = filePath.join('/');

      if (!bucketName || !filePathStr) {
        throw new Error('Invalid path format. Expected format: bucket-name/file-path');
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePathStr);

      return publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  };

  const deleteFile = async (path: string) => {
    try {
      const supabase = getSupabaseClient();

      // Extract bucket name and file path
      const [bucketName, ...filePath] = path.split('/');
      const filePathStr = filePath.join('/');

      if (!bucketName || !filePathStr) {
        throw new Error('Invalid path format. Expected format: bucket-name/file-path');
      }

      // Delete the file
      const { error: deleteError } = await supabase.storage
        .from(bucketName)
        .remove([filePathStr]);

      if (deleteError) throw deleteError;

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
