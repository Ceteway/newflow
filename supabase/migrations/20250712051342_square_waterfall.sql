/*
  # Create user documents table for document persistence

  1. New Tables
    - `user_documents`
      - `id` (text, primary key) - matches document ID from frontend
      - `user_id` (uuid, foreign key) - references auth.users
      - `name` (text) - document name
      - `content` (text) - document HTML content
      - `original_content` (text, nullable) - original document content
      - `document_type` (text) - 'system' or 'template'
      - `blank_spaces` (jsonb) - array of blank space objects
      - `created_at` (timestamptz) - creation timestamp
      - `modified_at` (timestamptz) - last modification timestamp

  2. Security
    - Enable RLS on `user_documents` table
    - Add policies for users to manage their own documents
    - Ensure data isolation between users

  3. Indexes
    - Add index on user_id for efficient queries
    - Add index on document_type for filtering
*/

-- Create user_documents table
CREATE TABLE IF NOT EXISTS public.user_documents (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  original_content TEXT,
  document_type TEXT NOT NULL CHECK (document_type IN ('system', 'template')),
  blank_spaces JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL,
  modified_at TIMESTAMPTZ NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_documents_user_id ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_documents_type ON public.user_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_user_documents_modified ON public.user_documents(modified_at DESC);

-- RLS Policies
CREATE POLICY "Users can view their own documents" 
  ON public.user_documents 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
  ON public.user_documents 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
  ON public.user_documents 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
  ON public.user_documents 
  FOR DELETE 
  TO authenticated
  USING (auth.uid() = user_id);