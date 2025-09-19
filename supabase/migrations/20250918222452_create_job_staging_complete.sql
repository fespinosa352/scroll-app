-- Create job_staging table
CREATE TABLE public.job_staging (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_description TEXT NOT NULL,
  extracted_keywords JSONB,
  status TEXT DEFAULT 'ready',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_staging ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY 'Users can view their own staged jobs' ON public.job_staging FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY 'Users can create their own staged jobs' ON public.job_staging FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY 'Users can update their own staged jobs' ON public.job_staging FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY 'Users can delete their own staged jobs' ON public.job_staging FOR DELETE USING (auth.uid() = user_id);

-- Add index
CREATE INDEX idx_job_staging_user_id ON public.job_staging(user_id, created_at DESC);