import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WorkExperienceWithBlocks, BlockSection, Block, ResumeSection, DraggableBlock } from '@/types/blocks';
import type { ResumeVersion } from '@/hooks/useResumeVersions';
import { useResumes } from '@/hooks/useResumes';
import { useUserProfileData, type UserProfileData } from '@/hooks/useUserProfileData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrentRole: boolean;
  location?: string;
  skills: string[];
}

interface PersonalInfo {
  name: string;
  email: string;
  phone: string;
  location: string;
  linkedinUrl?: string;
  professionalSummary?: string;
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
  isLoading: boolean;
  setWorkExperience: (experience: WorkExperience[]) => void;
  setWorkExperienceBlocks: (experience: WorkExperienceWithBlocks[]) => void;
  setPersonalInfo: (info: PersonalInfo) => void;
  savePersonalInfo: (info: PersonalInfo) => Promise<void>;
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
  // Cache update functions
  updateWorkExperienceCache: (updatedExp: any) => void;
  addWorkExperienceCache: (newExp: any) => void;
  removeWorkExperienceCache: (expId: string) => void;
  updateEducationCache: (updatedEdu: any) => void;
  addEducationCache: (newEdu: any) => void;
  removeEducationCache: (eduId: string) => void;
  updateCertificationCache: (updatedCert: any) => void;
  addCertificationCache: (newCert: any) => void;
  removeCertificationCache: (certId: string) => void;
  invalidateUserData: () => void;
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
  const { user } = useAuth();
  // Use optimized single query for all user data
  const { 
    data: userProfileData, 
    isLoading: profileLoading,
    updateProfile,
    updateWorkExperience: updateWorkExp,
    addWorkExperience: addWorkExp,
    removeWorkExperience: removeWorkExp,
    updateEducation: updateEdu,
    addEducation: addEdu,
    removeEducation: removeEdu,
    updateCertification: updateCert,
    addCertification: addCert,
    removeCertification: removeCert,
    invalidateUserData
  } = useUserProfileData();
  
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>([]);
  const [workExperienceBlocks, setWorkExperienceBlocks] = useState<WorkExperienceWithBlocks[]>([]);
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo | null>(null);
  const [localEducation, setLocalEducation] = useState<Education[]>([]);
  const [localCertifications, setLocalCertifications] = useState<Certification[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentEditingResume, setCurrentEditingResume] = useState<ResumeVersion | null>(null);
  const [resumeSections, setResumeSections] = useState<ResumeSection[]>([]);

  // Listen for custom refresh events from tab switching
  useEffect(() => {
    const handleRefreshData = () => {
      invalidateUserData();
    };

    window.addEventListener('refreshUserData', handleRefreshData);
    return () => window.removeEventListener('refreshUserData', handleRefreshData);
  }, [invalidateUserData]);

  // Convert optimized user profile data to legacy format
  useEffect(() => {
    if (userProfileData) {
      // Convert work experiences
      if (userProfileData.work_experiences && userProfileData.work_experiences.length > 0) {
        const convertedExperiences: WorkExperience[] = userProfileData.work_experiences.map(exp => ({
          id: exp.id,
          company: exp.company_name || 'Unknown Company',
          position: exp.title,
          startDate: exp.start_date || '',
          endDate: exp.end_date || '',
          description: exp.description || '',
          isCurrentRole: exp.is_current || false,
          location: exp.location || '',
          skills: [] // Could be populated from related data if needed
        }));
        setWorkExperience(convertedExperiences);
      } else {
        setWorkExperience([]);
      }

      // Convert education
      if (userProfileData.education && userProfileData.education.length > 0) {
        const convertedEducation: Education[] = userProfileData.education.map(edu => ({
          id: edu.id,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.field_of_study || '',
          startDate: edu.start_date || '',
          endDate: edu.end_date || '',
          gpa: edu.gpa?.toString() || '',
          isCurrentlyEnrolled: edu.is_current || false
        }));
        setLocalEducation(convertedEducation);
      } else {
        setLocalEducation([]);
      }

      // Convert certifications
      if (userProfileData.certifications && userProfileData.certifications.length > 0) {
        const convertedCertifications: Certification[] = userProfileData.certifications.map(cert => ({
          id: cert.id,
          name: cert.name,
          issuer: cert.issuing_organization,
          issueDate: cert.issue_date || '',
          expiryDate: cert.expiration_date || '',
          credentialId: cert.credential_id || '',
          credentialUrl: cert.credential_url || '',
          doesNotExpire: !cert.expiration_date
        }));
        setLocalCertifications(convertedCertifications);
      } else {
        setLocalCertifications([]);
      }

      // Convert personal info from profile
      if (userProfileData.display_name || userProfileData.email) {
        setPersonalInfo({
          name: userProfileData.display_name || '',
          email: userProfileData.email || '',
          phone: userProfileData.phone || '',
          location: userProfileData.location || '',
          linkedinUrl: userProfileData.linkedin_url || '',
          professionalSummary: userProfileData.bio || ''
        });
      } else {
        setPersonalInfo(null);
      }

      // Convert skills
      if (userProfileData.user_skills && userProfileData.user_skills.length > 0) {
        const skillNames = userProfileData.user_skills.map(skill => skill.skill_name);
        setSkills(skillNames);
      } else {
        setSkills([]);
      }
    } else {
      // Clear all state when userProfileData is null/undefined
      setWorkExperience([]);
      setLocalEducation([]);
      setLocalCertifications([]);
      setSkills([]);
      setPersonalInfo(null);
    }
  }, [userProfileData]);

  // Convert to block format when work experiences change
  useEffect(() => {
    if (workExperience && workExperience.length > 0) {
      const blockExperiences = convertToBlockFormat(workExperience);
      setWorkExperienceBlocks(blockExperiences);
    }
  }, [workExperience]);

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
      
      setLocalEducation(convertedEducation);
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
      
      setLocalCertifications(convertedCertifications);
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
      
      // Create a single section with the complete experience description
      if (exp.description) {
        const experienceSection: BlockSection = {
          id: `section-experience-${exp.id}`,
          title: 'Experience Details',
          blocks: [{
            id: `block-experience-${exp.id}`,
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
        sections.push(experienceSection);
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
      // The actual saving is now handled by the individual components
      // using their respective database hooks. This function just confirms
      // that the current resume state is ready for use.
      console.log('Resume data prepared for saving:', currentEditingResume.id);
      console.log('Resume sections:', resumeSections);
      
      // All data is automatically saved by the component hooks
      toast.success('Resume data is synchronized with database!');
      return true;
    } catch (error) {
      console.error('Error confirming resume save:', error);
      toast.error('Failed to confirm resume save');
      return false;
    }
  };

  const savePersonalInfo = async (info: PersonalInfo) => {
    if (!updateProfile) return;

    try {
      await updateProfile({
        display_name: info.name,
        email: info.email,
        phone: info.phone,
        linkedin_url: info.linkedinUrl,
        bio: info.professionalSummary
      });
      
      // Update local state
      setPersonalInfo(info);
      
      toast.success('Personal information saved successfully!');
    } catch (error) {
      console.error('Error saving personal info:', error);
      toast.error('Failed to save personal information');
      throw error;
    }
  };

  const value = {
    workExperience,
    workExperienceBlocks,
    personalInfo,
    education: localEducation,
    certifications: localCertifications,
    skills,
    currentEditingResume,
    resumeSections,
    isLoading: profileLoading,
    setWorkExperience,
    setWorkExperienceBlocks,
    setPersonalInfo,
    savePersonalInfo,
    setEducation: setLocalEducation,
    setCertifications: setLocalCertifications,
    setSkills,
    setCurrentEditingResume,
    setResumeSections,
    updateFromParsedResume,
    convertToBlockFormat,
    loadResumeForEditing,
    createNewResume,
    saveCurrentResume,
    handleUnknownSections,
    // Cache update functions
    updateWorkExperienceCache: updateWorkExp,
    addWorkExperienceCache: addWorkExp,
    removeWorkExperienceCache: removeWorkExp,
    updateEducationCache: updateEdu,
    addEducationCache: addEdu,
    removeEducationCache: removeEdu,
    updateCertificationCache: updateCert,
    addCertificationCache: addCert,
    removeCertificationCache: removeCert,
    invalidateUserData
  };

  return (
    <ResumeDataContext.Provider value={value}>
      {children}
    </ResumeDataContext.Provider>
  );
};