-- Add company_name field to work_experiences table to store company name directly
ALTER TABLE public.work_experiences 
ADD COLUMN company_name TEXT;

-- Update existing records to extract company name from description
UPDATE public.work_experiences 
SET company_name = TRIM(SUBSTRING(description FROM 'Company: (.*)'))
WHERE description LIKE 'Company: %';

-- Clear the "Company: " prefix from descriptions now that we have the company_name field
UPDATE public.work_experiences 
SET description = ''
WHERE description LIKE 'Company: %';