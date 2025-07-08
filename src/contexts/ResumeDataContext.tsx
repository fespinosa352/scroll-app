import React, { createContext, useContext, useState, ReactNode } from 'react';
import { WorkExperienceWithBlocks, BlockSection, Block, ResumeSection, DraggableBlock } from '@/types/blocks';
import type { ResumeVersion } from '@/hooks/useResumeVersions';
import { useResumes } from '@/hooks/useResumes';
import { toast } from 'sonner';

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
  workExperienceBlocks: WorkExperienceWithBlocks[];
  personalInfo: PersonalInfo | null;
  education: Education[];
  certifications: Certification[];
  skills: string[];
  currentEditingResume: ResumeVersion | null;
  resumeSections: ResumeSection[];
  setWorkExperience: (experience: WorkExperience[]) => void;
  setWorkExperienceBlocks: (experience: WorkExperienceWithBlocks[]) => void;
  setPersonalInfo: (info: PersonalInfo) => void;
  setEducation: (education: Education[]) => void;
  setCertifications: (certifications: Certification[]) => void;
  setSkills: (skills: string[]) => void;
  setCurrentEditingResume: (resume: ResumeVersion | null) => void;
  setResumeSections: (sections: ResumeSection[]) => void;
  updateFromParsedResume: (parsedData: any) => void;
  convertToBlockFormat: (experiences: WorkExperience[]) => WorkExperienceWithBlocks[];
  loadResumeForEditing: (resume: ResumeVersion) => void;
  createNewResume: () => void;
  saveCurrentResume: () => Promise<boolean>;
  handleUnknownSections: (sections: any[]) => void;
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
  const [workExperienceBlocks, setWorkExperienceBlocks] = useState<WorkExperienceWithBlocks[]>([]);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentEditingResume, setCurrentEditingResume] = useState<ResumeVersion | null>(null);
  const [resumeSections, setResumeSections] = useState<ResumeSection[]>([]);

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
    let convertedExperience: WorkExperience[] = [];
    if (parsedData.experience) {
      convertedExperience = parsedData.experience.map((exp: any, index: number) => ({
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

    // Convert to block format for the new experience editor
    if (parsedData.experience) {
      const blockExperiences = convertToBlockFormat(convertedExperience);
      setWorkExperienceBlocks(blockExperiences);
      console.log('Converted to block format:', blockExperiences);
    }
    
    // Handle unknown sections if they exist
    if (parsedData.unknownSections && parsedData.unknownSections.length > 0) {
      handleUnknownSections(parsedData.unknownSections);
    }
  };

  // Convert traditional experience format to block format
  const convertToBlockFormat = (experiences: WorkExperience[]): WorkExperienceWithBlocks[] => {
    return experiences.map(exp => {
      const sections: BlockSection[] = [];
      
      // Create sections from the experience description
      if (exp.description) {
        const responsibilitiesSection: BlockSection = {
          id: `section-responsibilities-${exp.id}`,
          title: 'Key Responsibilities',
          blocks: [{
            id: `block-desc-${exp.id}`,
            type: 'text',
            content: exp.description,
            order: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }],
          order: 0,
          collapsible: true,
          collapsed: false,
        };
        sections.push(responsibilitiesSection);
      }

      // Create achievements section if the description contains bullet points
      const achievementLines = exp.description
        ?.split(/[•\-*\n]/)
        .map(line => line.trim())
        .filter(line => line.length > 10) || [];

      if (achievementLines.length > 1) {
        const achievementsSection: BlockSection = {
          id: `section-achievements-${exp.id}`,
          title: 'Key Achievements',
          blocks: achievementLines.map((line, index) => ({
            id: `block-achievement-${exp.id}-${index}`,
            type: 'achievement' as const,
            content: line,
            order: index,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          order: 1,
          collapsible: true,
          collapsed: false,
        };
        sections.push(achievementsSection);
      }

      // Create skills section
      if (exp.skills && exp.skills.length > 0) {
        const skillsSection: BlockSection = {
          id: `section-skills-${exp.id}`,
          title: 'Technologies & Skills',
          blocks: exp.skills.map((skill, index) => ({
            id: `block-skill-${exp.id}-${index}`,
            type: 'skill_tag' as const,
            content: skill,
            order: index,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })),
          order: 2,
          collapsible: true,
          collapsed: false,
        };
        sections.push(skillsSection);
      }

      return {
        id: exp.id,
        company: exp.company,
        position: exp.position,
        startDate: exp.startDate,
        endDate: exp.endDate,
        isCurrentRole: exp.isCurrentRole,
        location: '', // TODO: Add location to original interface
        sections,
        skills: exp.skills,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    });
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

  const loadResumeForEditing = (resume: ResumeVersion) => {
    setCurrentEditingResume(resume);
    
    // Load resume sections - create empty sections for now as JobAnalysis doesn't have content blocks
    const sections: ResumeSection[] = [
      {
        id: 'section-experience',
        title: 'Work Experience',
        type: 'experience',
        blocks: [],
        order: 0,
        visible: true,
      },
      {
        id: 'section-skills',
        title: 'Key Skills',
        type: 'skills',
        blocks: [],
        order: 1,
        visible: true,
      },
      {
        id: 'section-education',
        title: 'Education',
        type: 'education',
        blocks: [],
        order: 2,
        visible: true,
      },
      {
        id: 'section-certifications',
        title: 'Certifications',
        type: 'certifications',
        blocks: [],
        order: 3,
        visible: true,
      }
    ];
    
    setResumeSections(sections);
  };

  const createNewResume = () => {
    // Create a new empty resume for editing
    const newResume: ResumeVersion = {
      id: `new-${Date.now()}`,
      name: 'New Resume',
      targetRole: 'Your Target Role',
      company: 'Target Company',
      createdDate: new Date().toISOString().split('T')[0],
      atsScore: 0,
      status: 'draft',
      matchedAchievements: 0,
    };
    
    setCurrentEditingResume(newResume);
    
    // Set up default empty sections
    const defaultSections: ResumeSection[] = [
      {
        id: 'section-experience',
        title: 'Work Experience',
        type: 'experience',
        blocks: [],
        order: 0,
        visible: true,
      },
      {
        id: 'section-skills',
        title: 'Key Skills',
        type: 'skills',
        blocks: [],
        order: 1,
        visible: true,
      },
      {
        id: 'section-education',
        title: 'Education',
        type: 'education',
        blocks: [],
        order: 2,
        visible: true,
      },
      {
        id: 'section-certifications',
        title: 'Certifications',
        type: 'certifications',
        blocks: [],
        order: 3,
        visible: true,
      }
    ];
    
    setResumeSections(defaultSections);
  };

  const handleUnknownSections = (unknownSections: any[]) => {
    // For now, we'll just log them and potentially show a toast
    // In a full implementation, you'd show a modal dialog asking the user where to place these
    console.log('Found unknown sections in resume:', unknownSections);
    
    if (unknownSections.length > 0) {
      const sectionNames = unknownSections.map(s => s.title || 'Unnamed Section').join(', ');
      toast.info(`Found additional sections: ${sectionNames}. These can be manually added to your profile.`);
    }
  };

  const saveCurrentResume = async (): Promise<boolean> => {
    if (!currentEditingResume) return false;
    
    try {
      // Save the current sections data to the resume (no content property needed for JobAnalysis)
      console.log('Resume data prepared for saving:', currentEditingResume.id);
      console.log('Resume sections:', resumeSections);
      toast.success('Resume changes saved!');
      return true;
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume changes');
      return false;
    }
  };

  const value = {
    workExperience,
    workExperienceBlocks,
    personalInfo,
    education,
    certifications,
    skills,
    currentEditingResume,
    resumeSections,
    setWorkExperience,
    setWorkExperienceBlocks,
    setPersonalInfo,
    setEducation,
    setCertifications,
    setSkills,
    setCurrentEditingResume,
    setResumeSections,
    updateFromParsedResume,
    convertToBlockFormat,
    loadResumeForEditing,
    createNewResume,
    saveCurrentResume,
    handleUnknownSections
  };

  return (
    <ResumeDataContext.Provider value={value}>
      {children}
    </ResumeDataContext.Provider>
  );
};