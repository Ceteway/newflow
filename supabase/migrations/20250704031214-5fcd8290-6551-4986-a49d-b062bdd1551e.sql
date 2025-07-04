
-- Create a table for system templates that are available to all users
CREATE TABLE public.system_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category template_category NOT NULL DEFAULT 'agreements',
  file_name TEXT NOT NULL,
  file_data BYTEA NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  uploaded_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS on system templates
ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view system templates
CREATE POLICY "All users can view system templates" 
  ON public.system_templates 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users to upload system templates
CREATE POLICY "Authenticated users can upload system templates" 
  ON public.system_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to update their own system templates
CREATE POLICY "Users can update their own system templates" 
  ON public.system_templates 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow users to delete their own system templates
CREATE POLICY "Users can delete their own system templates" 
  ON public.system_templates 
  FOR DELETE 
  USING (auth.uid() = uploaded_by);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_system_templates_updated_at
  BEFORE UPDATE ON public.system_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
