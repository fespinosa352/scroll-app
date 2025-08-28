-- Create jobs table to store structured job data
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic job information
  company_name text NOT NULL,
  title text NOT NULL,
  category text,
  employment_type text, -- full-time, part-time, contract, etc.
  workplace_type text, -- remote, hybrid, on-site
  locations text[], -- array of location strings
  source_url text,
  
  -- Job content
  description_text text NOT NULL,
  requirements_summary text,
  skills text[], -- array of required skills
  experience_min_years integer,
  
  -- Processing metadata
  processed_at timestamptz DEFAULT now(),
  raw_job_description text -- original pasted content
);

-- Create job_user_interactions table to track user actions with jobs
CREATE TABLE IF NOT EXISTS job_user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  
  -- Interaction types
  interaction_type text NOT NULL CHECK (interaction_type IN ('analyzed', 'applied', 'saved', 'dismissed', 'resume_generated')),
  
  -- Analysis results when type is 'analyzed'
  match_score integer,
  matched_skills text[],
  missing_skills text[],
  recommendations text[],
  
  -- Resume generation when type is 'resume_generated'
  generated_resume_id uuid REFERENCES generated_resumes(id) ON DELETE SET NULL,
  
  -- Additional metadata
  notes text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company_name ON jobs(company_name);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs(title);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);

CREATE INDEX IF NOT EXISTS idx_job_user_interactions_user_id ON job_user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_user_interactions_job_id ON job_user_interactions(job_id);
CREATE INDEX IF NOT EXISTS idx_job_user_interactions_type ON job_user_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_job_user_interactions_created_at ON job_user_interactions(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own jobs" ON jobs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own job interactions" ON job_user_interactions
  FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger for jobs table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_user_interactions_updated_at BEFORE UPDATE ON job_user_interactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();