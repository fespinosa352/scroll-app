import { StructuredResumeData } from '@/hooks/useMarkupConverter';
import { formatDateToMMDDYYYY } from '@/lib/dateUtils';

export interface ExportableResume {
  name: string;
  content: any; // Resume content from database
  ats_score?: number;
  created_at: string;
}

/**
 * Convert resume data to plain text format
 */
export const exportToText = (resume: ExportableResume): string => {
  let text = `${resume.name}\n`;
  text += `Generated on: ${formatDateToMMDDYYYY(resume.created_at)}\n`;
  if (resume.ats_score) {
    text += `ATS Score: ${resume.ats_score}%\n`;
  }
  text += '\n' + '='.repeat(50) + '\n\n';

  // If the resume has structured content, convert it to text
  if (resume.content) {
    if (resume.content.personalInfo) {
      const info = resume.content.personalInfo;
      if (info.name) text += `${info.name}\n`;
      if (info.email) text += `${info.email}\n`;
      if (info.phone) text += `${info.phone}\n`;
      if (info.linkedin) text += `${info.linkedin}\n`;
      text += '\n';
    }

    if (resume.content.sections) {
      resume.content.sections.forEach((section: any) => {
        text += `${section.title.toUpperCase()}\n`;
        text += '-'.repeat(section.title.length) + '\n';
        
        if (section.content && Array.isArray(section.content)) {
          section.content.forEach((item: string) => {
            text += `${item}\n`;
          });
        }
        text += '\n';
      });
    }

    if (resume.content.experienceBullets) {
      text += 'PROFESSIONAL EXPERIENCE\n';
      text += '-'.repeat(22) + '\n';
      
      resume.content.experienceBullets.forEach((exp: any) => {
        text += `${exp.position}\n`;
        if (exp.company) text += `${exp.company}\n`;
        if (exp.bullets && Array.isArray(exp.bullets)) {
          exp.bullets.forEach((bullet: string) => {
            text += `• ${bullet}\n`;
          });
        }
        text += '\n';
      });
    }
  }

  return text;
};

/**
 * Download resume as text file
 */
export const downloadAsText = (resume: ExportableResume) => {
  const textContent = exportToText(resume);
  const blob = new Blob([textContent], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resume.name.replace(/[^a-z0-9]/gi, '_')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


/**
 * Copy resume content to clipboard
 */
export const copyToClipboard = async (resume: ExportableResume): Promise<boolean> => {
  try {
    const textContent = exportToText(resume);
    await navigator.clipboard.writeText(textContent);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Main export function that handles all formats
 */
export const exportResume = (resume: ExportableResume, format: 'copy' | 'txt') => {
  switch (format) {
    case 'copy':
      return copyToClipboard(resume);
    case 'txt':
      downloadAsText(resume);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
