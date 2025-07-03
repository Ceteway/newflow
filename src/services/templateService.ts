
import { supabase } from "@/integrations/supabase/client";
import { DatabaseTemplate, TemplateCategory, DocumentVariable } from "@/types/database";

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: TemplateCategory;
  content: string;
  variables: string[];
}

export class TemplateService {
  static async createTemplate(data: CreateTemplateData): Promise<DatabaseTemplate> {
    const { data: template, error } = await supabase
      .from('document_templates')
      .insert({
        name: data.name,
        description: data.description,
        category: data.category,
        content: data.content,
        variables: data.variables,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }

    return template;
  }

  static async getAllTemplates(): Promise<DatabaseTemplate[]> {
    const { data: templates, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch templates');
    }

    return templates || [];
  }

  static async getTemplateById(id: string): Promise<DatabaseTemplate | null> {
    const { data: template, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return template;
  }

  static async updateTemplate(id: string, updates: Partial<CreateTemplateData>): Promise<DatabaseTemplate> {
    const { data: template, error } = await supabase
      .from('document_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }

    return template;
  }

  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase
      .from('document_templates')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      throw new Error('Failed to delete template');
    }
  }

  static async generateDocument(templateId: string, variables: DocumentVariable[]): Promise<any> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create generated document record
    const { data: document, error } = await supabase
      .from('generated_documents')
      .insert({
        name: `${template.name}_${new Date().getTime()}`,
        template_id: templateId,
        content: template.content,
        variables_data: variables,
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating document:', error);
      throw new Error('Failed to generate document');
    }

    return document;
  }

  static extractVariablesFromContent(content: string): string[] {
    const variableRegex = /\{\{([^}]+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(content)) !== null) {
      const variableName = match[1].trim();
      if (!variables.includes(variableName)) {
        variables.push(variableName);
      }
    }

    return variables;
  }

  static fillTemplate(content: string, variables: DocumentVariable[]): string {
    let filledContent = content;
    
    variables.forEach(variable => {
      const placeholder = `{{${variable.key}}}`;
      const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      filledContent = filledContent.replace(regex, variable.value || '');
    });

    return filledContent;
  }
}
