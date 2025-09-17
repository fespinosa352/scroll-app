-- Add missing critical_areas column to job_analyses table
ALTER TABLE public.job_analyses 
ADD COLUMN critical_areas TEXT[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.job_analyses.critical_areas IS 'Array of critical areas identified in job analysis';