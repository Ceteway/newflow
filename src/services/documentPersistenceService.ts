import { supabase } from "@/integrations/supabase/client";
import { Document } from "@/types/templates/document";

export interface PersistedDocument {
  id: string;
  name: string;
  content: string;
  original_content?: string;
  document_type: 'system' | 'template';
  blank_spaces: any[];
  created_at: string;
  modified_at: string;
  user_id: string;
}

export class DocumentPersistenceService {
  static async saveDocument(document: Document): Promise<PersistedDocument> {
    try {
      console.log('Saving document to database:', document.name);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to save documents');
      }

      const documentData = {
        id: document.id,
        name: document.name,
        content: document.content,
        original_content: document.originalContent,
        document_type: document.type,
        blank_spaces: document.blankSpaces,
        created_at: document.createdAt.toISOString(),
        modified_at: document.modifiedAt.toISOString(),
        user_id: user.id
      };

      // Check if document already exists
      const { data: existing } = await supabase
        .from('user_documents')
        .select('id')
        .eq('id', document.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        // Update existing document
        const { data, error } = await supabase
          .from('user_documents')
          .update({
            name: documentData.name,
            content: documentData.content,
            original_content: documentData.original_content,
            document_type: documentData.document_type,
            blank_spaces: documentData.blank_spaces,
            modified_at: documentData.modified_at
          })
          .eq('id', document.id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new document
        const { data, error } = await supabase
          .from('user_documents')
          .insert(documentData)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error saving document:', error);
      throw new Error(`Failed to save document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async loadUserDocuments(): Promise<Document[]> {
    try {
      console.log('Loading user documents from database...');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('No authenticated user, returning empty array');
        return [];
      }

      const { data: documents, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .order('modified_at', { ascending: false });

      if (error) {
        console.error('Error loading documents:', error);
        return [];
      }

      console.log(`Loaded ${documents?.length || 0} documents from database`);

      return (documents || []).map(doc => ({
        id: doc.id,
        name: doc.name,
        content: doc.content,
        originalContent: doc.original_content,
        type: doc.document_type as 'system' | 'template',
        blankSpaces: doc.blank_spaces || [],
        createdAt: new Date(doc.created_at),
        modifiedAt: new Date(doc.modified_at)
      }));
    } catch (error) {
      console.error('Error loading user documents:', error);
      return [];
    }
  }

  static async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log('Deleting document from database:', documentId);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to delete documents');
      }

      const { error } = await supabase
        .from('user_documents')
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async renameDocument(documentId: string, newName: string): Promise<void> {
    try {
      console.log('Renaming document in database:', documentId, 'to', newName);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to rename documents');
      }

      const { error } = await supabase
        .from('user_documents')
        .update({ 
          name: newName,
          modified_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;
      console.log('Document renamed successfully');
    } catch (error) {
      console.error('Error renaming document:', error);
      throw new Error(`Failed to rename document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}