-- Migration: Restrict Public Access
-- Date: 2025-11-19
-- Description: Update RLS policies to restrict access to authenticated users only, replacing previous public access policies.

-- 1. Update Profiles Policy
-- Drop the old "viewable by everyone" policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create new policy restricting access to authenticated users
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- 2. Update Companies Policy
-- Drop the old "viewable by everyone" policy
DROP POLICY IF EXISTS "Companies are viewable by everyone" ON public.companies;

-- Create new policy restricting access to authenticated users
CREATE POLICY "Companies are viewable by authenticated users"
ON public.companies
FOR SELECT
USING (auth.role() = 'authenticated');
