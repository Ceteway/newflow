-- Add metadata fields to system_templates table
ALTER TABLE public.system_templates 
ADD COLUMN IF NOT EXISTS version TEXT,
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS last_used TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;

-- Create a function to update usage statistics when a template is used
CREATE OR REPLACE FUNCTION update_template_usage()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.system_templates
  SET 
    usage_count = usage_count + 1,
    last_used = NOW()
  WHERE id = NEW.template_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update usage statistics when a document is generated
CREATE TRIGGER update_template_usage_on_document_generation
AFTER INSERT ON public.generated_documents
FOR EACH ROW
WHEN (NEW.template_id IS NOT NULL)
EXECUTE FUNCTION update_template_usage();

-- Create a table for template versions to track history
CREATE TABLE IF NOT EXISTS public.template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.system_templates(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_data BYTEA NOT NULL,
  content_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(template_id, version_number)
);

-- Enable RLS on template versions
ALTER TABLE public.template_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for template versions
CREATE POLICY "Users can view template versions" 
  ON public.template_versions 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can create template versions" 
  ON public.template_versions 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Create a function to automatically increment version number
CREATE OR REPLACE FUNCTION get_next_template_version(template_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version
  FROM public.template_versions
  WHERE template_id = $1;
  
  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Create a view for template usage statistics
CREATE OR REPLACE VIEW public.template_usage_stats AS
SELECT 
  t.id,
  t.name,
  t.category,
  t.usage_count,
  t.last_used,
  COUNT(DISTINCT g.id) AS document_count,
  MAX(g.created_at) AS last_document_generated,
  COUNT(DISTINCT v.id) AS version_count,
  MAX(v.created_at) AS last_version_created
FROM 
  public.system_templates t
LEFT JOIN 
  public.generated_documents g ON t.id = g.template_id
LEFT JOIN 
  public.template_versions v ON t.id = v.template_id
WHERE 
  t.is_active = true
GROUP BY 
  t.id, t.name, t.category, t.usage_count, t.last_used;

-- Grant access to the view
GRANT SELECT ON public.template_usage_stats TO authenticated;