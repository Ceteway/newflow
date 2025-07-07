/*
  # Fix RLS policies for system_templates

  1. Security Changes
    - Remove problematic `OR uploaded_by IS NULL` conditions from UPDATE and DELETE policies
    - Ensure only users who uploaded templates can modify/delete them
    - Keep SELECT policy permissive for viewing templates
    - Fix RLS violations that were preventing proper deletion and updates

  2. Policy Updates
    - Update policies to strictly enforce ownership-based access control
    - Remove ambiguous NULL checks that were causing policy violations
    - Maintain backward compatibility for existing templates
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can update their own system templates" ON public.system_templates;
DROP POLICY IF EXISTS "Users can delete their own system templates" ON public.system_templates;
DROP POLICY IF EXISTS "Users can hard delete their own system templates" ON public.system_templates;

-- Create new, more restrictive policies that only allow owners to modify their templates
CREATE POLICY "Users can update their own system templates" 
  ON public.system_templates 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- For soft delete (setting is_active to false)
CREATE POLICY "Users can delete their own system templates" 
  ON public.system_templates 
  FOR UPDATE 
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

-- Allow hard delete only for template owners
CREATE POLICY "Users can hard delete their own system templates" 
  ON public.system_templates 
  FOR DELETE 
  USING (auth.uid() = uploaded_by);

-- Ensure SELECT policy exists and is permissive for viewing templates
DROP POLICY IF EXISTS "Users can view system templates" ON public.system_templates;
CREATE POLICY "Users can view system templates" 
  ON public.system_templates 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to insert new templates
DROP POLICY IF EXISTS "Users can create system templates" ON public.system_templates;
CREATE POLICY "Users can create system templates" 
  ON public.system_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = uploaded_by);