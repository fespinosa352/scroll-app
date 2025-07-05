import { useState } from 'react';
import { toast } from 'sonner';
import type { JobAnalysis } from './useJobAnalysis';

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

export const useResumeVersions = () => {
  const [resumes, setResumes] = useState<ResumeVersion[]>([
    {
      id: "1",
      name: "Senior Product Manager - TechCorp",
      targetRole: "Senior Product Manager",
      company: "TechCorp",
      createdDate: "2024-12-20",
      atsScore: 92,
      status: "active",
      matchedAchievements: 12
    },
    {
      id: "2",
      name: "VP Product - StartupX",
      targetRole: "VP of Product",
      company: "StartupX",
      createdDate: "2024-12-18",
      atsScore: 87,
      status: "draft",
      matchedAchievements: 10
    },
    {
      id: "3",
      name: "Product Director - Enterprise Corp",
      targetRole: "Product Director",
      company: "Enterprise Corp",
      createdDate: "2024-12-15",
      atsScore: 89,
      status: "archived",
      matchedAchievements: 14
    }
  ]);

  const generateResumeFromAnalysis = (analysis: JobAnalysis) => {
    const newResume: ResumeVersion = {
      id: Date.now().toString(),
      name: `${analysis.job_title}${analysis.company ? ` - ${analysis.company}` : ''}`,
      targetRole: analysis.job_title,
      company: analysis.company || 'Unknown Company',
      createdDate: new Date().toISOString().split('T')[0],
      atsScore: analysis.match_score,
      status: "draft",
      matchedAchievements: analysis.matched_skills.length,
      jobAnalysisId: analysis.id,
      analysis: analysis
    };

    setResumes(prev => [newResume, ...prev]);
    toast.success(`Resume version created: ${newResume.name}`, {
      description: `ATS Score: ${newResume.atsScore}% • ${newResume.matchedAchievements} matched skills`
    });
    
    return newResume;
  };

  const duplicateResume = (resumeId: string) => {
    const original = resumes.find(r => r.id === resumeId);
    if (original) {
      const duplicate: ResumeVersion = {
        ...original,
        id: Date.now().toString(),
        name: `${original.name} (Copy)`,
        status: "draft",
        createdDate: new Date().toISOString().split('T')[0]
      };
      setResumes(prev => [duplicate, ...prev]);
      toast.success("Resume duplicated successfully!");
      return duplicate;
    }
    return null;
  };

  const deleteResume = (resumeId: string) => {
    setResumes(prev => prev.filter(r => r.id !== resumeId));
    toast.success("Resume deleted successfully!");
  };

  const updateResumeStatus = (resumeId: string, status: ResumeVersion['status']) => {
    setResumes(prev => prev.map(r => 
      r.id === resumeId ? { ...r, status } : r
    ));
  };

  return {
    resumes,
    generateResumeFromAnalysis,
    duplicateResume,
    deleteResume,
    updateResumeStatus
  };
};