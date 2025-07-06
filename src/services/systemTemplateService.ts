import { supabase } from "@/integrations/supabase/client";
import { TemplateCategory } from "@/types/database";

export interface SystemTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  file_name: string;
  file_data: Uint8Array;
  content_type: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface CreateSystemTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  file_name: string;
  file_data: Uint8Array;
  content_type: string;
}

// Helper function to convert Uint8Array to base64 safely
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Helper function to convert base64 to Uint8Array safely
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding base64:', error);
    throw new Error('Invalid base64 data');
  }
}

export class SystemTemplateService {
  static async uploadSystemTemplate(data: CreateSystemTemplateData): Promise<SystemTemplate> {
    try {
      console.log('Starting system template upload...', { 
        name: data.name, 
        fileName: data.file_name,
        fileSize: data.file_data.length,
        contentType: data.content_type
      });

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Authentication required');
      }

      // Convert Uint8Array to base64 string for storage
      const base64Data = uint8ArrayToBase64(data.file_data);
      console.log('File converted to base64, length:', base64Data.length);
      
      const insertData = {
        name: data.name,
        description: data.description || null,
        category: data.category,
        file_name: data.file_name,
        file_data: base64Data,
        content_type: data.content_type,
        uploaded_by: user?.id || null,
        is_active: true
      };

      console.log('Inserting template data:', { ...insertData, file_data: '[BASE64_DATA]' });

      const { data: template, error } = await supabase
        .from('system_templates')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('Error uploading system template:', error);
        throw new Error(`Failed to upload system template: ${error.message}`);
      }

      console.log('Template uploaded successfully:', template.id);

      return {
        ...template,
        file_data: data.file_data // Return original Uint8Array
      };
    } catch (error) {
      console.error('SystemTemplateService upload error:', error);
      throw error;
    }
  }

  static async getAllSystemTemplates(): Promise<SystemTemplate[]> {
    try {
      console.log('Fetching all system templates...');
      
      const { data: templates, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching system templates:', error);
        throw new Error(`Failed to fetch system templates: ${error.message}`);
      }

      console.log(`Fetched ${templates?.length || 0} system templates`);

      return (templates || []).map(template => {
        try {
          return {
            ...template,
            file_data: base64ToUint8Array(template.file_data)
          };
        } catch (decodeError) {
          console.error(`Error decoding template ${template.id}:`, decodeError);
          // Return empty Uint8Array if decode fails
          return {
            ...template,
            file_data: new Uint8Array()
          };
        }
      });
    } catch (error) {
      console.error('SystemTemplateService fetch error:', error);
      throw error;
    }
  }

  static async getSystemTemplateById(id: string): Promise<SystemTemplate | null> {
    try {
      console.log('Fetching system template by ID:', id);
      
      const { data: template, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching system template:', error);
        return null;
      }

      if (!template) {
        return null;
      }

      try {
        return {
          ...template,
          file_data: base64ToUint8Array(template.file_data)
        };
      } catch (decodeError) {
        console.error(`Error decoding template ${id}:`, decodeError);
        return {
          ...template,
          file_data: new Uint8Array()
        };
      }
    } catch (error) {
      console.error('SystemTemplateService get by ID error:', error);
      return null;
    }
  }

  static async updateSystemTemplate(id: string, updates: Partial<CreateSystemTemplateData>): Promise<SystemTemplate> {
    try {
      console.log('Updating system template:', id);
      
      const updateData: any = {};
      
      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.category) updateData.category = updates.category;
      if (updates.file_name) updateData.file_name = updates.file_name;
      if (updates.content_type) updateData.content_type = updates.content_type;
      
      if (updates.file_data) {
        updateData.file_data = uint8ArrayToBase64(updates.file_data);
      }

      const { data: template, error } = await supabase
        .from('system_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating system template:', error);
        throw new Error(`Failed to update system template: ${error.message}`);
      }

      return {
        ...template,
        file_data: updates.file_data || base64ToUint8Array(template.file_data)
      };
    } catch (error) {
      console.error('SystemTemplateService update error:', error);
      throw error;
    }
  }

  static async deleteSystemTemplate(id: string): Promise<void> {
    try {
      console.log('Deleting system template:', id);
      
      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('system_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting system template:', error);
        throw new Error(`Failed to delete system template: ${error.message}`);
      }

      console.log('Template deleted successfully:', id);
    } catch (error) {
      console.error('SystemTemplateService delete error:', error);
      throw error;
    }
  }

  static async extractTextFromTemplate(template: SystemTemplate): Promise<string> {
    try {
      console.log('Extracting text from template:', template.name);
      
      const blob = new Blob([template.file_data], { type: template.content_type });
      const file = new File([blob], template.file_name, { type: template.content_type });
      
      // Use mammoth to extract text from Word documents
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      const extractedText = result.value
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      console.log('Text extracted successfully, length:', extractedText.length);
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from template:', error);
      throw new Error('Failed to extract text from template');
    }
  }

  static downloadTemplate(template: SystemTemplate): void {
    try {
      console.log('Downloading template:', template.name);
      
      const blob = new Blob([template.file_data], { type: template.content_type });
      const url = URL.createObjectURL(blob);
      const link = globalThis.document.createElement('a');
      link.href = url;
      link.download = template.file_name;
      link.style.display = 'none';
      globalThis.document.body.appendChild(link);
      link.click();
      globalThis.document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Template download initiated successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      throw new Error('Failed to download template');
    }
  }
}
