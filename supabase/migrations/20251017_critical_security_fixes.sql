-- Critical Security Fixes Migration
-- Date: 2025-10-17
-- Description: Fix missing RLS policies and add essential security constraints

-- 1. Fix missing RLS policies on resumes table
-- The resumes table was missing proper RLS policies which is a critical security issue

-- First verify RLS is enabled (should already be from earlier migration)
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can create their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;

-- Create comprehensive RLS policies for resumes table
CREATE POLICY "Users can view their own resumes"
ON public.resumes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes"
ON public.resumes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes"
ON public.resumes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes"
ON public.resumes
FOR DELETE
USING (auth.uid() = user_id);

-- 2. Add data validation constraints
-- Ensure resume names are not empty
ALTER TABLE public.resumes
ADD CONSTRAINT resumes_name_not_empty
CHECK (length(trim(name)) > 0);

-- Ensure valid ATS scores (0-100 range)
ALTER TABLE public.resumes
ADD CONSTRAINT resumes_ats_score_valid
CHECK (ats_score IS NULL OR (ats_score >= 0 AND ats_score <= 100));

-- Add constraints for profiles
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_display_name_length
CHECK (display_name IS NULL OR length(trim(display_name)) > 0);

-- Add email format validation for profiles (basic check)
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_email_format
CHECK (
    email IS NULL OR
    email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- 3. Add security for user_skills table
-- Ensure skill names are not empty
ALTER TABLE public.user_skills
ADD CONSTRAINT user_skills_name_not_empty
CHECK (length(trim(skill_name)) > 0);

-- Ensure valid proficiency levels
ALTER TABLE public.user_skills
ADD CONSTRAINT user_skills_proficiency_valid
CHECK (
    proficiency_level IS NULL OR
    proficiency_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')
);

-- 4. Add constraints for work experiences
ALTER TABLE public.work_experiences
ADD CONSTRAINT work_exp_title_not_empty
CHECK (length(trim(title)) > 0);

ALTER TABLE public.work_experiences
ADD CONSTRAINT work_exp_start_date_valid
CHECK (start_date <= COALESCE(end_date, CURRENT_DATE));

-- 5. Add constraints for education
ALTER TABLE public.education
ADD CONSTRAINT education_degree_not_empty
CHECK (length(trim(degree)) > 0);

ALTER TABLE public.education
ADD CONSTRAINT education_institution_not_empty
CHECK (length(trim(institution)) > 0);

-- 6. Add constraints for certifications
ALTER TABLE public.certifications
ADD CONSTRAINT cert_name_not_empty
CHECK (length(trim(name)) > 0);

ALTER TABLE public.certifications
ADD CONSTRAINT cert_org_not_empty
CHECK (length(trim(issuing_organization)) > 0);

-- Add comments for documentation
COMMENT ON CONSTRAINT resumes_name_not_empty ON public.resumes IS 'Ensures resume names are not empty or whitespace only';
COMMENT ON CONSTRAINT resumes_ats_score_valid ON public.resumes IS 'Validates ATS scores are between 0 and 100';
COMMENT ON CONSTRAINT profiles_email_format ON public.profiles IS 'Basic email format validation';
COMMENT ON CONSTRAINT user_skills_proficiency_valid ON public.user_skills IS 'Validates proficiency levels are from allowed set';