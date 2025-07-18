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

export interface ResumeSection {
  title: string;
  content: string[];
  type: 'experience' | 'general';
}

export interface StructuredResumeData {
  personalInfo: PersonalInfo;
  experienceBullets: ExperienceBullet[];
  sections: ResumeSection[];
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
      sections: [],
      skills: [],
      keywordsFound: [],
      atsOptimizations: []
    };

    let currentSection = null;
    let currentSectionTitle = '';
    let currentSectionContent: string[] = [];
    let currentExperience: ExperienceBullet | null = null;

    const saveCurrentSection = () => {
      if (currentSectionTitle && currentSectionContent.length > 0) {
        structured.sections.push({
          title: currentSectionTitle,
          content: [...currentSectionContent],
          type: currentSectionTitle.toLowerCase().includes('experience') ? 'experience' : 'general'
        });
      }
    };

    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Skip empty lines
      if (!trimmed) return;
      
      // Section headers
      if (trimmed.startsWith('# ')) {
        saveCurrentSection();
        currentSection = 'header';
        currentSectionTitle = '';
        currentSectionContent = [];
        const name = trimmed.substring(2);
        structured.personalInfo.name = name;
        return;
      } 
      
      if (trimmed.startsWith('## ')) {
        saveCurrentSection();
        currentSection = 'section';
        currentSectionTitle = trimmed.substring(3);
        currentSectionContent = [];
        
        // Handle experience section differently for backward compatibility
        if (currentSectionTitle.toLowerCase().includes('experience')) {
          currentSection = 'experience';
        }
        return;
      }
      
      // Contact info handling (### in header section)
      if (currentSection === 'header' && trimmed.startsWith('### ')) {
        const content = trimmed.substring(4);
        if (content.toLowerCase().includes('mobile') || 
            content.toLowerCase().includes('phone') || 
            content.toLowerCase().includes('email') ||
            content.includes('@') || content.includes('(')) {
          // Handle as contact info
          if (content.includes('@') || content.toLowerCase().includes('email')) {
            structured.personalInfo.email = content.replace(/^email:\s*/i, '').trim();
          }
          if (content.includes('(') || content.toLowerCase().includes('mobile') || content.toLowerCase().includes('phone')) {
            structured.personalInfo.phone = content.replace(/^(mobile|phone):\s*/i, '').trim();
          }
          return;
        }
      }
      
      // Contact info (direct email/phone/linkedin in header)
      if (currentSection === 'header' && (trimmed.includes('@') || trimmed.includes('(') || trimmed.includes('linkedin'))) {
        if (trimmed.includes('@')) structured.personalInfo.email = trimmed;
        if (trimmed.includes('(')) structured.personalInfo.phone = trimmed;
        if (trimmed.includes('linkedin')) structured.personalInfo.linkedin = trimmed;
        return;
      }
      
      // Experience section handling
      if (currentSection === 'experience') {
        if (trimmed.startsWith('### ')) {
          // New experience entry
          if (currentExperience) {
            structured.experienceBullets.push(currentExperience);
          }
          currentExperience = {
            position: trimmed.substring(4),
            company: '',
            bullets: [],
            keywordsUsed: []
          };
          return;
        }
        
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && currentExperience) {
          currentExperience.company = trimmed.slice(2, -2);
          return;
        }
        
        if (trimmed.startsWith('- ') && currentExperience) {
          const bullet = trimmed.substring(2);
          currentExperience.bullets.push(bullet);
          
          // Extract keywords from bullets
          const keywords = extractKeywords(bullet);
          currentExperience.keywordsUsed.push(...keywords);
          return;
        }
      }
      
      // General section handling
      if (currentSection === 'section') {
        // Add ALL content to the section, preserving original formatting
        currentSectionContent.push(trimmed);
        return;
      }
    });

    // Save final section and experience
    saveCurrentSection();
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