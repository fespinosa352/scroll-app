import { useState, useCallback } from 'react';

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
}

export interface ExperienceBullet {
  position: string;
  company: string;
  bullets: string[];
  keywordsUsed: string[];
}

export interface StructuredResumeData {
  personalInfo: PersonalInfo;
  experienceBullets: ExperienceBullet[];
  skills: string[];
  keywordsFound: string[];
  atsOptimizations: string[];
}

export const useMarkupConverter = () => {
  const [structuredData, setStructuredData] = useState<StructuredResumeData | null>(null);

  const extractKeywords = useCallback((text: string): string[] => {
    const commonKeywords = [
      'leadership', 'management', 'strategy', 'analysis', 'development',
      'project', 'team', 'collaboration', 'optimization', 'innovation',
      'data', 'analytics', 'sql', 'python', 'javascript', 'react',
      'agile', 'scrum', 'stakeholder', 'revenue', 'growth', 'customer',
      'product', 'marketing', 'sales', 'design', 'engineering'
    ];
    
    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
  }, []);

  const convertMarkupToStructured = useCallback((markupText: string): StructuredResumeData => {
    const lines = markupText.split('\n').filter(line => line.trim());
    const structured: StructuredResumeData = {
      personalInfo: {},
      experienceBullets: [],
      skills: [],
      keywordsFound: [],
      atsOptimizations: []
    };

    let currentSection = null;
    let currentExperience: ExperienceBullet | null = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Section headers
      if (trimmed.startsWith('# ')) {
        currentSection = 'header';
        const name = trimmed.substring(2);
        structured.personalInfo.name = name;
      } else if (trimmed.startsWith('## ')) {
        currentSection = trimmed.substring(3).toLowerCase();
        if (currentSection.includes('experience')) currentSection = 'experience';
      }
      
      // Experience entries
      else if (trimmed.startsWith('### ')) {
        if (currentExperience) {
          structured.experienceBullets.push(currentExperience);
        }
        currentExperience = {
          position: trimmed.substring(4),
          company: '',
          bullets: [],
          keywordsUsed: []
        };
      }
      
      // Company info
      else if (trimmed.startsWith('**') && trimmed.endsWith('**') && currentExperience) {
        currentExperience.company = trimmed.slice(2, -2);
      }
      
      // Bullet points
      else if (trimmed.startsWith('- ') && currentExperience) {
        const bullet = trimmed.substring(2);
        currentExperience.bullets.push(bullet);
        
        // Extract keywords from bullets
        const keywords = extractKeywords(bullet);
        currentExperience.keywordsUsed.push(...keywords);
      }
      
      // Contact info
      else if (currentSection === 'header' && (trimmed.includes('@') || trimmed.includes('(') || trimmed.includes('linkedin'))) {
        if (trimmed.includes('@')) structured.personalInfo.email = trimmed;
        if (trimmed.includes('(')) structured.personalInfo.phone = trimmed;
        if (trimmed.includes('linkedin')) structured.personalInfo.linkedin = trimmed;
      }
    });

    // Add final experience
    if (currentExperience) {
      structured.experienceBullets.push(currentExperience);
    }

    // Extract all unique keywords
    structured.keywordsFound = [...new Set(
      structured.experienceBullets.flatMap(exp => exp.keywordsUsed)
    )];

    setStructuredData(structured);
    return structured;
  }, [extractKeywords]);

  const convertStructuredToMarkup = useCallback((structured: StructuredResumeData): string => {
    let markup = '';
    
    // Header
    if (structured.personalInfo?.name) {
      markup += `# ${structured.personalInfo.name}\n\n`;
      if (structured.personalInfo.email) markup += `${structured.personalInfo.email}\n`;
      if (structured.personalInfo.phone) markup += `${structured.personalInfo.phone}\n`;
      if (structured.personalInfo.linkedin) markup += `${structured.personalInfo.linkedin}\n`;
      markup += '\n';
    }

    // Experience section
    if (structured.experienceBullets?.length > 0) {
      markup += '## Professional Experience\n\n';
      
      structured.experienceBullets.forEach(exp => {
        markup += `### ${exp.position}\n`;
        if (exp.company) markup += `**${exp.company}**\n\n`;
        
        if (exp.bullets?.length > 0) {
          exp.bullets.forEach(bullet => {
            markup += `- ${bullet}\n`;
          });
        }
        markup += '\n';
      });
    }

    return markup;
  }, []);

  return {
    structuredData,
    convertMarkupToStructured,
    convertStructuredToMarkup
  };
};