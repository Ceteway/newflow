
export type TemplateCategory = 'agreements' | 'forms' | 'letters' | 'invoices' | 'reports';
export type DocumentStatus = 'draft' | 'completed' | 'archived';

export interface DatabaseTemplate {
  id: string;
  name: string;
  description: string | null;
  category: TemplateCategory;
  content: string;
  variables: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDocument {
  id: string;
  template_id: string;
  name: string;
  content: string;
  variables_data: Record<string, string>;
  status: DocumentStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateUsage {
  id: string;
  template_id: string;
  user_id: string | null;
  created_at: string;
}

export interface DocumentVariable {
  key: string;
  value: string;
}
