import type { RelevanceScore, JobAnalysisData } from '@/types/resumeOptimization';

/**
 * Calculate relevance score for work experience based on job requirements
 */
export const scoreWorkExperience = (
  experience: any,
  jobAnalysis: JobAnalysisData
): RelevanceScore => {
  let score = 0;
  const reasons: string[] = [];
  
  const jobTitle = jobAnalysis.job_title.toLowerCase();
  const jobDescription = jobAnalysis.job_description.toLowerCase();
  const matchedSkills = jobAnalysis.matched_skills.map(s => s.toLowerCase());
  const keyRequirements = jobAnalysis.key_requirements.map(r => r.toLowerCase());
  
  const expTitle = experience.position?.toLowerCase() || '';
  const expCompany = experience.company?.toLowerCase() || '';
  const expDescription = experience.description?.toLowerCase() || '';
  
  // Title relevance (30 points max)
  if (expTitle.includes(jobTitle) || jobTitle.includes(expTitle)) {
    score += 30;
    reasons.push('Job title matches closely');
  } else if (hasJobTitleSynonyms(expTitle, jobTitle)) {
    score += 20;
    reasons.push('Job title has similar responsibilities');
  } else if (hasIndustryRelevance(expTitle, jobTitle)) {
    score += 10;
    reasons.push('Job title in related field');
  }
  
  // Skills mentioned in experience (40 points max)
  let skillMatches = 0;
  matchedSkills.forEach(skill => {
    if (expDescription.includes(skill) || expTitle.includes(skill)) {
      skillMatches++;
    }
  });
  
  if (skillMatches > 0) {
    const skillScore = Math.min(40, skillMatches * 8);
    score += skillScore;
    reasons.push(`Mentions ${skillMatches} relevant skills`);
  }
  
  // Key requirements alignment (20 points max)
  let reqMatches = 0;
  keyRequirements.forEach(req => {
    if (expDescription.includes(req) || expTitle.includes(req)) {
      reqMatches++;
    }
  });
  
  if (reqMatches > 0) {
    const reqScore = Math.min(20, reqMatches * 5);
    score += reqScore;
    reasons.push(`Aligns with ${reqMatches} key requirements`);
  }
  
  // Industry/company relevance (10 points max)
  if (isRelevantIndustry(expCompany, jobAnalysis.company || '')) {
    score += 10;
    reasons.push('Relevant industry experience');
  }
  
  return {
    score: Math.min(100, score),
    reasons
  };
};

/**
 * Calculate relevance score for skills
 */
export const scoreSkill = (
  skill: string,
  jobAnalysis: JobAnalysisData
): { score: number; isMatched: boolean; isHighPriority: boolean } => {
  const skillLower = skill.toLowerCase();
  const matchedSkills = jobAnalysis.matched_skills.map(s => s.toLowerCase());
  const missingSkills = jobAnalysis.missing_skills.map(s => s.toLowerCase());
  const keyRequirements = jobAnalysis.key_requirements.join(' ').toLowerCase();
  
  const isMatched = matchedSkills.includes(skillLower);
  const isMissing = missingSkills.includes(skillLower);
  const isInRequirements = keyRequirements.includes(skillLower);
  
  let score = 50; // Base score
  let isHighPriority = false;
  
  if (isMatched) {
    score = 100;
    isHighPriority = true;
  } else if (isMissing) {
    score = 90; // User has a skill the job needs
    isHighPriority = true;
  } else if (isInRequirements) {
    score = 80;
    isHighPriority = true;
  } else if (isRelatedSkill(skillLower, matchedSkills)) {
    score = 70;
  }
  
  return { score, isMatched, isHighPriority };
};

/**
 * Calculate relevance score for education
 */
export const scoreEducation = (
  education: any,
  jobAnalysis: JobAnalysisData
): RelevanceScore => {
  let score = 40; // Base score for any education
  const reasons: string[] = [];
  
  const degree = education.degree?.toLowerCase() || '';
  const field = education.fieldOfStudy?.toLowerCase() || '';
  const institution = education.institution?.toLowerCase() || '';
  
  const jobDescription = jobAnalysis.job_description.toLowerCase();
  const keyRequirements = jobAnalysis.key_requirements.join(' ').toLowerCase();
  
  // Field of study relevance
  if (field && (jobDescription.includes(field) || keyRequirements.includes(field))) {
    score += 30;
    reasons.push('Field of study directly relevant');
  }
  
  // Degree level requirements
  if (jobDescription.includes('bachelor') && degree.includes('bachelor')) {
    score += 20;
    reasons.push('Meets degree requirements');
  } else if (jobDescription.includes('master') && degree.includes('master')) {
    score += 25;
    reasons.push('Exceeds degree requirements');
  } else if (jobDescription.includes('phd') && degree.includes('phd')) {
    score += 30;
    reasons.push('Advanced degree relevant');
  }
  
  // Prestigious institution bonus
  if (isPrestigiousInstitution(institution)) {
    score += 10;
    reasons.push('Recognized institution');
  }
  
  return {
    score: Math.min(100, score),
    reasons
  };
};

/**
 * Calculate relevance score for certifications
 */
export const scoreCertification = (
  certification: any,
  jobAnalysis: JobAnalysisData
): RelevanceScore => {
  let score = 30; // Base score
  const reasons: string[] = [];
  
  const certName = certification.name?.toLowerCase() || '';
  const issuer = certification.issuer?.toLowerCase() || '';
  
  const jobDescription = jobAnalysis.job_description.toLowerCase();
  const matchedSkills = jobAnalysis.matched_skills.join(' ').toLowerCase();
  const keyRequirements = jobAnalysis.key_requirements.join(' ').toLowerCase();
  
  // Direct certification mention
  if (jobDescription.includes(certName) || keyRequirements.includes(certName)) {
    score += 50;
    reasons.push('Certification specifically mentioned in job');
  }
  
  // Issuer recognition
  if (jobDescription.includes(issuer) || keyRequirements.includes(issuer)) {
    score += 30;
    reasons.push('Certification from recognized authority');
  }
  
  // Skills alignment
  if (matchedSkills.includes(certName) || hasRelatedKeywords(certName, matchedSkills)) {
    score += 20;
    reasons.push('Certification aligns with required skills');
  }
  
  return {
    score: Math.min(100, score),
    reasons
  };
};

// Helper functions
const hasJobTitleSynonyms = (title1: string, title2: string): boolean => {
  const synonyms: Record<string, string[]> = {
    'manager': ['supervisor', 'lead', 'director', 'coordinator'],
    'developer': ['engineer', 'programmer', 'analyst', 'architect'],
    'designer': ['artist', 'creative', 'visual'],
    'specialist': ['expert', 'consultant', 'advisor'],
    'assistant': ['associate', 'coordinator', 'support']
  };
  
  for (const [key, values] of Object.entries(synonyms)) {
    if (title1.includes(key) && values.some(v => title2.includes(v))) return true;
    if (title2.includes(key) && values.some(v => title1.includes(v))) return true;
  }
  
  return false;
};

const hasIndustryRelevance = (title1: string, title2: string): boolean => {
  const industries = ['tech', 'software', 'finance', 'healthcare', 'marketing', 'sales', 'education'];
  return industries.some(industry => 
    title1.includes(industry) && title2.includes(industry)
  );
};

const isRelevantIndustry = (company1: string, company2: string): boolean => {
  if (!company1 || !company2) return false;
  // This could be expanded with industry classification logic
  return company1.includes(company2) || company2.includes(company1);
};

const isRelatedSkill = (skill: string, matchedSkills: string[]): boolean => {
  const relatedGroups = [
    ['javascript', 'typescript', 'react', 'node.js', 'angular', 'vue'],
    ['python', 'django', 'flask', 'fastapi'],
    ['java', 'spring', 'hibernate'],
    ['project management', 'agile', 'scrum', 'kanban'],
    ['data analysis', 'sql', 'excel', 'tableau', 'power bi']
  ];
  
  return relatedGroups.some(group => 
    group.includes(skill) && group.some(s => matchedSkills.includes(s))
  );
};

const isPrestigiousInstitution = (institution: string): boolean => {
  const prestigious = [
    'harvard', 'mit', 'stanford', 'berkeley', 'yale', 'princeton',
    'oxford', 'cambridge', 'caltech', 'carnegie mellon'
  ];
  return prestigious.some(p => institution.includes(p));
};

const hasRelatedKeywords = (text: string, keywords: string): boolean => {
  const textWords = text.split(/\s+/);
  const keywordList = keywords.split(/\s+/);
  return textWords.some(word => keywordList.includes(word));
};