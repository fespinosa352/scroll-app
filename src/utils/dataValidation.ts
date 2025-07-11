// Data validation utilities for detecting invalid or placeholder values

export const INVALID_VALUE_PATTERNS = [
  'Unknown Company',
  'Company not specified',
  'Unknown Position', 
  'Position not specified',
  'Unknown Institution',
  'Institution not specified',
  'Unknown Degree',
  'Degree not specified',
  'Unknown Certification',
  'Unknown Issuer',
  'Issuer not specified',
  'Invalid Date',
  'Duration not specified',
  'Year not specified',
  'Responsibilities not specified'
];

export const isInvalidValue = (value: string | null | undefined): boolean => {
  if (!value || typeof value !== 'string') return false;
  return INVALID_VALUE_PATTERNS.some(pattern => 
    value.toLowerCase().includes(pattern.toLowerCase())
  );
};

export const hasInvalidData = (text: string): boolean => {
  return INVALID_VALUE_PATTERNS.some(pattern => 
    text.toLowerCase().includes(pattern.toLowerCase())
  );
};

export const getInvalidDataCount = (workExperience: any[], education: any[], certifications: any[]): number => {
  let count = 0;
  
  // Check work experience
  workExperience.forEach(exp => {
    if (isInvalidValue(exp.company)) count++;
    if (isInvalidValue(exp.position)) count++;
    if (isInvalidValue(exp.startDate) || isInvalidValue(exp.endDate)) count++;
  });
  
  // Check education
  education.forEach(edu => {
    if (isInvalidValue(edu.institution)) count++;
    if (isInvalidValue(edu.degree)) count++;
  });
  
  // Check certifications  
  certifications.forEach(cert => {
    if (isInvalidValue(cert.name)) count++;
    if (isInvalidValue(cert.issuer)) count++;
  });
  
  return count;
};

export const formatWithInvalidHighlight = (text: string): { text: string; isInvalid: boolean } => {
  return {
    text,
    isInvalid: hasInvalidData(text)
  };
};