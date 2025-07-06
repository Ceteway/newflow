
-- Update RLS policies for system_templates to allow proper deletion
-- First, drop the existing policies
DROP POLICY IF EXISTS "Users can delete their own system templates" ON public.system_templates;
DROP POLICY IF EXISTS "Users can update their own system templates" ON public.system_templates;

-- Create new policies that allow admins or original uploaders to delete/update
CREATE POLICY "Users can update their own system templates" 
  ON public.system_templates 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by OR uploaded_by IS NULL)
  WITH CHECK (auth.uid() = uploaded_by OR uploaded_by IS NULL);

-- For soft delete (setting is_active to false)
CREATE POLICY "Users can delete their own system templates" 
  ON public.system_templates 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by OR uploaded_by IS NULL)
  WITH CHECK (auth.uid() = uploaded_by OR uploaded_by IS NULL);

-- Also allow hard delete if needed
CREATE POLICY "Users can hard delete their own system templates" 
  ON public.system_templates 
  FOR DELETE 
  USING (auth.uid() = uploaded_by OR uploaded_by IS NULL);
