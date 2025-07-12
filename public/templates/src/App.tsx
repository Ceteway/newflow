import React, { useState, useCallback } from 'react';
import FileUpload from './components/FileUpload';
import DocumentList from './components/DocumentList';
import DocumentEditor from './components/DocumentEditor';
import DocumentPreview from './components/DocumentPreview';
import TabSystem from './components/TabSystem';
import { Document, DocumentState } from './types/document';
import { exportToWord } from './utils/exportHandler';
import { generateId } from './utils/blankSpaceManager';

function App() {
  const [state, setState] = useState<DocumentState>({
    systemDocuments: [],
    userTemplates: [],
    currentDocument: null,
    activeTab: 'upload',
    isLoading: false,
    error: null
  });

  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list');

  const handleDocumentUpload = useCallback((document: Document) => {
    console.log('Document uploaded successfully:', document.name);
    setState(prev => ({
      ...prev,
      systemDocuments: [...prev.systemDocuments, document]
    }));
  }, []);

  const handleDocumentSave = useCallback((document: Document) => {
    setState(prev => {
      // If this is a system document being saved, create a new template
      const isSystemDocument = prev.systemDocuments.some(d => d.id === document.id);
      
      let newTemplates;
      let updatedDocument = { ...document };
      
      if (isSystemDocument) {
        // Create a new template based on the system document
        updatedDocument = {
          ...document,
          id: generateId(), // Generate new ID for the template
          type: 'template',
          name: document.name + ' (Template)', // Add template suffix
          createdAt: new Date(),
          modifiedAt: new Date()
        };
        newTemplates = [...prev.userTemplates, updatedDocument];
      } else {
        // Update existing template
        const existingIndex = prev.userTemplates.findIndex(d => d.id === document.id);
        newTemplates = existingIndex >= 0
          ? prev.userTemplates.map(d => d.id === document.id ? { ...document, type: 'template' } : d)
          : [...prev.userTemplates, { ...document, type: 'template' }];
        updatedDocument = { ...document, type: 'template' };
      }
      
      return {
        ...prev,
        userTemplates: newTemplates,
        currentDocument: updatedDocument
      };
    });
  }, []);

  const handleDocumentDelete = useCallback((documentId: string) => {
    setState(prev => ({
      ...prev,
      userTemplates: prev.userTemplates.filter(d => d.id !== documentId),
      currentDocument: prev.currentDocument?.id === documentId ? null : prev.currentDocument
    }));
    
    if (state.currentDocument?.id === documentId) {
      setViewMode('list');
    }
  }, [state.currentDocument]);

  const handleDocumentRename = useCallback((documentId: string, newName: string) => {
    setState(prev => ({
      ...prev,
      userTemplates: prev.userTemplates.map(d => 
        d.id === documentId ? { ...d, name: newName, modifiedAt: new Date() } : d
      ),
      currentDocument: prev.currentDocument?.id === documentId 
        ? { ...prev.currentDocument, name: newName, modifiedAt: new Date() }
        : prev.currentDocument
    }));
  }, []);

  const handleDocumentEdit = useCallback((document: Document) => {
    setState(prev => ({ ...prev, currentDocument: document }));
    setViewMode('edit');
  }, []);

  const handleDocumentPreview = useCallback((document: Document) => {
    setState(prev => ({ ...prev, currentDocument: document }));
    setViewMode('preview');
  }, []);

  const handleDocumentDownload = useCallback(async (document: Document) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await exportToWord(document);
      console.log('Document exported successfully:', document.name);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error 
        ? `Failed to download document: ${error.message}`
        : 'Failed to download document';
      setState(prev => ({ ...prev, error: errorMessage }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const handleTabChange = useCallback((tab: 'upload' | 'system' | 'templates') => {
    setState(prev => ({ ...prev, activeTab: tab }));
    setViewMode('list');
  }, []);

  const handleBackToList = useCallback(() => {
    setViewMode('list');
  }, []);

  const handlePreviewMode = useCallback(() => {
    setViewMode('preview');
  }, []);

  const handleEditMode = useCallback(() => {
    setViewMode('edit');
  }, []);

  const getCurrentDocuments = () => {
    return state.activeTab === 'system' ? state.systemDocuments : state.userTemplates;
  };

  const getTabTitle = () => {
    switch (state.activeTab) {
      case 'system':
        return 'System Documents';
      case 'templates':
        return 'User Templates';
      default:
        return 'Documents';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Word Document Editor</h1>
        </div>
      </header>

      <TabSystem
        activeTab={state.activeTab}
        onTabChange={handleTabChange}
        systemCount={state.systemDocuments.length}
        templateCount={state.userTemplates.length}
      />

      <main className="h-[calc(100vh-140px)]">
        {state.error && (
          <div className="bg-red-50 border border-red-200 p-4 mx-6 mt-4 rounded-md">
            <p className="text-red-800">{state.error}</p>
          </div>
        )}

        {viewMode === 'edit' && state.currentDocument && (
          <DocumentEditor
            document={state.currentDocument}
            onSave={handleDocumentSave}
            onPreview={handlePreviewMode}
          />
        )}

        {viewMode === 'preview' && state.currentDocument && (
          <DocumentPreview
            document={state.currentDocument}
            onEdit={handleEditMode}
            onDownload={() => handleDocumentDownload(state.currentDocument!)}
            onBack={handleBackToList}
          />
        )}

        {viewMode === 'list' && (
          <div className="h-full">
            {state.activeTab === 'upload' && (
              <div className="flex items-center justify-center h-full">
                <FileUpload onDocumentUpload={handleDocumentUpload} />
              </div>
            )}

            {(state.activeTab === 'system' || state.activeTab === 'templates') && (
              <DocumentList
                documents={getCurrentDocuments()}
                isSystemTab={state.activeTab === 'system'}
                onPreview={handleDocumentPreview}
                onEdit={handleDocumentEdit}
                onDownload={handleDocumentDownload}
                onDelete={handleDocumentDelete}
                onRename={handleDocumentRename}
                title={getTabTitle()}
              />
            )}
          </div>
        )}
      </main>

      {state.isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;