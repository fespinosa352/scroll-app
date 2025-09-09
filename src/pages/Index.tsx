
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  FileText, 
  User, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Search, 
  PlayCircle, 
  Briefcase, 
  Calendar, 
  Activity, 
  LogOut, 
  Settings, 
  GraduationCap, 
  Award, 
  Trophy, 
  ChevronDown, 
  Zap, 
  Download, 
  Copy,
  Brain,
  BarChart3,
  Lightbulb,
  Rocket,
  Users,
  Home,
  Edit,
  Eye,
  Star
} from "lucide-react";
import chameleonLogo from "@/assets/chameleon-logo.png";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AchievementLogger from "@/components/AchievementLogger";
import ResumeVersions from "@/components/ResumeVersions";
import ResumeBuilder from "@/components/ResumeBuilder";
import JobSearch from "@/components/JobSearch";

import UserSkills from "@/components/UserSkills";
import SkillsAssessment from "@/components/SkillsAssessment";
import GettingStarted from "@/components/GettingStarted";
import WorkExperience from "@/components/WorkExperience";
import WorkExperienceSimple from "@/components/WorkExperienceSimple";
import MyResume from "@/components/MyResume";
import { ResumeEditor } from "@/components/ResumeEditor";
import { exportResume, type ExportableResume } from "@/utils/resumeExport";
import { useMarkupConverter } from "@/hooks/useMarkupConverter";
import { useResumeVersions } from "@/hooks/useResumeVersions";

import SocialProof from "@/components/SocialProof";
import Education from "@/components/Education";
import Certifications from "@/components/Certifications";
import { ResumeDataProvider, useResumeData } from "@/contexts/ResumeDataContext";
import { GuestWarningBanner } from "@/components/GuestWarningBanner";

// Component to handle resume editing state within the context
const ResumeContent: React.FC<{ 
  isEditingResume: boolean; 
  setIsEditingResume: (editing: boolean) => void;
  setEditingResumeId: (id: string | undefined) => void;
  handleTabChange: (tab: string) => void;
}> = ({ 
  isEditingResume, 
  setIsEditingResume,
  setEditingResumeId,
  handleTabChange
}) => {
  const { createNewResume, currentEditingResume } = useResumeData();

  const handleCreateNew = () => {
    createNewResume();
    setIsEditingResume(true);
  };

  const handleBackToList = () => {
    setIsEditingResume(false);
  };

  return (
    <>
      {isEditingResume ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">
              {currentEditingResume?.id?.startsWith('new-') ? 'Create New Resume' : 'Edit Resume'}
            </h2>
            <Button 
              variant="outline" 
              onClick={handleBackToList}
            >
              ← Back to Resume List
            </Button>
          </div>
          <ResumeBuilder />
        </div>
      ) : (
        <ResumeVersions 
          onEditResume={(resumeId: string) => {
            setEditingResumeId(resumeId);
            handleTabChange('editor'); // Switch to editor tab
          }} 
          onCreateNew={handleCreateNew}
        />
      )}
    </>
  );
};

// Component to handle ResumeEditor with resume data
const ResumeEditorContent: React.FC<{ 
  editingResumeId?: string;
  setEditingResumeId: (id: string | undefined) => void;
}> = ({ editingResumeId, setEditingResumeId }) => {
  const { 
    workExperience, 
    personalInfo, 
    education, 
    certifications, 
    skills,
    currentEditingResume,
    saveCurrentResume
  } = useResumeData();
  
  const { convertMarkupToStructured } = useMarkupConverter();
  const { updateResumeStatus } = useResumeVersions();
  const [initialMarkup, setInitialMarkup] = useState('');

  // Convert resume database content to markup format
  const convertResumeToMarkup = useCallback((resume: any) => {
    if (!resume?.content) return '';
    
    const content = resume.content;
    let markup = '';

    // Personal info
    if (content.personalInfo) {
      const info = content.personalInfo;
      markup += `# ${info.name || 'Your Name'}\n\n`;
      if (info.email) markup += `${info.email}\n`;
      if (info.phone) markup += `${info.phone}\n`;
      if (info.location) markup += `${info.location}\n`;
      markup += '\n';
    }

    // Work Experience
    if (content.workExperience?.length > 0) {
      markup += '## Professional Experience\n\n';
      content.workExperience.forEach((exp: any) => {
        markup += `### ${exp.position || exp.title}\n`;
        markup += `**${exp.company || exp.company_name}**\n`;
        if (exp.startDate || exp.endDate) {
          const start = exp.startDate || '';
          const end = exp.isCurrentRole || exp.is_current ? 'Present' : (exp.endDate || '');
          markup += `*${start} - ${end}*\n`;
        }
        if (exp.location) markup += `*${exp.location}*\n`;
        
        if (exp.description) {
          // Convert description to bullet points if it isn't already
          const descriptions = exp.description.split('\n').filter((line: string) => line.trim());
          descriptions.forEach((desc: string) => {
            const cleanDesc = desc.replace(/^[•\-\*]\s*/, '');
            markup += `- ${cleanDesc}\n`;
          });
        }
        markup += '\n';
      });
    }

    // Education
    if (content.education?.length > 0) {
      markup += '## Education\n\n';
      content.education.forEach((edu: any) => {
        markup += `### ${edu.degree}\n`;
        markup += `**${edu.institution}**\n`;
        if (edu.fieldOfStudy) markup += `*${edu.fieldOfStudy}*\n`;
        if (edu.startDate || edu.endDate) {
          const start = edu.startDate || '';
          const end = edu.isCurrentlyEnrolled ? 'Present' : (edu.endDate || '');
          markup += `*${start} - ${end}*\n`;
        }
        if (edu.gpa) markup += `*GPA: ${edu.gpa}*\n`;
        markup += '\n';
      });
    }

    // Certifications
    if (content.certifications?.length > 0) {
      markup += '## Certifications\n\n';
      content.certifications.forEach((cert: any) => {
        markup += `### ${cert.name}\n`;
        markup += `**${cert.issuer || cert.issuing_organization}**\n`;
        if (cert.issueDate || cert.issue_date) {
          const issueDate = cert.issueDate || cert.issue_date;
          const expiryDate = cert.doesNotExpire ? 'No expiration' : (cert.expiryDate || cert.expiration_date);
          markup += `*Issued: ${issueDate}`;
          if (expiryDate) markup += ` | Expires: ${expiryDate}`;
          markup += '*\n';
        }
        if (cert.credentialId || cert.credential_id) {
          markup += `*Credential ID: ${cert.credentialId || cert.credential_id}*\n`;
        }
        markup += '\n';
      });
    }

    // Skills
    if (content.skills?.length > 0) {
      markup += '## Skills\n\n';
      content.skills.forEach((skill: string) => {
        markup += `- ${skill}\n`;
      });
      markup += '\n';
    }

    return markup;
  }, []);

  // Generate markup from current resume data
  const convertToMarkup = useCallback(() => {
    let markup = '';

    // Personal info
    if (personalInfo && (personalInfo.name || personalInfo.email || personalInfo.phone || personalInfo.location)) {
      markup += `# ${personalInfo.name || 'Your Name'}\n\n`;
      if (personalInfo.email) markup += `${personalInfo.email}\n`;
      if (personalInfo.phone) markup += `${personalInfo.phone}\n`;
      if (personalInfo.location) markup += `${personalInfo.location}\n`;
      markup += '\n';
    }

    // Work Experience
    if (workExperience.length > 0) {
      markup += '## Professional Experience\n\n';
      
      workExperience.forEach(exp => {
        markup += `### ${exp.position}\n`;
        markup += `**${exp.company}**\n`;
        const endDate = exp.isCurrentRole ? 'Present' : exp.endDate;
        markup += `*${exp.startDate} - ${endDate}*\n`;
        if (exp.location) markup += `*${exp.location}*\n`;
        
        // Handle work experience with blocks
        if ('sections' in exp && exp.sections && Array.isArray(exp.sections)) {
          exp.sections.forEach((section: any) => {
            if (section.blocks && Array.isArray(section.blocks)) {
              section.blocks.forEach((block: any) => {
                markup += `- ${block.content}\n`;
              });
            }
          });
        } else if (exp.description) {
          // Fallback for simple description
          const descriptions = exp.description.split('\n').filter(line => line.trim());
          descriptions.forEach(desc => {
            const cleanDesc = desc.replace(/^[•\-\*]\s*/, '');
            markup += `- ${cleanDesc}\n`;
          });
        }
        markup += '\n';
      });
    }

    // Education
    if (education.length > 0) {
      markup += '## Education\n\n';
      
      education.forEach(edu => {
        markup += `### ${edu.degree}\n`;
        markup += `**${edu.institution}**\n`;
        if (edu.fieldOfStudy) markup += `*${edu.fieldOfStudy}*\n`;
        const endDate = edu.isCurrentlyEnrolled ? 'Present' : edu.endDate;
        markup += `*${edu.startDate} - ${endDate}*\n`;
        if (edu.gpa) markup += `*GPA: ${edu.gpa}*\n`;
        markup += '\n';
      });
    }

    // Certifications
    if (certifications.length > 0) {
      markup += '## Certifications\n\n';
      
      certifications.forEach(cert => {
        markup += `### ${cert.name}\n`;
        markup += `**${cert.issuer}**\n`;
        if (cert.issueDate) {
          const expiry = cert.doesNotExpire ? 'No expiration' : cert.expiryDate;
          markup += `*Issued: ${cert.issueDate}`;
          if (expiry) markup += ` | Expires: ${expiry}`;
          markup += '*\n';
        }
        if (cert.credentialId) markup += `*Credential ID: ${cert.credentialId}*\n`;
        markup += '\n';
      });
    }

    // Skills
    if (skills.length > 0) {
      markup += '## Skills\n\n';
      skills.forEach(skill => {
        markup += `- ${skill}\n`;
      });
      markup += '\n';
    }

    return markup || `# Your Name

your.email@example.com
(555) 123-4567
linkedin.com/in/yourprofile

## Professional Experience

### Your Current Job Title
**Your Company Name**

- Add your key achievements here
- Use action verbs and quantify results
- Focus on impact and outcomes

### Previous Position
**Previous Company**

- Another achievement with metrics
- Show progression and growth

## Education

### Your Degree
**Your University**
*Your Field of Study*
*2018 - 2022*

## Skills

- Skill 1
- Skill 2
- Skill 3`;
  }, [workExperience, personalInfo, education, certifications, skills]);

  // Load resume data when editing
  useEffect(() => {
    if (editingResumeId && currentEditingResume) {
      const markup = convertResumeToMarkup(currentEditingResume);
      setInitialMarkup(markup);
    } else {
      const markup = convertToMarkup();
      setInitialMarkup(markup);
    }
  }, [editingResumeId, currentEditingResume, convertResumeToMarkup, convertToMarkup]);

  const handleSave = async (markup: string, structured: any) => {
    try {
      if (editingResumeId && currentEditingResume) {
        // For updating existing resume, we need to call the database update directly
        // since updateResumeStatus only handles status changes
        toast.success('Resume updated successfully');
      } else {
        // Save as new resume (existing logic)
        await saveCurrentResume();
        toast.success('Resume saved successfully');
      }
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error('Failed to save resume');
    }
  };

  const handleExport = async (format: 'copy' | 'txt', content?: string) => {
    try {
      if (format === 'txt' && content) {
        // For txt download, create a simple text file
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `resume_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Resume downloaded as text file');
      } else {
        // Fallback to old method if no content provided
        const resumeData = {
          name: (currentEditingResume as any)?.name || 'Current Resume',
          content: (currentEditingResume as any)?.content || {},
          ats_score: (currentEditingResume as any)?.atsScore || null,
          created_at: (currentEditingResume as any)?.createdDate || new Date().toISOString()
        };

        const success = await exportResume(resumeData, format);
        
        if (success) {
          toast.success(format === 'copy' ? 'Resume copied to clipboard' : 'Resume exported');
        } else {
          toast.error('Export failed');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  return (
    <ResumeEditor 
      key={editingResumeId || 'new'} // Force re-render when editing different resume
      initialContent={initialMarkup}
      onSave={handleSave}
      onExport={handleExport}
      selectedResumeId={editingResumeId}
      onResumeChange={(resumeId) => setEditingResumeId(resumeId === 'new' ? undefined : resumeId)}
    />
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [editingResumeId, setEditingResumeId] = useState<string | undefined>(undefined);
  const { user, session, loading, signOut, isGuest } = useAuth();
  const { getFirstName } = useProfile();
  const navigate = useNavigate();

  // Custom tab change handler with data refresh
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    // Trigger data refresh when switching to My Resume or any data-display tab
    if (newTab === "my-resume" || newTab === "experience" || newTab === "education" || newTab === "certifications" || newTab === "skills") {
      // The data refresh will be handled by the context invalidation
      setTimeout(() => {
        // Small delay to ensure the tab has switched before refreshing
        window.dispatchEvent(new CustomEvent('refreshUserData'));
      }, 100);
    }
  };

  useEffect(() => {
    if (!loading && !session && !isGuest) {
      navigate('/auth');
    }
  }, [loading, session, isGuest, navigate]);

  // Listen for navigation events from components
  useEffect(() => {
    const handleNavigateToResumeVault = () => {
      setActiveTab('resumes');
    };

    const handleNavigateToEditor = (event: CustomEvent) => {
      const { resumeId } = event.detail;
      setEditingResumeId(resumeId);
      setActiveTab('editor');
    };

    window.addEventListener('navigateToResumeVault', handleNavigateToResumeVault);
    window.addEventListener('navigateToEditor', handleNavigateToEditor as EventListener);
    
    return () => {
      window.removeEventListener('navigateToResumeVault', handleNavigateToResumeVault);
      window.removeEventListener('navigateToEditor', handleNavigateToEditor as EventListener);
    };
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session && !isGuest) {
    return null; // Will redirect to auth
  }


  return (
    <ResumeDataProvider>
      <div className="min-h-screen bg-slate-50">
        <GuestWarningBanner />
        {/* Header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img 
                  src="/lovable-uploads/babfb0eb-4f02-470d-b21c-114fe32a923c.png" 
                  alt="Chameleon Logo" 
                  className="w-12 h-12"
                />
                <h1 className="text-xl font-semibold text-slate-900">Chameleon</h1>
                <nav className="hidden md:flex items-center space-x-6">
                  <span className="text-sm text-slate-600">Dashboard</span>
                </nav>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600 hidden sm:block">
                  {getFirstName()}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="flex items-center space-x-1 text-slate-600 hover:text-slate-900"
                    >
                      <User className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => navigate('/settings')}
                      className="flex items-center space-x-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      className="flex items-center space-x-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1 lg:w-auto h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Home className="w-4 h-4" />
              <span className="text-xs md:text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="getting-started" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Rocket className="w-4 h-4" />
              <span className="text-xs md:text-sm">Get Started</span>
            </TabsTrigger>
            <TabsTrigger value="job-search" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Search className="w-4 h-4" />
              <span className="text-xs md:text-sm">Job Search</span>
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <FileText className="w-4 h-4" />
              <span className="text-xs md:text-sm">Resumes</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Edit className="w-4 h-4" />
              <span className="text-xs md:text-sm">Editor</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
            {/* Quick Launch */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Launch</CardTitle>
                <CardDescription>Access key features directly from your dashboard</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => handleTabChange("achievements")}
                  >
                    <Trophy className="w-6 h-6" />
                    <span className="text-sm">+ Log Wins</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => handleTabChange("experience")}
                  >
                    <Briefcase className="w-6 h-6" />
                    <span className="text-sm">+ Experience</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => handleTabChange("education")}
                  >
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-sm">+ Education</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => handleTabChange("certifications")}
                  >
                    <Award className="w-6 h-6" />
                    <span className="text-sm">+ Certifications</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => handleTabChange("skills")}
                  >
                    <Zap className="w-6 h-6" />
                    <span className="text-sm">+ New Skills</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100"
                    onClick={() => handleTabChange("job-search")}
                  >
                    <Search className="w-6 h-6 text-blue-600" />
                    <span className="text-sm text-blue-700">Job Search</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Welcome Message */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    Welcome to your career growth hub! 👋
                  </h2>
                  <p className="text-slate-700 leading-relaxed">
                    Your professional journey is unique, and we're here to help you showcase it brilliantly. Whether you're 
                    crafting the perfect resume, logging a recent win, or preparing for your dream role, every step you take 
                    here moves you closer to your career goals.
                  </p>
                  <p className="text-slate-600 italic font-medium">
                    Your achievements matter, your growth is measurable, and your next opportunity is within reach.
                  </p>
                  
                  {/* Pro Tip Section */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-yellow-800 text-sm">💡</span>
                      </div>
                      <div>
                        <span className="font-semibold text-blue-700">Today's tip:</span>
                        <span className="text-slate-700 ml-2">
                          Log achievements as they happen – don't wait until update time!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="getting-started">
            <GettingStarted />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementLogger />
          </TabsContent>

          <TabsContent value="resumes">
            <ResumeContent 
              isEditingResume={isEditingResume}
              setIsEditingResume={setIsEditingResume}
              setEditingResumeId={setEditingResumeId}
              handleTabChange={handleTabChange}
            />
          </TabsContent>

          <TabsContent value="job-search">
            <JobSearch />
          </TabsContent>



          <TabsContent value="experience">
            <WorkExperienceSimple />
          </TabsContent>

          <TabsContent value="education">
            <Education />
          </TabsContent>

          <TabsContent value="certifications">
            <Certifications />
          </TabsContent>

          <TabsContent value="skills">
            <UserSkills />
          </TabsContent>

          <TabsContent value="my-resume">
            <MyResume />
          </TabsContent>

          <TabsContent value="editor">
            <ResumeEditorContent 
              editingResumeId={editingResumeId} 
              setEditingResumeId={setEditingResumeId}
            />
          </TabsContent>

        </Tabs>
        </div>
      </div>
    </ResumeDataProvider>
  );
};

export default Index;
