# Supabase Edge Functions Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Login to Supabase Dashboard
Go to [supabase.com](https://supabase.com) and navigate to your project: `hwonitvnvhcepwjqeodj`

### 2. Deploy Database Migration
Go to **SQL Editor** in your Supabase dashboard and run this migration:

```sql
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
  employment_type text,
  workplace_type text,
  locations text[],
  source_url text,
  
  -- Job content
  description_text text NOT NULL,
  requirements_summary text,
  skills text[],
  experience_min_years integer,
  
  -- Processing metadata
  processed_at timestamptz DEFAULT now(),
  raw_job_description text
);

-- Create job_user_interactions table
CREATE TABLE IF NOT EXISTS job_user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE,
  
  interaction_type text NOT NULL CHECK (interaction_type IN ('analyzed', 'applied', 'saved', 'dismissed', 'resume_generated')),
  match_score integer,
  matched_skills text[],
  missing_skills text[],
  recommendations text[],
  generated_resume_id uuid REFERENCES generated_resumes(id) ON DELETE SET NULL,
  notes text
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_user_interactions_user_id ON job_user_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_job_user_interactions_job_id ON job_user_interactions(job_id);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_user_interactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own jobs" ON jobs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view their own job interactions" ON job_user_interactions FOR ALL USING (auth.uid() = user_id);

-- Add updated_at trigger
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

### 3. Set Environment Variable
Go to **Settings → Edge Functions → Environment Variables** and add:
- **Key**: `ANTHROPIC_API_KEY`
- **Value**: Your Claude API key from Anthropic

### 4. Deploy Edge Functions via CLI (Recommended)

If you have Supabase CLI access:

```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref hwonitvnvhcepwjqeodj

# Deploy all functions
supabase functions deploy process-job-description
supabase functions deploy search-jobs-with-claude
```

### 5. Alternative: Manual Function Deployment

If CLI isn't available, go to **Edge Functions** in your Supabase dashboard:

#### Function 1: `process-job-description`
Create new function with this code: (copy from `/supabase/functions/process-job-description/index.ts`)

#### Function 2: `search-jobs-with-claude`
Create new function with this code: (copy from `/supabase/functions/search-jobs-with-claude/index.ts`)

## 🧪 Test the Deployment

### Test Process Job Description:
```bash
curl -X POST 'https://hwonitvnvhcepwjqeodj.supabase.co/functions/v1/process-job-description' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "jobDescription": "We are looking for a Senior Software Engineer...",
    "jobTitle": "Senior Software Engineer",
    "company": "TechCorp"
  }'
```

### Test Search Jobs:
```bash
curl -X POST 'https://hwonitvnvhcepwjqeodj.supabase.co/functions/v1/search-jobs-with-claude' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "jobTitle": "Product Manager",
    "location": "Remote",
    "experienceLevel": "Senior"
  }'
```

## 🎯 What Each Function Does

### `process-job-description`
- Takes raw job descriptions and extracts structured data
- Uses Claude AI to parse company name, skills, requirements, etc.
- Saves processed job data to the database
- Returns structured job information for analysis

### `search-jobs-with-claude`
- Uses Claude AI to generate realistic job listings
- Takes search criteria (title, location, experience level, skills)
- Returns 8-12 relevant job opportunities
- Provides fallback jobs if AI parsing fails

## ✅ Verification Steps

1. **Database**: Check that the new tables (`jobs`, `job_user_interactions`) exist
2. **Functions**: Verify both functions are deployed and green status
3. **Environment**: Confirm `ANTHROPIC_API_KEY` is set
4. **Frontend**: Test job search and job paste functionality in the app

## 🚨 Troubleshooting

- **Function fails**: Check logs in Supabase dashboard → Edge Functions → Logs
- **Database errors**: Verify migration ran successfully in SQL Editor
- **API errors**: Confirm Anthropic API key is valid and has credits
- **Frontend errors**: Check browser console for detailed error messages

Once deployed, your job search functionality will be fully operational with AI-powered job discovery and processing! 🎉