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

interface ResumeDataContextType {
  workExperience: WorkExperience[];
  personalInfo: PersonalInfo | null;
  skills: string[];
  setWorkExperience: (experience: WorkExperience[]) => void;
  setPersonalInfo: (info: PersonalInfo) => void;
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
  };

  // Helper function to convert date formats
  const convertDateFormat = (dateStr: string) => {
    if (!dateStr || dateStr === 'Present') return '';
    
    // Try to parse common date formats like "2022", "2022 - Present", etc.
    const year = dateStr.match(/\d{4}/)?.[0];
    if (year) {
      return `${year}-01`; // Default to January for year-only dates
    }
    
    return dateStr;
  };

  const value = {
    workExperience,
    personalInfo,
    skills,
    setWorkExperience,
    setPersonalInfo,
    setSkills,
    updateFromParsedResume
  };

  return (
    <ResumeDataContext.Provider value={value}>
      {children}
    </ResumeDataContext.Provider>
  );
};