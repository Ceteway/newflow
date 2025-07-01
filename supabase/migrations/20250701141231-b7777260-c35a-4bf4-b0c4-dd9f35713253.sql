
-- Create enum for template categories
CREATE TYPE template_category AS ENUM ('agreements', 'forms', 'letters', 'invoices', 'reports');

-- Create enum for document status
CREATE TYPE document_status AS ENUM ('draft', 'completed', 'archived');

-- Create table for storing document templates
CREATE TABLE public.document_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category template_category NOT NULL DEFAULT 'agreements',
  content TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for storing generated documents
CREATE TABLE public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.document_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  variables_data JSONB NOT NULL DEFAULT '{}',
  status document_status DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create table for template usage analytics
CREATE TABLE public.template_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.document_templates(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_templates
CREATE POLICY "Users can view all active templates" 
  ON public.document_templates 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Authenticated users can create templates" 
  ON public.document_templates 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own templates" 
  ON public.document_templates 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own templates" 
  ON public.document_templates 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for generated_documents
CREATE POLICY "Users can view their own documents" 
  ON public.generated_documents 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create their own documents" 
  ON public.generated_documents 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own documents" 
  ON public.generated_documents 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own documents" 
  ON public.generated_documents 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = created_by);

-- RLS Policies for template_usage
CREATE POLICY "Users can view their own usage data" 
  ON public.template_usage 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can track template usage" 
  ON public.template_usage 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_document_templates_updated_at 
  BEFORE UPDATE ON public.document_templates 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_generated_documents_updated_at 
  BEFORE UPDATE ON public.generated_documents 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert some default templates
INSERT INTO public.document_templates (name, description, category, content, variables) VALUES
('Basic Lease Agreement', 'Standard lease agreement template', 'agreements', 
'LEASE AGREEMENT

This lease agreement is made on {{current_date}} between {{landlord_name}} (Landlord) and {{tenant_name}} (Tenant).

Property: {{property_address}}
Lease Term: {{lease_term}} months
Monthly Rent: ${{monthly_rent}}
Security Deposit: ${{security_deposit}}

Terms and Conditions:
{{terms_and_conditions}}

Landlord Signature: _________________
Tenant Signature: _________________', 
'["current_date", "landlord_name", "tenant_name", "property_address", "lease_term", "monthly_rent", "security_deposit", "terms_and_conditions"]'),

('Employment Contract', 'Standard employment contract template', 'agreements',
'EMPLOYMENT CONTRACT

This employment contract is between {{company_name}} and {{employee_name}}.

Position: {{job_title}}
Start Date: {{start_date}}
Salary: ${{annual_salary}}
Benefits: {{benefits}}

Employee: _________________
Employer: _________________',
'["company_name", "employee_name", "job_title", "start_date", "annual_salary", "benefits"]'),

('Invoice Template', 'Professional invoice template', 'invoices',
'INVOICE

Invoice #: {{invoice_number}}
Date: {{invoice_date}}
Due Date: {{due_date}}

Bill To:
{{client_name}}
{{client_address}}

Description: {{service_description}}
Amount: ${{amount}}
Tax: ${{tax_amount}}
Total: ${{total_amount}}

Payment Terms: {{payment_terms}}',
'["invoice_number", "invoice_date", "due_date", "client_name", "client_address", "service_description", "amount", "tax_amount", "total_amount", "payment_terms"]');
