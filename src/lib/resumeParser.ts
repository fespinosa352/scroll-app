import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js';

export interface ParsedResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  skills: string[];
}

// Extract text from PDF using PDF.js
async function extractTextFromPDF(file: File): Promise<string> {
  try {
    console.log('Starting PDF text extraction...');
    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
    
    const pdf = await pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/cmaps/',
      cMapPacked: true
    }).promise;
    
    console.log('PDF loaded, pages:', pdf.numPages);
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      console.log(`Processing page ${pageNum}...`);
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => {
          if (item && typeof item === 'object' && 'str' in item) {
            return item.str;
          }
          return '';
        })
        .filter(text => text.length > 0)
        .join(' ');
      
      fullText += pageText + '\n';
      console.log(`Page ${pageNum} text length:`, pageText.length);
    }
    
    console.log('PDF text extraction complete, total length:', fullText.length);
    return fullText;
  } catch (error) {
    console.error('Error in PDF text extraction:', error);
    throw new Error(`PDF parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Extract text from DOCX using mammoth
async function extractTextFromDOCX(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Extract text from DOC files (basic support)
async function extractTextFromDOC(file: File): Promise<string> {
  // For .doc files, we'll use a simple approach
  // In production, you might want to use a more robust solution
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

// Extract personal information using regex patterns
function extractPersonalInfo(text: string): ParsedResume['personalInfo'] {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const phoneRegex = /(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g;
  
  const emails = text.match(emailRegex) || [];
  const phones = text.match(phoneRegex) || [];
  
  // Extract name (usually at the top of the resume)
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  let name = '';
  
  // Look for name in first few lines
  for (let i = 0; i < Math.min(3, lines.length); i++) {
    const line = lines[i].trim();
    // Skip lines that are likely not names
    if (line.includes('@') || line.includes('http') || line.includes('www') || 
        line.includes('Phone') || line.includes('Email') || line.includes('Address')) {
      continue;
    }
    // Check if line looks like a name (2-4 words, each starting with capital)
    const words = line.split(/\s+/);
    if (words.length >= 2 && words.length <= 4 && 
        words.every(word => /^[A-Z][a-z]+$/.test(word))) {
      name = line;
      break;
    }
  }
  
  // Extract location (look for city, state patterns)
  const locationRegex = /([A-Za-z\s]+),\s*([A-Z]{2})\s*(\d{5})?/g;
  const locations = text.match(locationRegex) || [];
  
  return {
    name: name || 'Name not found',
    email: emails[0] || 'Email not found',
    phone: phones[0] || 'Phone not found',
    location: locations[0] || 'Location not found'
  };
}

// Extract work experience
function extractExperience(text: string): ParsedResume['experience'] {
  const experience: ParsedResume['experience'] = [];
  
  // Common section headers for experience
  const experienceHeaders = [
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 
    'EMPLOYMENT', 'CAREER', 'WORK HISTORY'
  ];
  
  let experienceSection = '';
  const lines = text.split('\n');
  
  // Find experience section
  let inExperienceSection = false;
  let sectionStartIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    if (experienceHeaders.some(header => line.includes(header))) {
      inExperienceSection = true;
      sectionStartIndex = i;
      continue;
    }
    
    // Stop if we hit another major section
    if (inExperienceSection && 
        (line.includes('EDUCATION') || line.includes('SKILLS') || 
         line.includes('PROJECTS') || line.includes('CERTIFICATIONS'))) {
      break;
    }
    
    if (inExperienceSection) {
      experienceSection += lines[i] + '\n';
    }
  }
  
  if (!experienceSection) {
    // If no explicit experience section, try to extract from entire text
    experienceSection = text;
  }
  
  // Parse job entries
  const jobEntries = experienceSection.split(/\n\s*\n/).filter(entry => entry.trim().length > 0);
  
  for (const entry of jobEntries) {
    const lines = entry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) continue;
    
    // Try to identify job title and company
    let title = '';
    let company = '';
    let duration = '';
    const achievements: string[] = [];
    
    // Look for patterns like "Job Title at Company Name"
    const titleCompanyRegex = /(.+?)\s+at\s+(.+)/i;
    const match = lines[0].match(titleCompanyRegex);
    
    if (match) {
      title = match[1].trim();
      company = match[2].trim();
    } else {
      // Try other patterns
      title = lines[0].trim();
      if (lines.length > 1) {
        company = lines[1].trim();
      }
    }
    
    // Look for dates
    const dateRegex = /\b(19|20)\d{2}\b|\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(19|20)\d{2}\b/g;
    const dates = entry.match(dateRegex) || [];
    if (dates.length > 0) {
      duration = dates.length > 1 ? `${dates[0]} - ${dates[dates.length - 1]}` : dates[0];
    }
    
    // Extract achievements (bullet points or lines that start with action words)
    const actionWords = ['Led', 'Managed', 'Developed', 'Implemented', 'Increased', 'Decreased', 'Improved', 'Created', 'Built', 'Designed', 'Achieved', 'Delivered'];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') ||
          actionWords.some(word => trimmed.startsWith(word))) {
        achievements.push(trimmed.replace(/^[•\-*]\s*/, ''));
      }
    }
    
    if (title && company) {
      experience.push({
        title,
        company,
        duration: duration || 'Duration not specified',
        achievements: achievements.length > 0 ? achievements : ['Responsibilities not specified']
      });
    }
  }
  
  return experience;
}

// Extract education
function extractEducation(text: string): ParsedResume['education'] {
  const education: ParsedResume['education'] = [];
  
  // Common degree types
  const degreeTypes = ['Bachelor', 'Master', 'PhD', 'Associate', 'Certificate', 'Diploma', 'B.S.', 'B.A.', 'M.S.', 'M.A.'];
  
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for degree patterns
    if (degreeTypes.some(degree => trimmed.includes(degree))) {
      const yearRegex = /\b(19|20)\d{2}\b/g;
      const years = trimmed.match(yearRegex) || [];
      
      education.push({
        degree: trimmed,
        institution: 'Institution not specified',
        year: years[years.length - 1] || 'Year not specified'
      });
    }
  }
  
  return education;
}

// Extract skills
function extractSkills(text: string): string[] {
  const skills: string[] = [];
  
  // Common skills section headers
  const skillsHeaders = ['SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'TECHNOLOGIES'];
  
  let skillsSection = '';
  const lines = text.split('\n');
  
  // Find skills section
  let inSkillsSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    if (skillsHeaders.some(header => line.includes(header))) {
      inSkillsSection = true;
      continue;
    }
    
    // Stop if we hit another major section
    if (inSkillsSection && 
        (line.includes('EXPERIENCE') || line.includes('EDUCATION') || 
         line.includes('PROJECTS') || line.includes('CERTIFICATIONS'))) {
      break;
    }
    
    if (inSkillsSection) {
      skillsSection += lines[i] + '\n';
    }
  }
  
  if (skillsSection) {
    // Parse skills from the section
    const skillsText = skillsSection.replace(/[•\-*]/g, '').replace(/\n/g, ' ');
    const potentialSkills = skillsText.split(/[,;]/).map(skill => skill.trim()).filter(skill => skill.length > 0);
    skills.push(...potentialSkills);
  }
  
  // Also look for common technologies throughout the document
  const commonTechnologies = [
    'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'HTML', 'CSS',
    'AWS', 'Docker', 'Git', 'TypeScript', 'Angular', 'Vue.js', 'MongoDB',
    'PostgreSQL', 'Redis', 'Kubernetes', 'Linux', 'Azure', 'GCP'
  ];
  
  for (const tech of commonTechnologies) {
    if (text.includes(tech) && !skills.includes(tech)) {
      skills.push(tech);
    }
  }
  
  return skills.slice(0, 20); // Limit to 20 skills to avoid noise
}

// Extract professional summary
function extractSummary(text: string): string {
  const summaryHeaders = ['SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE', 'OBJECTIVE', 'ABOUT'];
  
  const lines = text.split('\n');
  let summarySection = '';
  let inSummarySection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    if (summaryHeaders.some(header => line.includes(header))) {
      inSummarySection = true;
      continue;
    }
    
    // Stop if we hit another major section
    if (inSummarySection && 
        (line.includes('EXPERIENCE') || line.includes('EDUCATION') || 
         line.includes('SKILLS') || line.includes('PROJECTS'))) {
      break;
    }
    
    if (inSummarySection) {
      summarySection += lines[i] + '\n';
    }
  }
  
  if (summarySection.trim()) {
    return summarySection.trim();
  }
  
  // Fallback: use first paragraph after personal info
  const paragraphs = text.split('\n\n');
  for (const paragraph of paragraphs) {
    if (paragraph.length > 100 && !paragraph.includes('@') && !paragraph.includes('Phone')) {
      return paragraph.trim();
    }
  }
  
  return 'Professional summary not found';
}

// Main parsing function
export async function parseResume(file: File): Promise<ParsedResume> {
  let text = '';
  
  try {
    // Extract text based on file type
    if (file.type === 'application/pdf') {
      text = await extractTextFromPDF(file);
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDOCX(file);
    } else if (file.type === 'application/msword') {
      text = await extractTextFromDOC(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }
    
    // Parse the extracted text
    const personalInfo = extractPersonalInfo(text);
    const experience = extractExperience(text);
    const education = extractEducation(text);
    const skills = extractSkills(text);
    const summary = extractSummary(text);
    
    return {
      personalInfo,
      summary,
      experience,
      education,
      skills
    };
    
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}