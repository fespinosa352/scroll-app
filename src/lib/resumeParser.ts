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
    fieldOfStudy?: string;
    gpa?: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    year?: string;
    issueDate?: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
  skills: string[];
  unknownSections?: Array<{
    title: string;
    content: string[];
  }>;
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
    'EMPLOYMENT', 'CAREER', 'WORK HISTORY', 'EMPLOYMENT HISTORY'
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
  
  // Parse job entries - split by double newlines or company/date patterns
  const jobEntries = experienceSection.split(/\n\s*\n/).filter(entry => entry.trim().length > 0);
  
  for (const entry of jobEntries) {
    const lines = entry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length < 2) continue;
    
    // Try to identify job title and company
    let title = '';
    let company = '';
    let duration = '';
    const achievements: string[] = [];
    
    // Enhanced patterns for different resume formats
    const titleCompanyPatterns = [
      /(.+?)\s+at\s+(.+)/i,  // "Senior Developer at Google"
      /(.+?)\s*-\s*(.+)/i,   // "Senior Developer - Google"
      /(.+?)\s*\|\s*(.+)/i,  // "Senior Developer | Google"
      /(.+?)\s*,\s*(.+)/i    // "Senior Developer, Google"
    ];
    
    let foundMatch = false;
    for (const pattern of titleCompanyPatterns) {
      const match = lines[0].match(pattern);
      if (match && !match[2].match(/\d{4}/)) { // Don't match if second group contains years
        title = match[1].trim();
        company = match[2].trim();
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      // Assume first line is title, second line is company
      title = lines[0].trim();
      if (lines.length > 1 && !lines[1].match(/\d{4}/)) {
        company = lines[1].trim();
      }
    }
    
    // Enhanced date extraction
    const datePatterns = [
      // Month Year format: "January 2020", "Jan 2020"
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}\b/gi,
      // Year only: "2020"
      /\b(19|20)\d{2}\b/g,
      // Full dates: "01/2020", "2020-01"
      /\b(0[1-9]|1[0-2])\/(19|20)\d{2}\b/g,
      /\b(19|20)\d{2}-(0[1-9]|1[0-2])\b/g
    ];
    
    let allDates: string[] = [];
    for (const pattern of datePatterns) {
      const matches = entry.match(pattern) || [];
      allDates = allDates.concat(matches);
    }
    
    // Remove duplicates and sort dates
    allDates = [...new Set(allDates)].sort();
    
    // Look for "Present" or "Current"
    const hasPresent = /\b(present|current)\b/i.test(entry);
    
    if (allDates.length > 0) {
      if (allDates.length === 1) {
        duration = hasPresent ? `${allDates[0]} - Present` : allDates[0];
      } else {
        const startDate = allDates[0];
        const endDate = hasPresent ? 'Present' : allDates[allDates.length - 1];
        duration = `${startDate} - ${endDate}`;
      }
    } else if (hasPresent) {
      duration = 'Present';
    }
    
    // Enhanced achievement extraction
    const actionWords = [
      'Led', 'Managed', 'Developed', 'Implemented', 'Increased', 'Decreased', 
      'Improved', 'Created', 'Built', 'Designed', 'Achieved', 'Delivered',
      'Established', 'Coordinated', 'Supervised', 'Maintained', 'Optimized',
      'Streamlined', 'Enhanced', 'Reduced', 'Generated', 'Executed',
      'Collaborated', 'Facilitated', 'Oversaw', 'Spearheaded', 'Launched'
    ];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip lines that are likely titles, companies, or dates
      if (trimmed === title || trimmed === company || 
          /\b(19|20)\d{2}\b/.test(trimmed) ||
          trimmed.length < 10) {
        continue;
      }
      
      // Check for bullet points or action words
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') ||
          trimmed.startsWith('→') || trimmed.startsWith('▪') ||
          actionWords.some(word => trimmed.startsWith(word))) {
        const cleanedAchievement = trimmed.replace(/^[•\-*→▪]\s*/, '');
        if (cleanedAchievement.length > 10) {
          achievements.push(cleanedAchievement);
        }
      }
      // Also include lines that look like achievements (contain numbers, percentages, etc.)
      else if (/\d+%|\$\d+|\d+\+|increased|improved|reduced|generated/i.test(trimmed) && trimmed.length > 15) {
        achievements.push(trimmed);
      }
    }
    
    // Only add if we have meaningful data
    if (title && title.length > 2 && company && company.length > 2) {
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
  
  // Common section headers for education
  const educationHeaders = [
    'EDUCATION', 'ACADEMIC BACKGROUND', 'ACADEMIC QUALIFICATIONS',
    'EDUCATIONAL BACKGROUND', 'DEGREES', 'ACADEMIC HISTORY'
  ];
  
  let educationSection = '';
  const lines = text.split('\n');
  
  // Find education section
  let inEducationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    if (educationHeaders.some(header => line.includes(header))) {
      inEducationSection = true;
      continue;
    }
    
    // Stop if we hit another major section
    if (inEducationSection && 
        (line.includes('EXPERIENCE') || line.includes('SKILLS') || 
         line.includes('PROJECTS') || line.includes('CERTIFICATIONS'))) {
      break;
    }
    
    if (inEducationSection) {
      educationSection += lines[i] + '\n';
    }
  }
  
  if (!educationSection) {
    // If no explicit education section, search entire text for degree patterns
    educationSection = text;
  }
  
  // Common degree types and patterns
  const degreePatterns = [
    /\b(Bachelor|Master|PhD|Ph\.?D\.?|Associate|Certificate|Diploma|B\.?S\.?|B\.?A\.?|M\.?S\.?|M\.?A\.?|MBA|M\.?B\.?A\.?)\b/gi,
    /\b(Doctor of|Bachelor of|Master of)\s+\w+/gi
  ];
  
  // Parse education entries
  const educationEntries = educationSection.split(/\n\s*\n/).filter(entry => entry.trim().length > 0);
  
  for (const entry of educationEntries) {
    const lines = entry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) continue;
    
    let degree = '';
    let institution = '';
    let fieldOfStudy = '';
    let year = '';
    let gpa = '';
    
    // Look for degree patterns in the entry
    for (const pattern of degreePatterns) {
      for (const line of lines) {
        const matches = line.match(pattern);
        if (matches && !degree) {
          degree = matches[0];
          
          // Try to extract field of study from the same line
          const fieldPatterns = [
            /\bin\s+([A-Z][a-z\s]+)/i,  // "in Computer Science"
            /\bof\s+([A-Z][a-z\s]+)/i,  // "of Engineering" 
            /Bachelor\s+of\s+([A-Z][a-z\s]+)/i,  // "Bachelor of Science"
            /Master\s+of\s+([A-Z][a-z\s]+)/i     // "Master of Arts"
          ];
          
          for (const fieldPattern of fieldPatterns) {
            const fieldMatch = line.match(fieldPattern);
            if (fieldMatch && fieldMatch[1]) {
              fieldOfStudy = fieldMatch[1].trim();
              break;
            }
          }
          break;
        }
      }
      if (degree) break;
    }
    
    // Look for institution name
    const institutionKeywords = ['University', 'College', 'Institute', 'School', 'Academy'];
    for (const line of lines) {
      if (!institution && institutionKeywords.some(keyword => line.includes(keyword))) {
        // Clean up the line to get institution name
        const cleanLine = line.replace(/^\W+|\W+$/g, '').trim();
        if (cleanLine.length > 0 && !degreePatterns.some(pattern => pattern.test(cleanLine))) {
          institution = cleanLine;
          break;
        }
      }
    }
    
    // Look for year
    const yearRegex = /\b(19|20)\d{2}\b/g;
    const years = entry.match(yearRegex) || [];
    if (years.length > 0) {
      year = years[years.length - 1]; // Use the most recent year
    }
    
    // Look for GPA
    const gpaRegex = /GPA:?\s*(\d+\.?\d*)/i;
    const gpaMatch = entry.match(gpaRegex);
    if (gpaMatch) {
      gpa = gpaMatch[1];
    }
    
    // Only add if we have meaningful data
    if (degree || (institution && institutionKeywords.some(keyword => institution.includes(keyword)))) {
      education.push({
        degree: degree || 'Degree not specified',
        institution: institution || 'Institution not specified',
        year: year || 'Year not specified',
        fieldOfStudy: fieldOfStudy || undefined,
        gpa: gpa || undefined
      });
    }
  }
  
  return education;
}

// Extract certifications
function extractCertifications(text: string): ParsedResume['certifications'] {
  const certifications: ParsedResume['certifications'] = [];
  
  // Common section headers for certifications
  const certificationHeaders = [
    'CERTIFICATIONS', 'CERTIFICATES', 'PROFESSIONAL CERTIFICATIONS',
    'LICENSES', 'CREDENTIALS', 'PROFESSIONAL CREDENTIALS'
  ];
  
  let certificationSection = '';
  const lines = text.split('\n');
  
  // Find certification section
  let inCertificationSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toUpperCase();
    
    if (certificationHeaders.some(header => line.includes(header))) {
      inCertificationSection = true;
      continue;
    }
    
    // Stop if we hit another major section
    if (inCertificationSection && 
        (line.includes('EXPERIENCE') || line.includes('EDUCATION') || 
         line.includes('SKILLS') || line.includes('PROJECTS'))) {
      break;
    }
    
    if (inCertificationSection) {
      certificationSection += lines[i] + '\n';
    }
  }
  
  if (!certificationSection) {
    // Look for common certification patterns in entire text
    const certificationKeywords = [
      'AWS', 'Microsoft', 'Google', 'Cisco', 'Oracle', 'PMP', 'CISSP',
      'CompTIA', 'Salesforce', 'Adobe', 'Certified', 'Certificate'
    ];
    
    const relevantLines = lines.filter(line => 
      certificationKeywords.some(keyword => 
        line.toUpperCase().includes(keyword.toUpperCase())
      )
    );
    
    certificationSection = relevantLines.join('\n');
  }
  
  if (!certificationSection) return certifications;
  
  // Parse certification entries
  const certificationEntries = certificationSection.split(/\n\s*\n/).filter(entry => entry.trim().length > 0);
  
  for (const entry of certificationEntries) {
    const lines = entry.split('\n').filter(line => line.trim().length > 0);
    if (lines.length === 0) continue;
    
    let name = '';
    let issuer = '';
    let year = '';
    let credentialId = '';
    
    // Try to identify certification name and issuer
    const firstLine = lines[0].trim();
    
    // Common patterns for certifications
    const certPatterns = [
      /(.+?)\s*-\s*(.+)/,  // "AWS Certified Solutions Architect - Amazon"
      /(.+?)\s*\|\s*(.+)/,  // "PMP | Project Management Institute"
      /(.+?)\s*by\s*(.+)/i, // "Certified Developer by Microsoft"
      /(.+?)\s*from\s*(.+)/i // "Certificate from Google"
    ];
    
    let foundMatch = false;
    for (const pattern of certPatterns) {
      const match = firstLine.match(pattern);
      if (match && !match[2].match(/\d{4}/)) { // Don't match if second group contains years
        name = match[1].trim();
        issuer = match[2].trim();
        foundMatch = true;
        break;
      }
    }
    
    if (!foundMatch) {
      // Try to extract from context
      name = firstLine;
      
      // Look for issuer in subsequent lines or same line
      const issuerKeywords = ['Microsoft', 'Google', 'Amazon', 'AWS', 'Oracle', 'Cisco', 'Adobe', 'Salesforce'];
      for (const keyword of issuerKeywords) {
        if (entry.toUpperCase().includes(keyword.toUpperCase())) {
          issuer = keyword;
          break;
        }
      }
    }
    
    // Look for year/date
    const yearRegex = /\b(19|20)\d{2}\b/g;
    const years = entry.match(yearRegex) || [];
    if (years.length > 0) {
      year = years[years.length - 1];
    }
    
    // Look for credential ID
    const credentialPatterns = [
      /ID:?\s*([A-Z0-9\-]+)/i,
      /Credential:?\s*([A-Z0-9\-]+)/i,
      /Certificate:?\s*([A-Z0-9\-]+)/i
    ];
    
    for (const pattern of credentialPatterns) {
      const match = entry.match(pattern);
      if (match) {
        credentialId = match[1];
        break;
      }
    }
    
    // Only add if we have meaningful data
    if (name && name.length > 3) {
      certifications.push({
        name: name,
        issuer: issuer || 'Issuer not specified',
        year: year || undefined,
        issueDate: year || undefined,
        credentialId: credentialId || undefined
      });
    }
  }
  
  return certifications;
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

// Extract sections that don't match standard categories
function extractUnknownSections(text: string): Array<{ title: string; content: string[] }> {
  const knownSectionHeaders = [
    'EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT',
    'EDUCATION', 'ACADEMIC BACKGROUND', 'QUALIFICATIONS',
    'SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'TECHNOLOGIES',
    'CERTIFICATIONS', 'CERTIFICATES', 'LICENSES',
    'SUMMARY', 'OBJECTIVE', 'PROFILE', 'ABOUT',
    'CONTACT', 'PERSONAL INFORMATION'
  ];
  
  const unknownSections: Array<{ title: string; content: string[] }> = [];
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let currentSection: { title: string; content: string[] } | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();
    
    // Check if this line looks like a section header (all caps, short, etc.)
    const isHeader = (
      line.length < 50 && 
      (upperLine === line || line.match(/^[A-Z][A-Z\s&]+$/)) &&
      !line.includes('@') && // Not an email
      !line.match(/\d{4}/) && // Not containing years
      !line.includes(',') // Not a list item
    );
    
    if (isHeader) {
      // Save previous unknown section if it exists
      if (currentSection && !knownSectionHeaders.some(known => currentSection!.title.includes(known))) {
        if (currentSection.content.length > 0) {
          unknownSections.push(currentSection);
        }
      }
      
      // Start new section
      currentSection = {
        title: line,
        content: []
      };
    } else if (currentSection) {
      // Add content to current section
      currentSection.content.push(line);
    }
  }
  
  // Don't forget the last section
  if (currentSection && !knownSectionHeaders.some(known => currentSection!.title.includes(known))) {
    if (currentSection.content.length > 0) {
      unknownSections.push(currentSection);
    }
  }
  
  // Filter out sections that are too small or likely noise
  return unknownSections.filter(section => 
    section.content.length >= 2 && 
    section.title.length >= 3 &&
    section.title.length <= 50
  );
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
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDOCX(file);
    } else if (file.type === 'application/msword') {
      text = await extractTextFromDOC(file);
    } else {
      throw new Error(`Unsupported file type: ${file.type}. Please upload DOC or DOCX files only.`);
    }
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text could be extracted from the file');
    }
    
    // Parse the extracted text
    const personalInfo = extractPersonalInfo(text);
    const experience = extractExperience(text);
    const education = extractEducation(text);
    const certifications = extractCertifications(text);
    const skills = extractSkills(text);
    const summary = extractSummary(text);
    const unknownSections = extractUnknownSections(text);
    
    return {
      personalInfo,
      summary,
      experience,
      education,
      certifications,
      skills,
      unknownSections
    };
    
  } catch (error) {
    console.error('Error parsing resume:', error);
    throw new Error(`Failed to parse resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}