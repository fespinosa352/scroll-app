import type { 
  OptimizedResumeContent, 
  JobAnalysisData, 
  OptimizedWorkExperience,
  OptimizedSkill,
  OptimizedEducation,
  OptimizedCertification
} from '@/types/resumeOptimization';
import { 
  scoreWorkExperience, 
  scoreSkill, 
  scoreEducation, 
  scoreCertification 
} from '@/utils/relevanceScoring';

export class ResumeOptimizer {
  /**
   * Generate optimized resume content based on job analysis and user data
   */
  static optimizeResumeForJob(
    jobAnalysis: JobAnalysisData,
    userData: {
      personalInfo?: any;
      workExperience?: any[];
      education?: any[];
      certifications?: any[];
      skills?: string[];
    }
  ): OptimizedResumeContent {
    
    // Optimize work experiences
    const optimizedWorkExperiences = this.optimizeWorkExperiences(
      userData.workExperience || [], 
      jobAnalysis
    );
    
    // Optimize skills
    const optimizedSkills = this.optimizeSkills(
      userData.skills || [], 
      jobAnalysis
    );
    
    // Optimize education
    const optimizedEducation = this.optimizeEducation(
      userData.education || [], 
      jobAnalysis
    );
    
    // Optimize certifications
    const optimizedCertifications = this.optimizeCertifications(
      userData.certifications || [], 
      jobAnalysis
    );
    
    return {
      personalInfo: userData.personalInfo,
      workExperiences: optimizedWorkExperiences,
      skills: optimizedSkills,
      education: optimizedEducation,
      certifications: optimizedCertifications,
      summary: this.generateOptimizedSummary(userData.personalInfo, jobAnalysis)
    };
  }
  
  /**
   * Filter and rank work experiences by job relevance
   */
  private static optimizeWorkExperiences(
    experiences: any[], 
    jobAnalysis: JobAnalysisData
  ): OptimizedWorkExperience[] {
    
    return experiences
      .map(exp => ({
        experience: exp,
        relevanceScore: scoreWorkExperience(exp, jobAnalysis)
      }))
      .filter(item => item.relevanceScore.score >= 30) // Only include relevant experiences
      .sort((a, b) => b.relevanceScore.score - a.relevanceScore.score) // Sort by relevance
      .slice(0, 5); // Limit to top 5 most relevant experiences
  }
  
  /**
   * Prioritize and filter skills based on job requirements
   */
  private static optimizeSkills(
    skills: string[], 
    jobAnalysis: JobAnalysisData
  ): OptimizedSkill[] {
    
    return skills
      .map(skill => {
        const scoring = scoreSkill(skill, jobAnalysis);
        return {
          skill,
          isMatched: scoring.isMatched,
          isHighPriority: scoring.isHighPriority,
          relevanceScore: scoring.score
        };
      })
      .filter(item => item.relevanceScore >= 60) // Only include relevant skills
      .sort((a, b) => {
        // Priority order: matched skills, high priority, then by score
        if (a.isMatched && !b.isMatched) return -1;
        if (!a.isMatched && b.isMatched) return 1;
        if (a.isHighPriority && !b.isHighPriority) return -1;
        if (!a.isHighPriority && b.isHighPriority) return 1;
        return b.relevanceScore - a.relevanceScore;
      })
      .slice(0, 15); // Limit to top 15 skills
  }
  
  /**
   * Filter and rank education by job relevance
   */
  private static optimizeEducation(
    education: any[], 
    jobAnalysis: JobAnalysisData
  ): OptimizedEducation[] {
    
    return education
      .map(edu => ({
        education: edu,
        relevanceScore: scoreEducation(edu, jobAnalysis)
      }))
      .filter(item => item.relevanceScore.score >= 40) // Include relevant education
      .sort((a, b) => b.relevanceScore.score - a.relevanceScore.score);
  }
  
  /**
   * Filter and rank certifications by job relevance
   */
  private static optimizeCertifications(
    certifications: any[], 
    jobAnalysis: JobAnalysisData
  ): OptimizedCertification[] {
    
    return certifications
      .map(cert => ({
        certification: cert,
        relevanceScore: scoreCertification(cert, jobAnalysis)
      }))
      .filter(item => item.relevanceScore.score >= 50) // Only include relevant certifications
      .sort((a, b) => b.relevanceScore.score - a.relevanceScore.score)
      .slice(0, 8); // Limit to top 8 certifications
  }
  
  /**
   * Generate optimized professional summary
   */
  private static generateOptimizedSummary(
    personalInfo: any, 
    jobAnalysis: JobAnalysisData
  ): string {
    if (!personalInfo?.professionalSummary) return '';
    
    // For now, return the existing summary
    // This could be enhanced with AI-powered optimization later
    return personalInfo.professionalSummary;
  }
  
  /**
   * Generate resume content string from optimized data
   */
  static generateResumeContent(optimizedContent: OptimizedResumeContent): string {
    let content = '';
    
    // Personal Info
    if (optimizedContent.personalInfo?.name) {
      content += `# ${optimizedContent.personalInfo.name}\n\n`;
      if (optimizedContent.personalInfo.email) content += `${optimizedContent.personalInfo.email}\n`;
      if (optimizedContent.personalInfo.phone) content += `${optimizedContent.personalInfo.phone}\n`;
      if (optimizedContent.personalInfo.location) content += `${optimizedContent.personalInfo.location}\n`;
      content += '\n';
    }
    
    // Professional Summary (if optimized)
    if (optimizedContent.summary) {
      content += '## Professional Summary\n\n';
      content += `${optimizedContent.summary}\n\n`;
    }
    
    // Work Experience (only relevant experiences)
    if (optimizedContent.workExperiences.length > 0) {
      content += '## Professional Experience\n\n';
      optimizedContent.workExperiences.forEach(({ experience }) => {
        content += `### ${experience.position}\n`;
        content += `**${experience.company}**\n`;
        if (experience.startDate || experience.endDate) {
          const start = experience.startDate ? new Date(experience.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          const end = experience.isCurrentRole ? 'Present' : (experience.endDate ? new Date(experience.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
          content += `${start} - ${end}\n\n`;
        }
        if (experience.description) {
          const bullets = experience.description.split('\n').filter((line: string) => line.trim());
          bullets.forEach((bullet: string) => {
            const cleanBullet = bullet.replace(/^[•\-*]\s*/, '');
            content += `- ${cleanBullet}\n`;
          });
        }
        content += '\n';
      });
    }
    
    // Skills (prioritized and filtered)
    if (optimizedContent.skills.length > 0) {
      content += '## Skills\n\n';
      
      // Group by priority
      const matchedSkills = optimizedContent.skills.filter(s => s.isMatched);
      const highPrioritySkills = optimizedContent.skills.filter(s => s.isHighPriority && !s.isMatched);
      const otherSkills = optimizedContent.skills.filter(s => !s.isHighPriority && !s.isMatched);
      
      [...matchedSkills, ...highPrioritySkills, ...otherSkills].forEach(({ skill }) => {
        content += `- ${skill}\n`;
      });
      content += '\n';
    }
    
    // Education (filtered by relevance)
    if (optimizedContent.education.length > 0) {
      content += '## Education\n\n';
      optimizedContent.education.forEach(({ education }) => {
        content += `### ${education.degree}\n`;
        content += `**${education.institution}**\n`;
        if (education.fieldOfStudy) content += `${education.fieldOfStudy}\n`;
        if (education.startDate) {
          const year = new Date(education.startDate).getFullYear();
          content += `${year}\n`;
        }
        if (education.gpa) content += `GPA: ${education.gpa}\n`;
        content += '\n';
      });
    }
    
    // Certifications (filtered by relevance)
    if (optimizedContent.certifications.length > 0) {
      content += '## Certifications\n\n';
      optimizedContent.certifications.forEach(({ certification }) => {
        content += `### ${certification.name}\n`;
        content += `**${certification.issuer}\n`;
        if (certification.issueDate) {
          const year = new Date(certification.issueDate).getFullYear();
          content += `${year}\n`;
        }
        content += '\n';
      });
    }
    
    return content;
  }
}