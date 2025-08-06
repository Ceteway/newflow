import React, { useState } from 'react';
import { 
  FileText, 
  Eye, 
  Edit3, 
  Download, 
  Trash2, 
  Edit, 
  Check, 
  X, 
  Search,
  Calendar
} from 'lucide-react';
import { Document } from '@/types/templates/document';

interface DocumentListProps {
  documents: Document[];
  isSystemTab?: boolean;
  onPreview: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (documentId: string) => void;
  onRename: (documentId: string, newName: string) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  isSystemTab = false,
  onPreview,
  onEdit,
  onDelete,
  onRename
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'modified'>('modified');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return b.createdAt.getTime() - a.createdAt.getTime();
      case 'modified':
        return b.modifiedAt.getTime() - a.modifiedAt.getTime();
      default:
        return 0;
    }
  });

  const handleRename = (documentId: string, currentName: string) => {
    setEditingId(documentId);
    setEditingName(currentName);
  };

  const handleSaveRename = () => {
    if (editingId && editingName.trim()) {
      onRename(editingId, editingName.trim());
    }
    setEditingId(null);
    setEditingName('');
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const title = isSystemTab ? 'System Documents' : 'User Templates';

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <div className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Search and Sort */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'created' | 'modified')}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="modified">Sort by Modified</option>
            <option value="created">Sort by Created</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-auto">
        {sortedDocuments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No documents found</p>
              <p className="text-sm">
                {searchTerm ? 'Try adjusting your search terms' : 'Upload some documents to get started'}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {sortedDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors shadow-sm"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        {editingId === document.id ? (
                          <div className="flex-1 flex items-center space-x-2">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename();
                                if (e.key === 'Escape') handleCancelRename();
                              }}
                            />
                            <button
                              onClick={handleSaveRename}
                              className="p-1 text-green-600 hover:text-green-700"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelRename}
                              className="p-1 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {document.name}
                            </h3>
                            {!isSystemTab && (
                              <button
                                onClick={() => handleRename(document.id, document.name)}
                                className="p-1 text-gray-400 hover:text-gray-600"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Modified: {formatDate(document.modifiedAt)}</span>
                        </div>
                        {document.type === 'template' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                            Template
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onPreview(document)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => onEdit(document)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
                        title={isSystemTab ? "Create Template" : "Edit"}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => onDownload(document)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Download"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      
                      {!isSystemTab && (
                        <button
                          onClick={() => onDelete(document.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList;