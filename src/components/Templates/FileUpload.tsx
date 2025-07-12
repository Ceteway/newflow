import React, { useCallback, useState } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { parseWordDocument, validateDocumentFile, sanitizeFileName, detectFileType } from '@/utils/templates/documentParser';
import { generateId } from '@/utils/templates/blankSpaceManager';
import { Document } from '@/types/templates/document';

interface FileUploadProps {
  onDocumentUpload: (document: Document) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDocumentUpload }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadStatus, setUploadStatus] = useState<{ [key: string]: 'uploading' | 'success' | 'error' }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleFileUpload = useCallback(async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = generateId();
      
      try {
        // Clear any previous errors for this file
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fileId];
          return newErrors;
        });

        // Validate file first
        if (!validateDocumentFile(file)) {
          setErrors(prev => ({ 
            ...prev, 
            [fileId]: 'Invalid file type, size too large (max 10MB), or file is corrupted' 
          }));
          setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
          continue;
        }

        // Detect file type for additional validation
        const detectedType = await detectFileType(file);
        console.log('Detected file type:', detectedType, 'for file:', file.name);
        
        // Only reject if we're sure it's not a Word document
        if (detectedType === 'unknown' && !file.name.toLowerCase().endsWith('.docx') && !file.name.toLowerCase().endsWith('.doc')) {
          setErrors(prev => ({ 
            ...prev, 
            [fileId]: 'File format not recognized. Please upload a .docx or .doc file.' 
          }));
          setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
          continue;
        }

        setUploadStatus(prev => ({ ...prev, [fileId]: 'uploading' }));
        setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [fileId]: Math.min(prev[fileId] + 10, 90)
          }));
        }, 100);

        let content;
        try {
          content = await parseWordDocument(file);
        } catch (parseError) {
          clearInterval(progressInterval);
          const errorMessage = parseError instanceof Error 
            ? parseError.message 
            : 'Failed to parse document content';
          setErrors(prev => ({ ...prev, [fileId]: errorMessage }));
          setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
          continue;
        }
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));

        const document: Document = {
          id: fileId,
          name: sanitizeFileName(file.name.replace(/\.[^/.]+$/, "")),
          content,
          originalContent: content,
          createdAt: new Date(),
          modifiedAt: new Date(),
          type: 'system',
          blankSpaces: []
        };

        onDocumentUpload(document);
        setUploadStatus(prev => ({ ...prev, [fileId]: 'success' }));
        
        // Clean up after 2 seconds
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
          setUploadStatus(prev => {
            const newStatus = { ...prev };
            delete newStatus[fileId];
            return newStatus;
          });
        }, 2000);

      } catch (error) {
        console.error('File upload error:', error);
        const errorMessage = error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred while processing the file';
        setErrors(prev => ({ ...prev, [fileId]: errorMessage }));
        setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      }
    }
  }, [onDocumentUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  const hasActiveUploads = Object.keys(uploadStatus).length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload Word Documents
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Drag and drop your Word documents (.docx or .doc) here, or click to select files
        </p>
        <input
          type="file"
          multiple
          accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 cursor-pointer transition-colors"
        >
          <FileText className="h-4 w-4 mr-2" />
          Select Files
        </label>
      </div>

      {hasActiveUploads && (
        <div className="mt-6 space-y-3">
          {Object.entries(uploadStatus).map(([fileId, status]) => (
            <div
              key={fileId}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">
                    {fileId.slice(-8)}
                  </span>
                </div>
                {status === 'success' && (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                )}
                {status === 'error' && (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              {status === 'uploading' && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress[fileId] || 0}%` }}
                  />
                </div>
              )}
              
              {status === 'error' && errors[fileId] && (
                <p className="text-sm text-red-600">{errors[fileId]}</p>
              )}
              
              {status === 'success' && (
                <p className="text-sm text-green-600">Successfully uploaded!</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;