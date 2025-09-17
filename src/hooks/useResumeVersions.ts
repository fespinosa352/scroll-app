import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useResumes } from './useResumes';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { JobAnalysis } from './useJobAnalysis';
import type { Database } from '@/integrations/supabase/types';
import { ResumeOptimizer } from '@/services/resumeOptimizer';

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
        .from('work_experiences')
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

      // Generate updated resume content with fresh data using optimizer if analysis exists
      let updatedResumeContent = '';
      
      if (content?.analysis) {
        // Use the optimizer for job-targeted content
        try {
          
          // Convert database format to optimizer format
          const userData = {
            workExperience: freshWorkExperience?.map(exp => ({
              position: exp.title,
              company: exp.company_name,
              startDate: exp.start_date,
              endDate: exp.end_date,
              isCurrentRole: exp.is_current,
              description: exp.description
            })),
            education: freshEducation?.map(edu => ({
              degree: edu.degree,
              institution: edu.institution,
              fieldOfStudy: edu.field_of_study,
              startDate: edu.start_date,
              gpa: edu.gpa
            })),
            skills: freshSkills?.map(skill => skill.skill_name),
            certifications: freshCertifications?.map(cert => ({
              name: cert.name,
              issuer: cert.issuing_organization,
              issueDate: cert.issue_date
            }))
          };
          
          const optimizedContent = ResumeOptimizer.optimizeResumeForJob(content.analysis, userData);
          updatedResumeContent = ResumeOptimizer.generateResumeContent(optimizedContent);
          
        } catch (error) {
          console.error('Error using optimizer, falling back to standard generation:', error);
          // Fall back to standard generation if optimizer fails
          updatedResumeContent = generateStandardResumeContent(
            freshWorkExperience || [], 
            freshEducation || [], 
            freshSkills || [], 
            freshCertifications || []
          );
        }
      } else {
        // Standard generation for resumes without analysis
        updatedResumeContent = generateStandardResumeContent(
          freshWorkExperience || [], 
          freshEducation || [], 
          freshSkills || [], 
          freshCertifications || []
        );
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

  // Helper method for standard resume generation (fallback)
  const generateStandardResumeContent = (
    freshWorkExperience: any[], 
    freshEducation: any[], 
    freshSkills: any[], 
    freshCertifications: any[]
  ): string => {
    let content = '';
    
    // Add work experience
    if (freshWorkExperience && freshWorkExperience.length > 0) {
      content += '## Professional Experience\n\n';
      freshWorkExperience.forEach(exp => {
        content += `### ${exp.title}\n`;
        content += `**${exp.company_name || 'Unknown Company'}**\n`;
        if (exp.start_date || exp.end_date) {
          const start = exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          const end = exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
          content += `${start} - ${end}\n\n`;
        }
        if (exp.description) {
          const bullets = exp.description.split('\n').filter((line: string) => line.trim());
          bullets.forEach((bullet: string) => {
            const cleanBullet = bullet.replace(/^[•\-*]\s*/, '');
            content += `- ${cleanBullet}\n`;
          });
        }
        content += '\n';
      });
    }

    // Add education
    if (freshEducation && freshEducation.length > 0) {
      content += '## Education\n\n';
      freshEducation.forEach(edu => {
        content += `### ${edu.degree}\n`;
        content += `**${edu.institution}**\n`;
        if (edu.field_of_study) content += `${edu.field_of_study}\n`;
        if (edu.start_date) {
          const year = new Date(edu.start_date).getFullYear();
          content += `${year}\n`;
        }
        if (edu.gpa) content += `GPA: ${edu.gpa}\n`;
        content += '\n';
      });
    }

    // Add skills
    if (freshSkills && freshSkills.length > 0) {
      content += '## Skills\n\n';
      freshSkills.forEach(skill => {
        content += `- ${skill.skill_name}\n`;
      });
      content += '\n';
    }

    // Add certifications
    if (freshCertifications && freshCertifications.length > 0) {
      content += '## Certifications\n\n';
      freshCertifications.forEach(cert => {
        content += `### ${cert.name}\n`;
        content += `**${cert.issuing_organization}**\n`;
        if (cert.issue_date) {
          const year = new Date(cert.issue_date).getFullYear();
          content += `${year}\n`;
        }
        content += '\n';
      });
    }

    return content;
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