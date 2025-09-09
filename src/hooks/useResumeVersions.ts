import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useResumes } from './useResumes';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { JobAnalysis } from './useJobAnalysis';
import type { Database } from '@/integrations/supabase/types';

type Resume = Database['public']['Tables']['resumes']['Row'];

export interface ResumeVersion {
  id: string;
  name: string;
  targetRole: string;
  company: string;
  createdDate: string;
  atsScore: number;
  status: "draft" | "active" | "archived";
  matchedAchievements: number;
  jobAnalysisId?: string;
  analysis?: JobAnalysis;
}

// Convert database resume to ResumeVersion format
const convertToResumeVersion = (resume: Resume): ResumeVersion => {
  const content = resume.content as any; // Cast JSONB to any for flexibility
  
  return {
    id: resume.id,
    name: resume.name,
    targetRole: content?.targetRole || 'Unknown Role',
    company: content?.company || 'Unknown Company',
    createdDate: resume.created_at.split('T')[0],
    atsScore: resume.ats_score || 0,
    status: resume.is_active ? "active" : "draft",
    matchedAchievements: content?.matchedAchievements || 0,
    jobAnalysisId: content?.jobAnalysisId,
    analysis: content?.analysis
  };
};

export const useResumeVersions = () => {
  const { user } = useAuth();
  const { 
    resumes: dbResumes, 
    duplicateResume: dbDuplicateResume, 
    deleteResume: dbDeleteResume, 
    updateResume,
    saveResume,
    setActiveResume 
  } = useResumes();
  const [resumes, setResumes] = useState<ResumeVersion[]>([]);

  // Convert database resumes to ResumeVersion format
  useEffect(() => {
    console.log('useResumeVersions: dbResumes changed, converting...', dbResumes.length);
    const convertedResumes = dbResumes.map(convertToResumeVersion);
    setResumes(convertedResumes);
  }, [dbResumes]);

  const generateResumeFromAnalysis = async (analysis: JobAnalysis, resumeContent?: string) => {
    const resumeData = {
      name: `${analysis.job_title}${analysis.company ? ` - ${analysis.company}` : ''}`,
      content: {
        targetRole: analysis.job_title,
        company: analysis.company || 'Unknown Company',
        matchedAchievements: analysis.matched_skills.length,
        jobAnalysisId: analysis.id,
        analysis: analysis,
        resumeContent: resumeContent || '' // Include the actual resume content
      },
      ats_score: analysis.match_score,
      imported_from: 'Job Analysis'
    };

    // Use the saveResume function to create the resume in the database
    try {
      const newResume = await saveResume(resumeData);
      
      if (newResume) {
        toast.success(`Resume created and saved to vault!`, {
          description: `${resumeData.name} • ATS Score: ${resumeData.ats_score}% • ${resumeData.content.matchedAchievements} matched skills`
        });
        
        return newResume;
      } else {
        throw new Error('Failed to create resume');
      }
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Failed to create resume in vault');
      return null;
    }
  };

  const generateResumeFromJobData = async (jobData: any, jobMatch: any, resumeName: string) => {
    const resumeData = {
      name: resumeName,
      content: {
        targetRole: jobData.title,
        company: jobData.company_name,
        matchedAchievements: jobMatch.matched_skills.length,
        jobData: jobData,
        jobMatch: jobMatch
      },
      ats_score: jobMatch.match_score,
      imported_from: 'Job Search'
    };

    try {
      const newResume = await saveResume(resumeData);
      
      if (newResume) {
        toast.success(`Optimized resume created!`, {
          description: `${resumeData.name} • Match Score: ${resumeData.ats_score}% • ${resumeData.content.matchedAchievements} matched skills`
        });
        
        return newResume;
      } else {
        throw new Error('Failed to create resume');
      }
    } catch (error) {
      console.error('Error creating resume:', error);
      toast.error('Failed to create optimized resume');
      return null;
    }
  };

  const duplicateResume = async (resumeId: string) => {
    const success = await dbDuplicateResume(resumeId);
    return success;
  };

  const deleteResume = async (resumeId: string) => {
    const success = await dbDeleteResume(resumeId);
    return success;
  };

  const updateResumeStatus = async (resumeId: string, status: ResumeVersion['status']) => {
    if (status === "active") {
      await setActiveResume(resumeId);
    } else {
      await updateResume(resumeId, { 
        is_active: false 
      });
    }
  };

  const regenerateResumeWithLatestData = async (resumeId: string) => {
    console.log('regenerateResumeWithLatestData called for:', resumeId);
    try {
      // Find the resume to regenerate
      const resumeToRefresh = dbResumes.find(r => r.id === resumeId);
      if (!resumeToRefresh) {
        throw new Error('Resume not found');
      }

      const content = resumeToRefresh.content as any;
      
      // Check if the resume has the original analysis data
      if (!content?.analysis) {
        throw new Error('Resume missing original analysis data for regeneration');
      }

      // Get fresh user profile data from the database
      const { data: freshWorkExperience } = await supabase
        .from('work_experience')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: false });

      const { data: freshEducation } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', user?.id)
        .order('start_date', { ascending: false });

      const { data: freshSkills } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user?.id);

      const { data: freshCertifications } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('issue_date', { ascending: false });

      // Generate updated resume content with fresh data
      let updatedResumeContent = '';
      
      // Add work experience
      if (freshWorkExperience && freshWorkExperience.length > 0) {
        updatedResumeContent += '## Professional Experience\n\n';
        freshWorkExperience.forEach(exp => {
          updatedResumeContent += `### ${exp.position}\n`;
          updatedResumeContent += `**${exp.company}**\n`;
          if (exp.start_date || exp.end_date) {
            const start = exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
            const end = exp.is_current_role ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
            updatedResumeContent += `${start} - ${end}\n\n`;
          }
          if (exp.description) {
            const bullets = exp.description.split('\n').filter(line => line.trim());
            bullets.forEach(bullet => {
              const cleanBullet = bullet.replace(/^[•\-*]\s*/, '');
              updatedResumeContent += `- ${cleanBullet}\n`;
            });
          }
          updatedResumeContent += '\n';
        });
      }

      // Add education
      if (freshEducation && freshEducation.length > 0) {
        updatedResumeContent += '## Education\n\n';
        freshEducation.forEach(edu => {
          updatedResumeContent += `### ${edu.degree}\n`;
          updatedResumeContent += `**${edu.institution}**\n`;
          if (edu.field_of_study) updatedResumeContent += `${edu.field_of_study}\n`;
          if (edu.start_date) {
            const year = new Date(edu.start_date).getFullYear();
            updatedResumeContent += `${year}\n`;
          }
          if (edu.gpa) updatedResumeContent += `GPA: ${edu.gpa}\n`;
          updatedResumeContent += '\n';
        });
      }

      // Add skills
      if (freshSkills && freshSkills.length > 0) {
        updatedResumeContent += '## Skills\n\n';
        freshSkills.forEach(skill => {
          updatedResumeContent += `- ${skill.skill_name}\n`;
        });
        updatedResumeContent += '\n';
      }

      // Add certifications
      if (freshCertifications && freshCertifications.length > 0) {
        updatedResumeContent += '## Certifications\n\n';
        freshCertifications.forEach(cert => {
          updatedResumeContent += `### ${cert.name}\n`;
          updatedResumeContent += `**${cert.issuer}**\n`;
          if (cert.issue_date) {
            const year = new Date(cert.issue_date).getFullYear();
            updatedResumeContent += `${year}\n`;
          }
          updatedResumeContent += '\n';
        });
      }

      // Update the resume content with fresh data
      const updatedContent = {
        ...content,
        resumeContent: updatedResumeContent,
        lastRefreshed: new Date().toISOString(),
        refreshNote: 'Resume refreshed with latest profile data',
        workExperienceCount: freshWorkExperience?.length || 0,
        skillsCount: freshSkills?.length || 0
      };

      // Update the resume in the database
      await updateResume(resumeId, {
        content: updatedContent,
        updated_at: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error('Error regenerating resume:', error);
      throw error;
    }
  };

  return {
    resumes,
    generateResumeFromAnalysis,
    generateResumeFromJobData,
    duplicateResume,
    deleteResume,
    updateResumeStatus,
    regenerateResumeWithLatestData
  };
};