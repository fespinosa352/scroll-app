import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useResumes } from './useResumes';
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

  return {
    resumes,
    generateResumeFromAnalysis,
    generateResumeFromJobData,
    duplicateResume,
    deleteResume,
    updateResumeStatus
  };
};