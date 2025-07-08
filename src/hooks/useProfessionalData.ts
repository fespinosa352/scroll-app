import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Company = Database['public']['Tables']['companies']['Row'];
type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
type WorkExperience = Database['public']['Tables']['work_experiences']['Row'];
type WorkExperienceInsert = Database['public']['Tables']['work_experiences']['Insert'];
type Project = Database['public']['Tables']['projects']['Row'];
type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
type Education = Database['public']['Tables']['education']['Row'];
type EducationInsert = Database['public']['Tables']['education']['Insert'];
type Certification = Database['public']['Tables']['certifications']['Row'];
type CertificationInsert = Database['public']['Tables']['certifications']['Insert'];
type SkillsExperience = Database['public']['Tables']['skills_experience']['Row'];
type SkillsExperienceInsert = Database['public']['Tables']['skills_experience']['Insert'];
type SourceResume = Database['public']['Tables']['source_resumes']['Row'];
type SourceResumeInsert = Database['public']['Tables']['source_resumes']['Insert'];

export interface ParsedResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
}

export const useProfessionalData = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  // Get or create company
  const getOrCreateCompany = async (companyName: string): Promise<string | null> => {
    try {
      // First try to find existing company
      const { data: existingCompany } = await supabase
        .from('companies')
        .select('id')
        .eq('name', companyName.trim())
        .single();

      if (existingCompany) {
        return existingCompany.id;
      }

      // Create new company
      const { data: newCompany, error } = await supabase
        .from('companies')
        .insert({ name: companyName.trim() })
        .select('id')
        .single();

      if (error) throw error;
      return newCompany.id;
    } catch (error) {
      console.error('Error with company:', error);
      return null;
    }
  };

  // Save parsed resume data to normalized structure
  const saveParsedResumeData = async (
    resumeData: ParsedResumeData,
    file?: File,
    resumeName?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Please log in to save your resume data');
      return false;
    }

    setSaving(true);
    try {
      // 1. Save source resume record
      let file_url = null;
      if (file) {
        // Upload file to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from('resume-files')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
        file_url = data?.path || null;
      }

      const sourceResumeData: SourceResumeInsert = {
        user_id: user.id,
        name: resumeName || file?.name || 'Uploaded Resume',
        file_url,
        raw_content: resumeData as any
      };

      const { data: sourceResume, error: sourceError } = await supabase
        .from('source_resumes')
        .insert(sourceResumeData)
        .select()
        .single();

      if (sourceError) throw sourceError;

      // 2. Process work experiences and projects
      for (const exp of resumeData.experience) {
        // Get or create company
        const companyId = await getOrCreateCompany(exp.company);
        if (!companyId) continue;

        // Parse dates
        const dates = exp.duration.split(' - ');
        const startDate = parseDateString(dates[0]);
        const endDate = dates[1] && dates[1] !== 'Present' ? parseDateString(dates[1]) : null;
        const isCurrent = dates[1] === 'Present' || !endDate;

        // Create work experience
        const workExpData: WorkExperienceInsert = {
          user_id: user.id,
          company_id: companyId,
          title: exp.title,
          start_date: startDate,
          end_date: endDate,
          is_current: isCurrent,
          description: exp.achievements.join('. ')
        };

        const { data: workExp, error: workExpError } = await supabase
          .from('work_experiences')
          .insert(workExpData)
          .select()
          .single();

        if (workExpError) {
          console.error('Error saving work experience:', workExpError);
          continue;
        }

        // Create projects for each achievement
        for (let i = 0; i < exp.achievements.length; i++) {
          const achievement = exp.achievements[i];
          if (achievement.trim().length === 0) continue;

          const projectData: ProjectInsert = {
            user_id: user.id,
            work_experience_id: workExp.id,
            title: `Achievement ${i + 1}`,
            description: achievement.trim()
          };

          await supabase.from('projects').insert(projectData);
        }
      }

      // 3. Process education
      for (const edu of resumeData.education) {
        const eduData: EducationInsert = {
          user_id: user.id,
          institution: edu.institution,
          degree: edu.degree,
          end_date: parseDateString(edu.year)
        };

        await supabase.from('education').insert(eduData);
      }

      // 4. Process skills
      for (const skill of resumeData.skills) {
        const skillData: SkillsExperienceInsert = {
          user_id: user.id,
          skill_name: skill.trim(),
          work_experience_id: null,
          project_id: null,
          proficiency_level: 'Intermediate'
        };

        await supabase.from('skills_experience').insert(skillData);
      }

      toast.success('Professional data imported successfully!');
      return true;
    } catch (error: any) {
      console.error('Error saving professional data:', error);
      toast.error(error.message || 'Failed to save professional data');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Helper function to parse date strings
  const parseDateString = (dateStr: string): string | null => {
    if (!dateStr || dateStr === 'Present') return null;
    
    // Try to parse common date formats
    const year = dateStr.match(/\d{4}/)?.[0];
    if (year) {
      return `${year}-01-01`; // Default to January 1st for year-only dates
    }
    
    // Try to parse month/year format
    const monthYear = dateStr.match(/(\w+)\s+(\d{4})/);
    if (monthYear) {
      const month = monthYear[1];
      const year = monthYear[2];
      const monthNum = getMonthNumber(month);
      return `${year}-${monthNum.toString().padStart(2, '0')}-01`;
    }
    
    return null;
  };

  // Helper to convert month names to numbers
  const getMonthNumber = (monthName: string): number => {
    const months = {
      'jan': 1, 'january': 1,
      'feb': 2, 'february': 2,
      'mar': 3, 'march': 3,
      'apr': 4, 'april': 4,
      'may': 5,
      'jun': 6, 'june': 6,
      'jul': 7, 'july': 7,
      'aug': 8, 'august': 8,
      'sep': 9, 'september': 9,
      'oct': 10, 'october': 10,
      'nov': 11, 'november': 11,
      'dec': 12, 'december': 12
    };
    
    return months[monthName.toLowerCase()] || 1;
  };

  return {
    loading,
    saving,
    saveParsedResumeData
  };
};