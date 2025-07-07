
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

// Helper function to convert Uint8Array to base64 for database storage
function uint8ArrayToBase64(uint8Array: Uint8Array): string {
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
}

// Helper function to convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  try {
    if (!base64 || base64.trim() === '') {
      console.warn('Empty base64 data provided');
      return new Uint8Array();
    }
    
    // Clean the base64 string - remove any whitespace and validate format
    const cleanBase64 = base64.trim().replace(/\s/g, '');
    
    // Basic validation for base64 format
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64)) {
      console.warn('Invalid base64 format detected');
      return new Uint8Array();
    }
    
    // Ensure proper padding
    const paddedBase64 = cleanBase64 + '='.repeat((4 - cleanBase64.length % 4) % 4);
    
    const binary = atob(paddedBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (error) {
    console.error('Error decoding base64:', error, 'Input length:', base64?.length || 0);
    console.warn('Returning empty Uint8Array due to base64 decode error');
    return new Uint8Array();
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

      if (!user) {
        throw new Error('User not authenticated');
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
        uploaded_by: user.id,
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
      
      // Check authentication first
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.warn('Authentication issue when fetching templates:', userError.message);
        // Don't throw error, just log warning and continue with empty array
        return [];
      }
      
      const { data: templates, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching system templates:', error);
        // Return empty array instead of throwing to prevent app crash
        console.warn('Returning empty templates array due to fetch error');
        return [];
      }

      console.log(`Fetched ${templates?.length || 0} system templates`);

      return (templates || []).map(template => {
        try {
          // Handle both string and already converted data
          let fileData: Uint8Array;
          if (typeof template.file_data === 'string') {
            fileData = base64ToUint8Array(template.file_data);
          } else {
            fileData = new Uint8Array(template.file_data || []);
          }
          
          return {
            ...template,
            file_data: fileData
          };
        } catch (decodeError) {
          console.error(`Error processing template ${template.id}:`, decodeError);
          console.warn(`Template ${template.name} has corrupted file data, returning empty data`);
          return {
            ...template,
            file_data: new Uint8Array()
          };
        }
      });
    } catch (error) {
      console.error('SystemTemplateService fetch error:', error);
      // Return empty array instead of throwing to prevent app crash
      console.warn('Returning empty templates array due to service error');
      return [];
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
        let fileData: Uint8Array;
        if (typeof template.file_data === 'string') {
          fileData = base64ToUint8Array(template.file_data);
        } else {
          fileData = new Uint8Array(template.file_data || []);
        }
        
        return {
          ...template,
          file_data: fileData
        };
      } catch (decodeError) {
        console.error(`Error processing template ${id}:`, decodeError);
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

      let fileData: Uint8Array;
      if (updates.file_data) {
        fileData = updates.file_data;
      } else if (typeof template.file_data === 'string') {
        fileData = base64ToUint8Array(template.file_data);
      } else {
        fileData = new Uint8Array(template.file_data || []);
      }

      return {
        ...template,
        file_data: fileData
      };
    } catch (error) {
      console.error('SystemTemplateService update error:', error);
      throw error;
    }
  }

  static async deleteSystemTemplate(id: string): Promise<void> {
    try {
      console.log('Deleting system template:', id);
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required for deletion');
      }
      
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

  static async deleteAllSystemTemplates(): Promise<number> {
    try {
      console.log('Starting deletion of all system templates...');
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required for deletion');
      }
      
      // First get all templates to count them
      const { data: templates, error: fetchError } = await supabase
        .from('system_templates')
        .select('id, name')
        .eq('is_active', true);

      if (fetchError) {
        console.error('Error fetching templates for deletion:', fetchError);
        throw new Error(`Failed to fetch templates: ${fetchError.message}`);
      }

      const templateCount = templates?.length || 0;
      console.log(`Found ${templateCount} templates to delete`);

      if (templateCount === 0) {
        console.log('No templates found to delete');
        return 0;
      }

      // Delete all templates by setting is_active to false (soft delete)
      const { error: deleteError } = await supabase
        .from('system_templates')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deleteError) {
        console.error('Error deleting all system templates:', deleteError);
        throw new Error(`Failed to delete templates: ${deleteError.message}`);
      }

      console.log(`Successfully deleted ${templateCount} system templates`);
      return templateCount;
    } catch (error) {
      console.error('SystemTemplateService deleteAll error:', error);
      throw error;
    }
  }

  static async hardDeleteAllSystemTemplates(): Promise<number> {
    try {
      console.log('Starting HARD deletion of all system templates...');
      
      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication required for deletion');
      }
      
      // First get all templates to count them (including inactive ones)
      const { data: templates, error: fetchError } = await supabase
        .from('system_templates')
        .select('id, name');

      if (fetchError) {
        console.error('Error fetching templates for hard deletion:', fetchError);
        throw new Error(`Failed to fetch templates: ${fetchError.message}`);
      }

      const templateCount = templates?.length || 0;
      console.log(`Found ${templateCount} templates to hard delete`);

      if (templateCount === 0) {
        console.log('No templates found to delete');
        return 0;
      }

      // Hard delete all templates (permanent removal)
      const { error: deleteError } = await supabase
        .from('system_templates')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that matches all)

      if (deleteError) {
        console.error('Error hard deleting all system templates:', deleteError);
        throw new Error(`Failed to hard delete templates: ${deleteError.message}`);
      }

      console.log(`Successfully hard deleted ${templateCount} system templates`);
      return templateCount;
    } catch (error) {
      console.error('SystemTemplateService hardDeleteAll error:', error);
      throw error;
    }
  }

  static async extractTextFromTemplate(template: SystemTemplate): Promise<string> {
    try {
      console.log('Extracting text from template:', template.name, 'Size:', template.file_data.length);

      if (!template.file_data || template.file_data.length === 0) {
        throw new Error('No file data available');
      }

      try {
        // Create ArrayBuffer from Uint8Array for mammoth
        const arrayBuffer = template.file_data.buffer.slice(
          template.file_data.byteOffset,
          template.file_data.byteOffset + template.file_data.byteLength
        );
        
        console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
        
        // Dynamically import mammoth to ensure it loads properly
        const mammoth = await import('mammoth');
        console.log('Mammoth imported successfully');
        
        const result = await mammoth.extractRawText({ arrayBuffer });
        console.log('Raw text extraction result:', result.messages);
        
        if (!result.value) {
          throw new Error('No text content extracted from document');
        }
        
        const extractedText = result.value
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .trim();

        console.log('Text extracted successfully, length:', extractedText.length);
        
        if (extractedText.length === 0) {
          throw new Error('Document appears to be empty or contains no readable text');
        }
        
        return extractedText;
      } catch (mammothError) {
        console.warn('Mammoth extraction failed, falling back to placeholder text:', mammothError);
        
        // Return a placeholder text instead of failing completely
        return `[Template: ${template.name}]\n\nThis document could not be previewed due to format limitations.\n\nFilename: ${template.file_name}\nType: ${template.content_type}\nSize: ${template.file_data.length} bytes\n\nYou can still download and use this template.`;
      }
    } catch (error) {
      console.error('Error extracting text from template:', error);
      
      // Provide more specific error messages
      // Return a fallback message instead of throwing an error
      return `[Template: ${template.name}]\n\nThis document could not be previewed.\n\nFilename: ${template.file_name}\nType: ${template.content_type}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nYou can still download and use this template.`;
    }
  }

  static downloadTemplate(template: SystemTemplate): void {
    try {
      console.log('Downloading template:', template.name);
      
      if (!template.file_data || template.file_data.length === 0) {
        throw new Error('No file data available for download');
      }
      
      // Create a proper ArrayBuffer from the Uint8Array to ensure compatibility
      const arrayBuffer = template.file_data.buffer.slice(
        template.file_data.byteOffset,
        template.file_data.byteOffset + template.file_data.byteLength
      );
      const blob = new Blob([arrayBuffer], { type: template.content_type });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = template.file_name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log('Template download initiated successfully');
    } catch (error) {
      console.error('Error downloading template:', error);
      throw new Error('Failed to download template');
    }
  }
}
