import React from 'react';
import { ArrowLeft, Download, Edit3 } from 'lucide-react';
import { Document } from '@/types/templates/document';
import { processContentForPreview } from '@/utils/templates/documentUtils';

interface DocumentPreviewProps {
  document: Document;
  onEdit: () => void;
  onDownload: () => void;
  onBack: () => void;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ 
  document, 
  onEdit, 
  onDownload, 
  onBack 
}) => {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h2 className="text-lg font-semibold text-gray-900">{document.name} - Preview</h2>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={onEdit}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Edit
          </button>
          
          <button
            onClick={onDownload}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </button>
        </div>
      </div>

      {/* Preview Content */}
      <div className="flex-1 overflow-auto bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-8">
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: processContentForPreview(document.content) 
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;