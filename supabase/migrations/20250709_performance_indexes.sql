-- Performance Optimization: Critical Indexes for User Queries
-- This migration adds composite indexes to improve query performance

-- Add composite indexes for work_experiences
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_experiences_user_date 
ON work_experiences(user_id, start_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_experiences_current 
ON work_experiences(user_id, is_current) WHERE is_current = true;

-- Add composite indexes for education
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_education_user_date 
ON education(user_id, start_date DESC);

-- Add composite indexes for certifications  
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_certifications_user_date 
ON certifications(user_id, issue_date DESC);

-- Add index for projects linked to work experiences
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projects_work_experience 
ON projects(work_experience_id, created_at DESC);

-- Add index for skills_experience queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_experience_work_exp 
ON skills_experience(work_experience_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_skills_experience_project 
ON skills_experience(project_id);

-- Add index for user skills
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_skills_user 
ON user_skills(user_id, created_at DESC);

-- Add index for resumes by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_resumes_user_date 
ON resumes(user_id, created_at DESC);

-- Add index for job analyses by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_job_analyses_user_date 
ON job_analyses(user_id, created_at DESC);

-- Add unique constraint on company names (case-insensitive)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_companies_name_unique 
ON companies(LOWER(TRIM(name)));

-- Comment explaining the performance improvements
COMMENT ON INDEX idx_work_experiences_user_date IS 'Optimizes user work experience queries ordered by date';
COMMENT ON INDEX idx_work_experiences_current IS 'Optimizes queries for current work positions';
COMMENT ON INDEX idx_education_user_date IS 'Optimizes user education queries ordered by date';
COMMENT ON INDEX idx_certifications_user_date IS 'Optimizes user certification queries ordered by date';
COMMENT ON INDEX idx_companies_name_unique IS 'Prevents duplicate companies and enables efficient UPSERT operations';