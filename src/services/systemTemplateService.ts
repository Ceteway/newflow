
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

      console.log('Storing file data directly as Uint8Array, length:', data.file_data.length);
      
      const insertData = {
        name: data.name,
        description: data.description || null,
        category: data.category,
        file_name: data.file_name,
        file_data: data.file_data, // Store Uint8Array directly
        content_type: data.content_type,
        uploaded_by: user.id,
        is_active: true
      };

      console.log('Inserting template data:', { ...insertData, file_data: '[BASE64_DATA]' });

      const { data: template, error } = await supabase.from('system_templates')
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
          // file_data is already Uint8Array from BYTEA column
          const fileData = new Uint8Array(template.file_data);
          
          return {
            ...(template as SystemTemplate),
            file_data: fileData
          };
        } catch (decodeError) {
          console.error(`Error processing template ${template.id}:`, decodeError);
          console.warn(`Template ${template.name} has corrupted file data, returning empty data`);
          return {
            ...template,
            file_data: new Uint8Array() // Return empty if conversion fails
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
        const fileData = new Uint8Array(template.file_data);
        
        return {
          ...(template as SystemTemplate),
          file_data: fileData // Return Uint8Array directly
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
      if (updates.file_data) updateData.file_data = updates.file_data; // Store Uint8Array directly

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

      // Ensure file_data is Uint8Array for return
      const fileData = updates.file_data 
        ? updates.file_data 
        : new Uint8Array(template.file_data);
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
      console.log('Extracting text from template:', template.name, 'Size:', template.file_data.length, 'Type:', template.content_type);

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
        
        // Enhanced mammoth options for better conversion
        const options = {
          convertImage: mammoth.images.imgElement(function(image) {
            return image.read("base64").then(function(imageBuffer) {
              return {
                src: "data:" + image.contentType + ";base64," + imageBuffer
              };
            });
          }),
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh", 
            "p[style-name='Heading 3'] => h3:fresh",
            "p[style-name='Title'] => h1:fresh",
            "p[style-name='Subtitle'] => h2:fresh",
            "r[style-name='Strong'] => strong",
            "r[style-name='Emphasis'] => em",
            "p[style-name='Normal'] => p:fresh"
          ],
          includeDefaultStyleMap: true,
          includeEmbeddedStyleMap: true
        };
        
        // Use convertToHtml with enhanced options to preserve structure for blank space detection
        const result = await mammoth.convertToHtml({ arrayBuffer }, options);
        console.log('HTML conversion result:', result.messages);
        
        if (!result.value) {
          throw new Error('No HTML content extracted from document');
        }
        
        // Return HTML content directly for blank space detection and filling
        let htmlContent = result.value;
        
        // Clean up the HTML
        htmlContent = htmlContent
          .replace(/\r\n/g, '\n')
          .replace(/\n{3,}/g, '\n\n')
          .replace(/<p><\/p>/g, '')
          .replace(/<p>\s*<\/p>/g, '')
          .trim();

        console.log('HTML extracted successfully, length:', htmlContent.length);
        console.log('Sample of extracted HTML (first 500 chars):', htmlContent.substring(0, 500));
        
        // Check for variable placeholders in the extracted HTML
        const placeholderMatches = htmlContent.match(/\{\{[^}]+\}\}/g);
        if (placeholderMatches) {
          console.log('Found variable placeholders:', placeholderMatches);
        } else {
          console.warn('No variable placeholders found in extracted HTML. Will look for dot patterns for blank space detection.');
        }
        
        // Log any conversion warnings
        if (result.messages && result.messages.length > 0) {
          console.warn('Document conversion warnings:', result.messages);
        }
        
        if (htmlContent.length === 0) {
          throw new Error('Document appears to be empty or contains no readable text');
        }
        
        return htmlContent;
      } catch (mammothError) {
        console.warn('Mammoth extraction failed:', mammothError);
        
        // Try to provide more specific error information
        let errorDetails = 'Unknown parsing error';
        if (mammothError instanceof Error) {
          if (mammothError.message.includes('not a valid zip file')) {
            errorDetails = 'Invalid Word document format - file may be corrupted or not a valid .docx file';
          } else if (mammothError.message.includes('corrupted')) {
            errorDetails = 'Document appears to be corrupted';
          } else if (mammothError.message.includes('password')) {
            errorDetails = 'Document is password protected';
          } else {
            errorDetails = mammothError.message;
          }
        }
        
        // Return a placeholder text instead of failing completely
        return `[Template: ${template.name}]\n\nThis document could not be previewed due to format limitations.\n\nFilename: ${template.file_name}\nType: ${template.content_type}\nSize: ${template.file_data.length} bytes\nError: ${errorDetails}\n\nYou can still download and use this template for document generation.`;
      }
    } catch (error) {
      console.error('Error extracting text from template:', error);
      
      // Provide more specific error messages
      // Return a fallback message instead of throwing an error
      return `[Template: ${template.name}]\n\nThis document could not be previewed.\n\nFilename: ${template.file_name}\nType: ${template.content_type}\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nYou can still download and use this template for document generation.`;
    }
  }

  static downloadTemplate(template: SystemTemplate): void {
    try {
      console.log('Downloading template:', template.name);
      
      if (!template.file_data || template.file_data.length === 0) {
        throw new Error('No file data available for download');
      }

      // Create a fresh copy of the Uint8Array to avoid issues with detached ArrayBuffers
      const dataClone = new Uint8Array(template.file_data);
      
      // Create the blob with the proper content type and the cloned data
      const blob = new Blob([dataClone], { 
        type: template.content_type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
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
