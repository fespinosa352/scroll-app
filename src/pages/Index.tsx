
import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, User, BookOpen, Target, TrendingUp, Search, PlayCircle, Briefcase, Calendar, Activity, LogOut, Settings, GraduationCap, Award, Trophy, ChevronDown, Zap, Download, Copy } from "lucide-react";
import chameleonLogo from "@/assets/chameleon-logo.png";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AchievementLogger from "@/components/AchievementLogger";
import ResumeVersions from "@/components/ResumeVersions";
import ResumeBuilder from "@/components/ResumeBuilder";
import JobAnalyzer from "@/components/JobAnalyzer";
import UserSkills from "@/components/UserSkills";
import SkillsAssessment from "@/components/SkillsAssessment";
import ATSOptimizer from "@/components/ATSOptimizer";
import GettingStarted from "@/components/GettingStarted";
import WorkExperience from "@/components/WorkExperience";
import WorkExperienceSimple from "@/components/WorkExperienceSimple";
import MyResume from "@/components/MyResume";
import { HybridResumeEditor } from "@/components/HybridResumeEditor";
import { exportResume, type ExportableResume } from "@/utils/resumeExport";
import { useMarkupConverter } from "@/hooks/useMarkupConverter";

import SocialProof from "@/components/SocialProof";
import Education from "@/components/Education";
import Certifications from "@/components/Certifications";
import { ResumeDataProvider, useResumeData } from "@/contexts/ResumeDataContext";

// Component to handle resume editing state within the context
const ResumeContent: React.FC<{ isEditingResume: boolean; setIsEditingResume: (editing: boolean) => void }> = ({ 
  isEditingResume, 
  setIsEditingResume 
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
          onEditResume={() => setIsEditingResume(true)} 
          onCreateNew={handleCreateNew}
        />
      )}
    </>
  );
};

// Component to handle HybridResumeEditor with resume data
const HybridResumeContent: React.FC = () => {
  const { 
    workExperience, 
    personalInfo, 
    education, 
    certifications, 
    skills 
  } = useResumeData();
  
  const { convertMarkupToStructured } = useMarkupConverter();
  const [initialMarkup, setInitialMarkup] = useState('');

  // Convert structured resume data to markup format
  const convertToMarkup = useCallback(() => {
    let markup = '';
    
    // Header with personal info
    if (personalInfo?.name) {
      markup += `# ${personalInfo.name}\n\n`;
      if (personalInfo.email) markup += `${personalInfo.email}\n`;
      if (personalInfo.phone) markup += `${personalInfo.phone}\n`;
      if (personalInfo.location) markup += `${personalInfo.location}\n`;
      markup += '\n';
    } else {
      markup += `# Your Name\n\nyour.email@example.com\n(555) 123-4567\nYour City, State\n\n`;
    }

    // Professional Experience
    if (workExperience.length > 0) {
      markup += '## Professional Experience\n\n';
      
      workExperience.forEach(exp => {
        markup += `### ${exp.position}\n`;
        markup += `**${exp.company}**\n`;
        if (exp.startDate || exp.endDate) {
          const endDate = exp.isCurrentRole ? 'Present' : exp.endDate;
          markup += `*${exp.startDate} - ${endDate}*\n`;
        }
        if (exp.location) {
          markup += `*${exp.location}*\n`;
        }
        markup += '\n';
        
        if (exp.description) {
          // Split description by bullet points and clean them
          const bullets = exp.description
            .split(/\n•\s*|\n-\s*|\n\*\s*/)
            .map(bullet => bullet.replace(/^•\s*|^-\s*|^\*\s*/, '').trim())
            .filter(bullet => bullet.length > 0);
            
          bullets.forEach(bullet => {
            markup += `- ${bullet}\n`;
          });
        }
        markup += '\n';
      });
    }

    // Education
    if (education.length > 0) {
      markup += '## Education\n\n';
      
      education.forEach(edu => {
        markup += `### ${edu.degree}`;
        if (edu.fieldOfStudy) markup += ` in ${edu.fieldOfStudy}`;
        markup += '\n';
        markup += `**${edu.institution}**\n`;
        if (edu.startDate || edu.endDate) {
          const endDate = edu.isCurrentlyEnrolled ? 'Present' : edu.endDate;
          markup += `*${edu.startDate} - ${endDate}*\n`;
        }
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
- Highlight relevant skills`;
  }, [workExperience, personalInfo, education, certifications, skills]);

  // Update markup when resume data changes
  useEffect(() => {
    setInitialMarkup(convertToMarkup());
  }, [workExperience, personalInfo, education, certifications, skills, convertToMarkup]);

  return (
    <HybridResumeEditor 
      key={initialMarkup} // Force re-render when data changes
      initialContent={initialMarkup}
      onSave={(markup, structured) => {
        console.log('Saving resume:', { markup, structured });
        // TODO: Integrate with existing save functionality
      }}
      onExport={async (format) => {
        // Convert current markup to structured data for export
        const currentStructuredData = convertMarkupToStructured(initialMarkup);
        
        const exportableResume: ExportableResume = {
          name: personalInfo?.name || 'My Resume',
          content: currentStructuredData,
          ats_score: undefined, // Will be filled when ATS analysis is available
          created_at: new Date().toISOString()
        };
        
        if (format === 'copy') {
          const success = await exportResume(exportableResume, format);
          // Add toast notification here if needed
        } else {
          exportResume(exportableResume, format);
        }
      }}
    />
  );
};

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingResume, setIsEditingResume] = useState(false);
  const { user, session, loading, signOut } = useAuth();
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
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

  // Listen for navigation events from components
  useEffect(() => {
    const handleNavigateToResumeVault = () => {
      setActiveTab('resume-vault');
    };

    window.addEventListener('navigateToResumeVault', handleNavigateToResumeVault);
    return () => {
      window.removeEventListener('navigateToResumeVault', handleNavigateToResumeVault);
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

  if (!session) {
    return null; // Will redirect to auth
  }

  // Mock data for demonstration
  const weeklyStats = {
    achievementsLogged: 7,
    resumesGenerated: 2,
    skillsImproved: 3,
    atsScore: 85
  };

  return (
    <ResumeDataProvider>
      <div className="min-h-screen bg-slate-50">
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1 lg:w-auto h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Target className="w-4 h-4" />
              <span className="text-xs md:text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="getting-started" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <PlayCircle className="w-4 h-4" />
              <span className="text-xs md:text-sm">Get Started</span>
            </TabsTrigger>
            <TabsTrigger value="my-resume" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <User className="w-4 h-4" />
              <span className="text-xs md:text-sm">My Resume</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Search className="w-4 h-4" />
              <span className="text-xs md:text-sm">Analyze & Optimize</span>
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <FileText className="w-4 h-4" />
              <span className="text-xs md:text-sm">Resume Vault</span>
            </TabsTrigger>
            <TabsTrigger value="hybrid-editor" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Zap className="w-4 h-4" />
              <span className="text-xs md:text-sm">Hybrid Editor</span>
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
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Next Action Card - Primary Focus */}
            <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-blue-200">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-start space-y-4 md:space-y-0 md:space-x-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3">Your Next Recommended Action</h2>
                    <p className="text-base md:text-lg text-slate-700 mb-6">
                      Upload a job description to get your personalized ATS optimization score and tailored resume suggestions.
                    </p>
                    <Button 
                      variant="primary-lg" 
                      className="w-full md:w-auto"
                      onClick={() => handleTabChange("jobs")}
                    >
                      <Search className="w-5 h-5 mr-2" />
                      Analyze a Job Posting
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="getting-started">
            <GettingStarted onComplete={() => handleTabChange("my-resume")} />
          </TabsContent>

          <TabsContent value="achievements">
            <AchievementLogger />
          </TabsContent>

          <TabsContent value="resumes">
            <ResumeContent 
              isEditingResume={isEditingResume}
              setIsEditingResume={setIsEditingResume}
            />
          </TabsContent>

          <TabsContent value="jobs">
            <JobAnalyzer />
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

          <TabsContent value="hybrid-editor">
            <HybridResumeContent />
          </TabsContent>

        </Tabs>
        </div>
      </div>
    </ResumeDataProvider>
  );
};

export default Index;
