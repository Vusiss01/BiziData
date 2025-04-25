import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { createImagePreview, revokeImagePreview } from '@/utils/fileUpload';

interface FileUploadProps {
  /**
   * The label for the file input
   */
  label?: string;
  
  /**
   * The description for the file input
   */
  description?: string;
  
  /**
   * The accepted file types
   */
  accept?: string;
  
  /**
   * The maximum file size in bytes
   */
  maxSize?: number;
  
  /**
   * Whether the file is required
   */
  required?: boolean;
  
  /**
   * The current file
   */
  value?: File | null;
  
  /**
   * The current file URL (for preview)
   */
  previewUrl?: string | null;
  
  /**
   * The callback when the file changes
   */
  onChange?: (file: File | null) => void;
  
  /**
   * The error message
   */
  error?: string;
  
  /**
   * Whether the file is being uploaded
   */
  isUploading?: boolean;
  
  /**
   * The CSS class name
   */
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload file',
  description = 'Upload a file',
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  required = false,
  value = null,
  previewUrl = null,
  onChange,
  error,
  isUploading = false,
  className = '',
}) => {
  const [preview, setPreview] = useState<string | null>(previewUrl);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update preview when value or previewUrl changes
  useEffect(() => {
    if (value) {
      const newPreview = createImagePreview(value);
      setPreview(newPreview);
      
      return () => {
        if (newPreview) {
          revokeImagePreview(newPreview);
        }
      };
    } else if (previewUrl) {
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  }, [value, previewUrl]);
  
  // Clean up preview on unmount
  useEffect(() => {
    return () => {
      if (preview && !previewUrl) {
        revokeImagePreview(preview);
      }
    };
  }, [preview, previewUrl]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Check file size
      if (file.size > maxSize) {
        alert(`File size exceeds the maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        return;
      }
    }
    
    if (onChange) {
      onChange(file);
    }
  };
  
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Check file size
      if (file.size > maxSize) {
        alert(`File size exceeds the maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        return;
      }
      
      if (onChange) {
        onChange(file);
      }
    }
  };
  
  const handleRemove = () => {
    if (onChange) {
      onChange(null);
    }
    
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };
  
  const handleButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="file-upload">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
          dragActive ? 'border-primary bg-primary/5' : 'border-gray-200'
        } ${error ? 'border-red-500' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <Input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          ref={inputRef}
          disabled={isUploading}
        />
        
        {preview ? (
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-2">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-md"
              />
              {!isUploading && (
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                  onClick={handleRemove}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 truncate max-w-full">
              {value?.name || 'Uploaded file'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            {isUploading ? (
              <Loader2 className="h-10 w-10 text-primary animate-spin mb-2" />
            ) : (
              <div className="bg-gray-100 rounded-full p-3 mb-2">
                <ImageIcon className="h-6 w-6 text-gray-500" />
              </div>
            )}
            <p className="text-sm font-medium mb-1">
              {isUploading ? 'Uploading...' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-500 text-center">{description}</p>
            {!isUploading && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={handleButtonClick}
              >
                <Upload className="h-4 w-4 mr-2" />
                Select File
              </Button>
            )}
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
};

export default FileUpload;
