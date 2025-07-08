-- Create companies table for consistency across work experiences
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  industry TEXT,
  size_category TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create work experiences table
CREATE TABLE public.work_experiences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_id UUID REFERENCES public.companies(id),
  title TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  description TEXT,
  location TEXT,
  employment_type TEXT DEFAULT 'Full-time',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects/achievements table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  work_experience_id UUID REFERENCES public.work_experiences(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact_metrics TEXT,
  technologies_used TEXT[],
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create education table
CREATE TABLE public.education (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  institution TEXT NOT NULL,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  start_date DATE,
  end_date DATE,
  gpa DECIMAL(3,2),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certifications table
CREATE TABLE public.certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  issuing_organization TEXT NOT NULL,
  issue_date DATE,
  expiration_date DATE,
  credential_id TEXT,
  credential_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create skills_experience linking table
CREATE TABLE public.skills_experience (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skill_name TEXT NOT NULL,
  work_experience_id UUID REFERENCES public.work_experiences(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  proficiency_level TEXT,
  years_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT skill_context_check CHECK (
    (work_experience_id IS NOT NULL AND project_id IS NULL) OR
    (work_experience_id IS NULL AND project_id IS NOT NULL)
  )
);

-- Create source_resumes table for original uploaded files
CREATE TABLE public.source_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  file_url TEXT,
  raw_content JSONB,
  parsed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create generated_resumes table for AI-created resumes
CREATE TABLE public.generated_resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  job_title TEXT,
  company_target TEXT,
  job_description TEXT,
  content JSONB NOT NULL,
  ats_score INTEGER,
  ats_optimization_notes TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills_experience ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_resumes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for companies (publicly readable, admin-only write)
CREATE POLICY "Companies are viewable by everyone" 
ON public.companies 
FOR SELECT 
USING (true);

-- Create RLS policies for work_experiences
CREATE POLICY "Users can view their own work experiences" 
ON public.work_experiences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own work experiences" 
ON public.work_experiences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own work experiences" 
ON public.work_experiences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own work experiences" 
ON public.work_experiences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for projects
CREATE POLICY "Users can view their own projects" 
ON public.projects 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
ON public.projects 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for education
CREATE POLICY "Users can view their own education" 
ON public.education 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own education" 
ON public.education 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education" 
ON public.education 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education" 
ON public.education 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for certifications
CREATE POLICY "Users can view their own certifications" 
ON public.certifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own certifications" 
ON public.certifications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certifications" 
ON public.certifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certifications" 
ON public.certifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for skills_experience
CREATE POLICY "Users can view their own skills experience" 
ON public.skills_experience 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own skills experience" 
ON public.skills_experience 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills experience" 
ON public.skills_experience 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills experience" 
ON public.skills_experience 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for source_resumes
CREATE POLICY "Users can view their own source resumes" 
ON public.source_resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own source resumes" 
ON public.source_resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own source resumes" 
ON public.source_resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own source resumes" 
ON public.source_resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for generated_resumes
CREATE POLICY "Users can view their own generated resumes" 
ON public.generated_resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own generated resumes" 
ON public.generated_resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generated resumes" 
ON public.generated_resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generated resumes" 
ON public.generated_resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_work_experiences_updated_at
BEFORE UPDATE ON public.work_experiences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_education_updated_at
BEFORE UPDATE ON public.education
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certifications_updated_at
BEFORE UPDATE ON public.certifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_skills_experience_updated_at
BEFORE UPDATE ON public.skills_experience
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_generated_resumes_updated_at
BEFORE UPDATE ON public.generated_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_work_experiences_user_id ON public.work_experiences(user_id);
CREATE INDEX idx_work_experiences_company_id ON public.work_experiences(company_id);
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_projects_work_experience_id ON public.projects(work_experience_id);
CREATE INDEX idx_education_user_id ON public.education(user_id);
CREATE INDEX idx_certifications_user_id ON public.certifications(user_id);
CREATE INDEX idx_skills_experience_user_id ON public.skills_experience(user_id);
CREATE INDEX idx_skills_experience_skill_name ON public.skills_experience(skill_name);
CREATE INDEX idx_source_resumes_user_id ON public.source_resumes(user_id);
CREATE INDEX idx_generated_resumes_user_id ON public.generated_resumes(user_id);