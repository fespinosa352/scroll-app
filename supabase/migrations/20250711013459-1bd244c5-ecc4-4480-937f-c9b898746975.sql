-- Clear all sample data from user tables
DELETE FROM public.skills_experience;
DELETE FROM public.projects;
DELETE FROM public.user_skills;
DELETE FROM public.work_experiences;
DELETE FROM public.education;
DELETE FROM public.certifications;
DELETE FROM public.achievements;
DELETE FROM public.job_analyses;
DELETE FROM public.generated_resumes;
DELETE FROM public.resumes;
DELETE FROM public.source_resumes;
-- Keep profiles table as it contains real user data from auth