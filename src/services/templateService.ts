
import { supabase } from "@/integrations/supabase/client";
import { DatabaseTemplate, DatabaseDocument, DocumentVariable, TemplateCategory, DocumentStatus } from "@/types/database";

export class TemplateService {
  // Template Management
  static async getAllTemplates(): Promise<DatabaseTemplate[]> {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching templates:', error);
      throw new Error('Failed to fetch templates');
    }

    return data || [];
  }

  static async getTemplateById(id: string): Promise<DatabaseTemplate | null> {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching template:', error);
      return null;
    }

    return data;
  }

  static async createTemplate(template: {
    name: string;
    description?: string;
    category: TemplateCategory;
    content: string;
    variables: string[];
  }): Promise<DatabaseTemplate> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const { data, error } = await supabase
      .from('document_templates')
      .insert({
        ...template,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating template:', error);
      throw new Error('Failed to create template');
    }

    return data;
  }

  static async updateTemplate(id: string, updates: Partial<DatabaseTemplate>): Promise<DatabaseTemplate> {
    const { data, error } = await supabase
      .from('document_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      throw new Error('Failed to update template');
    }

    return data;
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

  // Document Generation
  static async generateDocument(templateId: string, variables: DocumentVariable[], name?: string): Promise<DatabaseDocument> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    // Populate template content with variables
    let content = template.content;
    const variablesData: Record<string, string> = {};

    variables.forEach(variable => {
      const placeholder = `{{${variable.key}}}`;
      content = content.replace(new RegExp(placeholder, 'g'), variable.value);
      variablesData[variable.key] = variable.value;
    });

    const documentName = name || `${template.name} - ${new Date().toLocaleDateString()}`;

    const { data, error } = await supabase
      .from('generated_documents')
      .insert({
        template_id: templateId,
        name: documentName,
        content,
        variables_data: variablesData,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error generating document:', error);
      throw new Error('Failed to generate document');
    }

    // Track template usage
    await this.trackTemplateUsage(templateId);

    return data;
  }

  static async getUserDocuments(): Promise<DatabaseDocument[]> {
    const { data, error } = await supabase
      .from('generated_documents')
      .select(`
        *,
        document_templates(name, category)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }

    return data || [];
  }

  static async updateDocumentStatus(id: string, status: DocumentStatus): Promise<void> {
    const { error } = await supabase
      .from('generated_documents')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating document status:', error);
      throw new Error('Failed to update document status');
    }
  }

  static async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('generated_documents')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting document:', error);
      throw new Error('Failed to delete document');
    }
  }

  // Utility Methods
  static async trackTemplateUsage(templateId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('template_usage')
      .insert({
        template_id: templateId,
        user_id: user.id
      });
  }

  static extractVariablesFromContent(content: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1].trim());
    }

    return Array.from(variables);
  }

  static async getTemplatesByCategory(category: TemplateCategory): Promise<DatabaseTemplate[]> {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching templates by category:', error);
      throw new Error('Failed to fetch templates');
    }

    return data || [];
  }

  static downloadDocument(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}
