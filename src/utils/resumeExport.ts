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
 * Convert resume data to HTML format for PDF generation
 */
export const exportToHTML = (resume: ExportableResume): string => {
  let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${resume.name}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px;
            color: #333;
        }
        .header { 
            text-align: center; 
            border-bottom: 2px solid #333; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
        }
        .name { 
            font-size: 2em; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .contact { 
            font-size: 0.9em; 
            color: #666; 
        }
        .section { 
            margin-bottom: 30px; 
        }
        .section-title { 
            font-size: 1.3em; 
            font-weight: bold; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 5px; 
            margin-bottom: 15px; 
            text-transform: uppercase;
        }
        .experience-item { 
            margin-bottom: 20px; 
        }
        .position { 
            font-weight: bold; 
            font-size: 1.1em; 
        }
        .company { 
            font-style: italic; 
            color: #666; 
            margin-bottom: 10px; 
        }
        .bullet { 
            margin-left: 20px; 
            margin-bottom: 5px; 
        }
        .meta { 
            font-size: 0.8em; 
            color: #888; 
            text-align: center; 
            margin-top: 40px; 
            border-top: 1px solid #eee; 
            padding-top: 20px; 
        }
    </style>
</head>
<body>`;

  // Header
  if (resume.content?.personalInfo) {
    const info = resume.content.personalInfo;
    html += `
    <div class="header">
        ${info.name ? `<div class="name">${info.name}</div>` : ''}
        <div class="contact">
            ${info.email ? `${info.email}` : ''}
            ${info.phone ? ` • ${info.phone}` : ''}
            ${info.linkedin ? ` • ${info.linkedin}` : ''}
        </div>
    </div>`;
  }

  // Experience Section
  if (resume.content?.experienceBullets && resume.content.experienceBullets.length > 0) {
    html += `
    <div class="section">
        <div class="section-title">Professional Experience</div>`;
    
    resume.content.experienceBullets.forEach((exp: any) => {
      html += `
        <div class="experience-item">
            <div class="position">${exp.position}</div>
            ${exp.company ? `<div class="company">${exp.company}</div>` : ''}`;
      
      if (exp.bullets && Array.isArray(exp.bullets)) {
        exp.bullets.forEach((bullet: string) => {
          html += `<div class="bullet">• ${bullet}</div>`;
        });
      }
      
      html += `</div>`;
    });
    
    html += `</div>`;
  }

  // Other Sections
  if (resume.content?.sections && Array.isArray(resume.content.sections)) {
    resume.content.sections.forEach((section: any) => {
      html += `
      <div class="section">
          <div class="section-title">${section.title}</div>`;
      
      if (section.content && Array.isArray(section.content)) {
        section.content.forEach((item: string) => {
          // Handle different content types
          if (item.startsWith('- ')) {
            html += `<div class="bullet">• ${item.substring(2)}</div>`;
          } else if (item.startsWith('**') && item.endsWith('**')) {
            html += `<div style="font-weight: bold; margin-bottom: 5px;">${item.slice(2, -2)}</div>`;
          } else if (item.startsWith('*') && item.endsWith('*')) {
            html += `<div style="font-style: italic; color: #666; margin-bottom: 5px;">${item.slice(1, -1)}</div>`;
          } else {
            html += `<div style="margin-bottom: 5px;">${item}</div>`;
          }
        });
      }
      
      html += `</div>`;
    });
  }

  // Footer
  html += `
    <div class="meta">
        Generated: ${formatDateToMMDDYYYY(new Date().toISOString())}
        ${resume.ats_score ? ` • ATS Score: ${resume.ats_score}%` : ''}
    </div>
</body>
</html>`;

  return html;
};

/**
 * Download resume as PDF (using browser's print functionality)
 */
export const downloadAsPDF = (resume: ExportableResume) => {
  const htmlContent = exportToHTML(resume);
  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Note: Window will close automatically after printing on most browsers
      }, 250);
    };
  }
};

/**
 * Download resume as DOCX (simplified version using HTML-to-DOCX approach)
 */
export const downloadAsDocx = (resume: ExportableResume) => {
  const htmlContent = exportToHTML(resume);
  
  // Create a simple DOCX-like structure using HTML
  const docxContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
<meta charset="utf-8">
<title>${resume.name}</title>
<!--[if gte mso 9]>
<xml>
<w:WordDocument>
<w:View>Print</w:View>
<w:Zoom>90</w:Zoom>
<w:DoNotPromptForConvert/>
<w:DoNotShowInsertAsIcon/>
</w:WordDocument>
</xml>
<![endif]-->
</head>
<body>${htmlContent}</body>
</html>`;

  const blob = new Blob([docxContent], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${resume.name.replace(/[^a-z0-9]/gi, '_')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Main export function that handles all formats
 */
export const exportResume = (resume: ExportableResume, format: 'pdf' | 'docx' | 'txt') => {
  switch (format) {
    case 'pdf':
      downloadAsPDF(resume);
      break;
    case 'docx':
      downloadAsDocx(resume);
      break;
    case 'txt':
      downloadAsText(resume);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};
