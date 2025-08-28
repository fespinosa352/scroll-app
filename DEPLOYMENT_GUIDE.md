# Job Search Functionality Deployment Guide

This guide outlines the steps to deploy the new job search functionality to your Supabase project.

## 1. Database Migrations

Run this SQL migration in your Supabase dashboard (SQL Editor):

```sql
-- File: supabase/migrations/20250826_add_job_search_tables.sql

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
```

## 2. Supabase Function Deployment

Deploy the new Supabase Edge Function:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the new function
supabase functions deploy process-job-description
```

The function file is already created at: `supabase/functions/process-job-description/index.ts`

## 3. Environment Variables

Ensure your Supabase project has the required environment variable:
- `ANTHROPIC_API_KEY`: Your Anthropic (Claude) API key

Set this in your Supabase dashboard under Settings → Edge Functions → Environment Variables.

## 4. Type Definitions

The TypeScript types have been updated in `src/integrations/supabase/types.ts` to include the new tables:
- `jobs` table
- `job_user_interactions` table

## 5. Frontend Components

The following new components and hooks have been created:
- `src/components/JobSearch.tsx`: Main job search interface
- Enhanced `src/hooks/useResumeVersions.ts`: Added job data resume generation
- Updated `src/pages/Index.tsx`: Added job search tab to navigation

## 6. Testing Checklist

Once deployed, test these features:

1. **Job Description Processing**
   - Paste a job description in the Job Search tab
   - Verify it gets processed and structured data is extracted
   - Check that job data is saved to the `jobs` table

2. **Job Matching**
   - Ensure users with profile data can analyze job matches
   - Verify match scores and skill comparisons work
   - Check that interactions are saved to `job_user_interactions` table

3. **Resume Generation**
   - Test generating optimized resumes from job data
   - Verify resumes are saved with job context
   - Check that navigation to editor works

4. **Navigation Integration**
   - Test tab switching between Job Search, Job Match, and other tabs
   - Verify responsive design on different screen sizes

## 7. Features Overview

### Core Functionality
- **AI-Powered Job Processing**: Uses Claude API to extract structured data from job descriptions
- **Smart Job Matching**: Compares user profile against job requirements
- **Resume Optimization**: Generates tailored resumes for specific jobs
- **User Interaction Tracking**: Saves job interactions and analysis results

### User Experience
- **Multi-Step Workflow**: Paste → Process → Analyze → Optimize
- **Real-time Feedback**: Progress indicators and status updates
- **Responsive Design**: Works on desktop and mobile
- **Integration**: Seamlessly integrated with existing navigation

### Data Management
- **Structured Storage**: Jobs stored with categorized, searchable data
- **User Privacy**: RLS ensures users only see their own data
- **Performance**: Indexed tables for fast queries
- **Audit Trail**: Complete interaction history

## 8. Future Enhancements

Consider these additional features:
- Job search filters and sorting
- Bulk job import from job boards
- Interview preparation based on job requirements
- Salary insights and negotiation tips
- Application status tracking