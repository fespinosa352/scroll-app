-- Performance Optimization: Safe Company Creation Function
-- This function provides thread-safe company creation with UPSERT pattern

CREATE OR REPLACE FUNCTION get_or_create_company(company_name TEXT)
RETURNS UUID AS $$
DECLARE
  company_id UUID;
  clean_name TEXT;
BEGIN
  -- Clean and normalize the company name
  clean_name := TRIM(COALESCE(company_name, ''));
  
  -- Return null for empty names
  IF clean_name = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use UPSERT pattern to safely get or create company
  INSERT INTO companies (name) 
  VALUES (clean_name)
  ON CONFLICT (LOWER(TRIM(name))) 
  DO UPDATE SET 
    name = EXCLUDED.name,
    updated_at = NOW()
  RETURNING id INTO company_id;
  
  RETURN company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a batch function for saving parsed resume data
CREATE OR REPLACE FUNCTION save_parsed_resume_batch(
  p_user_id UUID,
  p_resume_data JSONB
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
  exp_record JSONB;
  edu_record JSONB;
  cert_record JSONB;
  company_id UUID;
  work_exp_id UUID;
  project_id UUID;
BEGIN
  result := jsonb_build_object('success', true, 'message', 'Resume data saved successfully');
  
  BEGIN
    -- Process work experiences
    IF p_resume_data ? 'experience' THEN
      FOR exp_record IN SELECT * FROM jsonb_array_elements(p_resume_data->'experience')
      LOOP
        -- Get or create company
        company_id := get_or_create_company(exp_record->>'company');
        
        -- Insert work experience
        INSERT INTO work_experiences (
          user_id, title, company_id, company_name, start_date, end_date, 
          is_current, location, description
        ) VALUES (
          p_user_id,
          exp_record->>'title',
          company_id,
          exp_record->>'company',
          NULLIF(exp_record->>'startDate', '')::DATE,
          NULLIF(exp_record->>'endDate', '')::DATE,
          COALESCE((exp_record->>'isCurrentRole')::BOOLEAN, false),
          exp_record->>'location',
          array_to_string(
            ARRAY(SELECT jsonb_array_elements_text(exp_record->'achievements')), 
            E'\n• '
          )
        ) RETURNING id INTO work_exp_id;
        
        -- Insert achievements as projects
        IF exp_record ? 'achievements' THEN
          INSERT INTO projects (work_experience_id, title, description)
          SELECT 
            work_exp_id,
            'Achievement ' || (ROW_NUMBER() OVER ()),
            achievement_text
          FROM jsonb_array_elements_text(exp_record->'achievements') AS achievement_text
          WHERE LENGTH(TRIM(achievement_text)) > 0;
        END IF;
      END LOOP;
    END IF;
    
    -- Process education
    IF p_resume_data ? 'education' THEN
      INSERT INTO education (
        user_id, institution, degree, field_of_study, start_date, end_date, gpa
      )
      SELECT 
        p_user_id,
        edu_record->>'institution',
        edu_record->>'degree',
        edu_record->>'fieldOfStudy',
        NULLIF(edu_record->>'startDate', '')::DATE,
        NULLIF(edu_record->>'endDate', '')::DATE,
        NULLIF(edu_record->>'gpa', '')::DECIMAL
      FROM jsonb_array_elements(p_resume_data->'education') AS edu_record;
    END IF;
    
    -- Process certifications
    IF p_resume_data ? 'certifications' THEN
      INSERT INTO certifications (
        user_id, name, issuing_organization, issue_date, expiration_date, 
        credential_id, credential_url
      )
      SELECT 
        p_user_id,
        cert_record->>'name',
        cert_record->>'issuer',
        NULLIF(cert_record->>'issueDate', '')::DATE,
        NULLIF(cert_record->>'expiryDate', '')::DATE,
        cert_record->>'credentialId',
        cert_record->>'credentialUrl'
      FROM jsonb_array_elements(p_resume_data->'certifications') AS cert_record;
    END IF;
    
    -- Process skills as user_skills
    IF p_resume_data ? 'skills' THEN
      INSERT INTO user_skills (user_id, skill_name, proficiency_level)
      SELECT 
        p_user_id,
        skill_name,
        'intermediate' -- Default proficiency level
      FROM jsonb_array_elements_text(p_resume_data->'skills') AS skill_name
      ON CONFLICT (user_id, skill_name) DO NOTHING;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      result := jsonb_build_object(
        'success', false, 
        'error', SQLERRM,
        'detail', SQLSTATE
      );
  END;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_company(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION save_parsed_resume_batch(UUID, JSONB) TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_or_create_company(TEXT) IS 'Thread-safe function to get existing company or create new one';
COMMENT ON FUNCTION save_parsed_resume_batch(UUID, JSONB) IS 'Batch function to save all parsed resume data in a single transaction';