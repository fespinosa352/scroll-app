-- Fix the issues with professional data import

-- 1. Allow users to insert companies for professional data import
CREATE POLICY "Users can insert companies for their data"
ON public.companies
FOR INSERT
WITH CHECK (true);

-- 2. Drop the problematic skill_context_check constraint that prevents general skills
-- This constraint required either work_experience_id OR project_id, but general skills should have both as NULL
ALTER TABLE public.skills_experience 
DROP CONSTRAINT IF EXISTS skill_context_check;

-- 3. Add a more flexible constraint that allows general skills (both IDs null) or specific context skills
ALTER TABLE public.skills_experience 
ADD CONSTRAINT skill_context_flexible_check 
CHECK (
  (work_experience_id IS NULL AND project_id IS NULL) OR  -- General skills
  (work_experience_id IS NOT NULL AND project_id IS NULL) OR  -- Work-specific skills
  (work_experience_id IS NULL AND project_id IS NOT NULL)     -- Project-specific skills
);