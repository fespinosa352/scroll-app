export interface RelevanceScore {
  score: number; // 0-100
  reasons: string[];
}

export interface OptimizedWorkExperience {
  experience: any;
  relevanceScore: RelevanceScore;
  optimizedDescription?: string;
}

export interface OptimizedSkill {
  skill: string;
  isMatched: boolean;
  isHighPriority: boolean;
  relevanceScore: number;
}

export interface OptimizedEducation {
  education: any;
  relevanceScore: RelevanceScore;
}

export interface OptimizedCertification {
  certification: any;
  relevanceScore: RelevanceScore;
}

export interface OptimizedResumeContent {
  personalInfo: any;
  workExperiences: OptimizedWorkExperience[];
  skills: OptimizedSkill[];
  education: OptimizedEducation[];
  certifications: OptimizedCertification[];
  summary?: string;
}

export interface JobAnalysisData {
  job_title: string;
  company?: string;
  job_description: string;
  matched_skills: string[];
  missing_skills: string[];
  key_requirements: string[];
  recommendations: string[];
}