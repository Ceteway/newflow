import React, { useState, useCallback } from 'react';
import { useEffect } from 'react';
import FileUpload from './Templates/FileUpload';
import DocumentList from './Templates/DocumentList';
import DocumentEditor from './Templates/DocumentEditor';
import DocumentPreview from './Templates/DocumentPreview';
import TabSystem from './Templates/TabSystem';
import { Document, DocumentState } from '@/types/templates/document';
import { exportToWord } from '@/utils/templates/exportHandler';
import { generateId } from '@/utils/templates/blankSpaceManager';
import { DocumentPersistenceService } from '@/services/documentPersistenceService';
import { useAuth } from '@/hooks/useAuth';

function DocumentTemplates() {
  const { user } = useAuth();
  const [state, setState] = useState<DocumentState>({
    systemDocuments: [],
    userTemplates: [],
    currentDocument: null,
    activeTab: 'upload',
    isLoading: false,
    error: null
  });

  const [viewMode, setViewMode] = useState<'list' | 'edit' | 'preview'>('list');
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);

  // Load persisted documents when user is authenticated
  useEffect(() => {
    if (user) {
      loadPersistedDocuments();
    }
  }, [user]);

  const loadPersistedDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      console.log('Loading persisted documents for user...');
      
      const documents = await DocumentPersistenceService.loadUserDocuments();
      
      // Separate system documents and user templates
      const systemDocs = documents.filter(doc => doc.type === 'system');
      const userDocs = documents.filter(doc => doc.type === 'template');
      
      setState(prev => ({
        ...prev,
        systemDocuments: systemDocs,
        userTemplates: userDocs
      }));
      
      console.log(`Loaded ${systemDocs.length} system documents and ${userDocs.length} user templates`);
    } catch (error) {
      console.error('Error loading persisted documents:', error);
      setState(prev => ({ ...prev, error: 'Failed to load saved documents' }));
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleDocumentUpload = useCallback((document: Document) => {
    // Save to database immediately
    DocumentPersistenceService.saveDocument(document).catch(error => {
      console.error('Error persisting uploaded document:', error);
    });
    
    setState(prev => ({
      ...prev,
      systemDocuments: [...prev.systemDocuments, document]
    }));
  }, []);

  const handleDocumentSave = useCallback((document: Document) => {
    // Save to database
    DocumentPersistenceService.saveDocument(document).catch(error => {
      console.error('Error persisting document changes:', error);
    });
    
    setState(prev => {
      const isSystemDocument = prev.systemDocuments.some(d => d.id === document.id);
      let newTemplates;
      let updatedDocument = { ...document };
      if (isSystemDocument) {
        updatedDocument = {
          ...document,
          id: generateId(),
          type: 'template',
          name: document.name + ' (Template)',
          createdAt: new Date(),
          modifiedAt: new Date()
        };
        newTemplates = [...prev.userTemplates, updatedDocument];
      } else {
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
    // Delete from database
    DocumentPersistenceService.deleteDocument(documentId).catch(error => {
      console.error('Error deleting document from database:', error);
    });
    
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
    // Update in database
    DocumentPersistenceService.renameDocument(documentId, newName).catch(error => {
      console.error('Error renaming document in database:', error);
    });
    
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
    } catch (error) {
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
            {isLoadingDocuments && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading your documents...</p>
                </div>
              </div>
            )}
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
                onDelete={handleDocumentDelete}
                onRename={handleDocumentRename}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DocumentTemplates;