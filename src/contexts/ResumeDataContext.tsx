import React, { createContext, useContext, useState, ReactNode } from 'react';

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrentRole: boolean;
  skills: string[];
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
}

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  isCurrentlyEnrolled: boolean;
}

interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  doesNotExpire: boolean;
}

interface ResumeDataContextType {
  workExperience: WorkExperience[];
  personalInfo: PersonalInfo | null;
  education: Education[];
  certifications: Certification[];
  skills: string[];
  setWorkExperience: (experience: WorkExperience[]) => void;
  setPersonalInfo: (info: PersonalInfo) => void;
  setEducation: (education: Education[]) => void;
  setCertifications: (certifications: Certification[]) => void;
  setSkills: (skills: string[]) => void;
  updateFromParsedResume: (parsedData: any) => void;
}

const ResumeDataContext = createContext<ResumeDataContextType | undefined>(undefined);

export const useResumeData = () => {
  const context = useContext(ResumeDataContext);
  if (context === undefined) {
    throw new Error('useResumeData must be used within a ResumeDataProvider');
  }
  return context;
};

interface ResumeDataProviderProps {
  children: ReactNode;
}

export const ResumeDataProvider: React.FC<ResumeDataProviderProps> = ({ children }) => {
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<string[]>([]);

  const updateFromParsedResume = (parsedData: any) => {
    console.log('Updating resume data from parsed resume:', parsedData);
    
    // Update personal info
    if (parsedData.personalInfo) {
      setPersonalInfo(parsedData.personalInfo);
    }

    // Update skills
    if (parsedData.skills) {
      setSkills(parsedData.skills);
    }

    // Convert parsed experience to WorkExperience format
    if (parsedData.experience) {
      const convertedExperience: WorkExperience[] = parsedData.experience.map((exp: any, index: number) => ({
        id: `parsed-${index}-${Date.now()}`,
        company: exp.company || 'Unknown Company',
        position: exp.title || 'Unknown Position',
        startDate: convertDateFormat(exp.duration?.split(' - ')[0] || ''),
        endDate: convertDateFormat(exp.duration?.split(' - ')[1] || ''),
        description: exp.achievements?.join('. ') || '',
        isCurrentRole: exp.duration?.includes('Present') || false,
        skills: exp.skills || []
      }));
      
      setWorkExperience(convertedExperience);
      console.log('Converted work experience:', convertedExperience);
    }

    // Convert parsed education to Education format
    if (parsedData.education) {
      const convertedEducation: Education[] = parsedData.education.map((edu: any, index: number) => ({
        id: `parsed-edu-${index}-${Date.now()}`,
        institution: edu.institution || 'Unknown Institution',
        degree: edu.degree || 'Unknown Degree',
        fieldOfStudy: edu.fieldOfStudy || '',
        startDate: convertDateFormat(edu.startDate || ''),
        endDate: convertDateFormat(edu.endDate || edu.year || ''),
        gpa: edu.gpa || '',
        isCurrentlyEnrolled: false
      }));
      
      setEducation(convertedEducation);
      console.log('Converted education:', convertedEducation);
    }

    // Convert parsed certifications (if any are found in the resume)
    if (parsedData.certifications) {
      const convertedCertifications: Certification[] = parsedData.certifications.map((cert: any, index: number) => ({
        id: `parsed-cert-${index}-${Date.now()}`,
        name: cert.name || 'Unknown Certification',
        issuer: cert.issuer || 'Unknown Issuer',
        issueDate: convertDateFormat(cert.issueDate || cert.year || ''),
        expiryDate: cert.expiryDate ? convertDateFormat(cert.expiryDate) : undefined,
        credentialId: cert.credentialId || '',
        credentialUrl: cert.credentialUrl || '',
        doesNotExpire: !cert.expiryDate
      }));
      
      setCertifications(convertedCertifications);
      console.log('Converted certifications:', convertedCertifications);
    }
  };

  // Helper function to convert date formats
  const convertDateFormat = (dateStr: string) => {
    if (!dateStr || dateStr === 'Present' || dateStr === 'Current') return '';
    
    // Handle month-year formats like "January 2020", "Jan 2020"
    const monthYearMatch = dateStr.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}\b/i);
    if (monthYearMatch) {
      const monthMap: { [key: string]: string } = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      const month = monthMap[monthYearMatch[1].toLowerCase().substring(0, 3)] || '01';
      const year = monthYearMatch[2];
      return `${year}-${month}`;
    }
    
    // Handle year-only formats
    const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return `${yearMatch[0]}-01`; // Default to January for year-only dates
    }
    
    // Handle MM/YYYY format
    const mmyyyyMatch = dateStr.match(/\b(0[1-9]|1[0-2])\/(19|20)\d{2}\b/);
    if (mmyyyyMatch) {
      return `${mmyyyyMatch[2]}-${mmyyyyMatch[1]}`;
    }
    
    return dateStr;
  };

  const value = {
    workExperience,
    personalInfo,
    education,
    certifications,
    skills,
    setWorkExperience,
    setPersonalInfo,
    setEducation,
    setCertifications,
    setSkills,
    updateFromParsedResume
  };

  return (
    <ResumeDataContext.Provider value={value}>
      {children}
    </ResumeDataContext.Provider>
  );
};