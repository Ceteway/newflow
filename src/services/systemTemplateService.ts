
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
      // Convert Uint8Array to base64 string for storage
      const base64Data = btoa(String.fromCharCode(...data.file_data));
      
      const { data: template, error } = await supabase
        .from('system_templates')
        .insert({
          name: data.name,
          description: data.description,
          category: data.category,
          file_name: data.file_name,
          file_data: base64Data,
          content_type: data.content_type,
          uploaded_by: (await supabase.auth.getUser()).data.user?.id,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Error uploading system template:', error);
        throw new Error(`Failed to upload system template: ${error.message}`);
      }

      return {
        ...template,
        file_data: new Uint8Array(atob(template.file_data).split('').map(char => char.charCodeAt(0)))
      };
    } catch (error) {
      console.error('SystemTemplateService upload error:', error);
      throw error;
    }
  }

  static async getAllSystemTemplates(): Promise<SystemTemplate[]> {
    try {
      const { data: templates, error } = await supabase
        .from('system_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching system templates:', error);
        throw new Error(`Failed to fetch system templates: ${error.message}`);
      }

      return (templates || []).map(template => ({
        ...template,
        file_data: new Uint8Array(atob(template.file_data).split('').map(char => char.charCodeAt(0)))
      }));
    } catch (error) {
      console.error('SystemTemplateService fetch error:', error);
      throw error;
    }
  }

  static async getSystemTemplateById(id: string): Promise<SystemTemplate | null> {
    try {
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

      return {
        ...template,
        file_data: new Uint8Array(atob(template.file_data).split('').map(char => char.charCodeAt(0)))
      };
    } catch (error) {
      console.error('SystemTemplateService get by ID error:', error);
      return null;
    }
  }

  static async deleteSystemTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_templates')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Error deleting system template:', error);
        throw new Error(`Failed to delete system template: ${error.message}`);
      }
    } catch (error) {
      console.error('SystemTemplateService delete error:', error);
      throw error;
    }
  }

  static async extractTextFromTemplate(template: SystemTemplate): Promise<string> {
    try {
      const blob = new Blob([template.file_data], { type: template.content_type });
      const file = new File([blob], template.file_name, { type: template.content_type });
      
      // Use the same extraction logic as in TemplateCreator
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return result.value
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch (error) {
      console.error('Error extracting text from template:', error);
      throw new Error('Failed to extract text from template');
    }
  }
}
