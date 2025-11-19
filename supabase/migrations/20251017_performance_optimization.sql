-- Performance Optimization Migration
-- Date: 2025-10-17
-- Description: Add missing performance indexes and optimize JSON queries

-- 1. Resume-specific performance indexes
-- Index for ATS score queries (ordered by score)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_ats_score_desc
ON public.resumes(user_id, ats_score DESC NULLS LAST)
WHERE ats_score IS NOT NULL;

-- Index for active resume lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_active
ON public.resumes(user_id, updated_at DESC)
WHERE is_active = true;

-- Index for resume name searches (for autocomplete/search)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_name_trgm
ON public.resumes USING gin(name gin_trgm_ops);

-- Index for source file tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_source_file
ON public.resumes(source_file)
WHERE source_file IS NOT NULL;

-- 2. JSON content optimization indexes
-- Enable trigram extension for text search if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for JSON content search in resumes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_content_gin
ON public.resumes USING gin(content)
WHERE content IS NOT NULL;

-- Index for generated resumes content search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_resumes_content_gin
ON public.generated_resumes USING gin(content)
WHERE content IS NOT NULL;

-- Index for job descriptions in generated resumes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_generated_resumes_job_desc_trgm
ON public.generated_resumes USING gin(job_description gin_trgm_ops)
WHERE job_description IS NOT NULL;

-- 3. Skills and experience optimization
-- Index for skill name searches across user_skills
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_name_trgm
ON public.user_skills USING gin(skill_name gin_trgm_ops);

-- Index for skills_experience with proficiency filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_exp_proficiency
ON public.skills_experience(user_id, proficiency_level, skill_name)
WHERE proficiency_level IS NOT NULL;

-- 4. Job analysis optimization
-- Index for job analysis match scores
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_analyses_match_score
ON public.job_analyses(user_id, match_score DESC, created_at DESC);

-- Index for job title searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_analyses_title_trgm
ON public.job_analyses USING gin(job_title gin_trgm_ops);

-- 5. Work experience optimization
-- Index for current positions with company lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_exp_current_company
ON public.work_experiences(user_id, company_id, title)
WHERE is_current = true;

-- Index for employment type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_exp_employment_type
ON public.work_experiences(user_id, employment_type, start_date DESC)
WHERE employment_type IS NOT NULL;

-- 6. Projects optimization
-- Index for projects with technologies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_technologies_gin
ON public.projects USING gin(technologies_used)
WHERE technologies_used IS NOT NULL;

-- Index for project impact metrics search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_metrics_trgm
ON public.projects USING gin(impact_metrics gin_trgm_ops)
WHERE impact_metrics IS NOT NULL;

-- 7. Source resumes optimization
-- Index for parsed content search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_source_resumes_content_gin
ON public.source_resumes USING gin(raw_content)
WHERE raw_content IS NOT NULL;

-- 8. Certifications optimization
-- Index for certification expiration tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_expiration
ON public.certifications(user_id, expiration_date)
WHERE expiration_date IS NOT NULL AND expiration_date > CURRENT_DATE;

-- Index for issuing organization search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_org_trgm
ON public.certifications USING gin(issuing_organization gin_trgm_ops);

-- 9. Companies optimization (for autocomplete)
-- Index for company name search with case-insensitive lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_trgm
ON public.companies USING gin(name gin_trgm_ops);

-- Add performance monitoring comments
COMMENT ON INDEX idx_resumes_ats_score_desc IS 'Optimizes queries for top-scoring resumes by user';
COMMENT ON INDEX idx_resumes_active IS 'Fast lookup for active resume per user';
COMMENT ON INDEX idx_resumes_content_gin IS 'Enables full-text search within resume JSON content';
COMMENT ON INDEX idx_user_skills_name_trgm IS 'Optimizes skill name autocomplete and search';
COMMENT ON INDEX idx_job_analyses_match_score IS 'Optimizes job match scoring queries';
COMMENT ON INDEX idx_work_exp_current_company IS 'Fast lookup for current employment with company details';
COMMENT ON INDEX idx_projects_technologies_gin IS 'Enables technology stack search within projects';
COMMENT ON INDEX idx_certifications_expiration IS 'Tracks active/valid certifications efficiently';