-- Create resumes table for storing user resume data
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content JSONB,
  file_url TEXT,
  version TEXT DEFAULT 'v1.0',
  is_active BOOLEAN DEFAULT false,
  ats_score INTEGER,
  ats_issues TEXT[],
  ats_suggestions TEXT[],
  source_file TEXT,
  imported_from TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable Row Level Security
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
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

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for resume files
INSERT INTO storage.buckets (id, name, public) VALUES ('resume-files', 'resume-files', false);

-- Storage policies for authenticated users
CREATE POLICY "Users can upload their own resume files" 
ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own resume files" 
ON storage.objects
FOR SELECT 
USING (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own resume files" 
ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own resume files" 
ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'resume-files' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);