-- Drop Resumes Table Migration
-- Date: 2025-11-25
-- Description: Remove the resumes table and all related database objects
-- This migration keeps source_resumes and generated_resumes tables intact

-- 1. Drop indexes on resumes table
DROP INDEX IF EXISTS public.idx_resumes_ats_score_desc;
DROP INDEX IF EXISTS public.idx_resumes_active;
DROP INDEX IF EXISTS public.idx_resumes_name_trgm;
DROP INDEX IF EXISTS public.idx_resumes_source_file;
DROP INDEX IF EXISTS public.idx_resumes_content_gin;

-- 2. Drop RLS policies
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can create their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;

-- 3. Drop triggers
DROP TRIGGER IF EXISTS update_resumes_updated_at ON public.resumes;

-- 4. Drop the resumes table
DROP TABLE IF EXISTS public.resumes CASCADE;

-- 5. Update monitoring views to remove resumes table references

-- Recreate data_quality_report view without resumes table
DROP VIEW IF EXISTS public.data_quality_report;
CREATE OR REPLACE VIEW public.data_quality_report AS
SELECT
    'user_skills' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE skill_name IS NULL OR trim(skill_name) = '') as empty_names,
    COUNT(*) FILTER (WHERE proficiency_level IS NOT NULL AND proficiency_level NOT IN ('Beginner', 'Intermediate', 'Advanced', 'Expert')) as invalid_proficiency,
    COUNT(*) FILTER (WHERE years_experience IS NOT NULL AND years_experience < 0) as negative_experience,
    COUNT(*) FILTER (WHERE created_at > updated_at) as inconsistent_dates
FROM public.user_skills

UNION ALL

SELECT
    'work_experiences' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE title IS NULL OR trim(title) = '') as empty_titles,
    COUNT(*) FILTER (WHERE start_date > COALESCE(end_date, CURRENT_DATE)) as invalid_date_ranges,
    COUNT(*) FILTER (WHERE is_current = true AND end_date IS NOT NULL) as current_with_end_date,
    COUNT(*) FILTER (WHERE created_at > updated_at) as inconsistent_dates
FROM public.work_experiences

UNION ALL

SELECT
    'source_resumes' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE name IS NULL OR trim(name) = '') as empty_names,
    COUNT(*) FILTER (WHERE raw_content IS NULL) as null_content,
    0 as invalid_scores,
    COUNT(*) FILTER (WHERE created_at > parsed_at) as inconsistent_dates
FROM public.source_resumes

UNION ALL

SELECT
    'generated_resumes' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE name IS NULL OR trim(name) = '') as empty_names,
    COUNT(*) FILTER (WHERE content IS NULL) as null_content,
    COUNT(*) FILTER (WHERE ats_score IS NOT NULL AND (ats_score < 0 OR ats_score > 100)) as invalid_ats_scores,
    COUNT(*) FILTER (WHERE created_at > updated_at) as inconsistent_dates
FROM public.generated_resumes;

-- Recreate user_activity_summary view without resumes table
DROP VIEW IF EXISTS public.user_activity_summary;
CREATE OR REPLACE VIEW public.user_activity_summary AS
SELECT
    p.user_id,
    p.display_name,
    p.created_at as user_created,
    COUNT(DISTINCT sr.id) as source_resumes,
    COUNT(DISTINCT gr.id) as generated_resumes,
    COUNT(DISTINCT we.id) as work_experiences,
    COUNT(DISTINCT e.id) as education_entries,
    COUNT(DISTINCT c.id) as certifications,
    COUNT(DISTINCT us.id) as skills,
    COUNT(DISTINCT ja.id) as job_analyses,
    MAX(GREATEST(
        sr.created_at,
        gr.updated_at,
        we.updated_at,
        e.updated_at,
        c.updated_at,
        us.updated_at,
        ja.updated_at
    )) as last_activity
FROM public.profiles p
LEFT JOIN public.source_resumes sr ON p.user_id = sr.user_id
LEFT JOIN public.generated_resumes gr ON p.user_id = gr.user_id
LEFT JOIN public.work_experiences we ON p.user_id = we.user_id
LEFT JOIN public.education e ON p.user_id = e.user_id
LEFT JOIN public.certifications c ON p.user_id = c.user_id
LEFT JOIN public.user_skills us ON p.user_id = us.user_id
LEFT JOIN public.job_analyses ja ON p.user_id = ja.user_id
GROUP BY p.user_id, p.display_name, p.created_at
ORDER BY last_activity DESC NULLS LAST;

-- 6. Add comments
COMMENT ON VIEW public.data_quality_report IS 'Identify data consistency and validation issues (updated to exclude resumes table)';
COMMENT ON VIEW public.user_activity_summary IS 'Track user engagement and data completeness (updated to use source_resumes and generated_resumes)';
