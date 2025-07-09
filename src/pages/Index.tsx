
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, User, BookOpen, Target, TrendingUp, Search, PlayCircle, Briefcase, Calendar, Activity, LogOut, Settings, GraduationCap, Award, Trophy, ChevronDown } from "lucide-react";
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
import WorkExperienceBlocks from "@/components/WorkExperienceBlocks";
import MyResume from "@/components/MyResume";

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

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isEditingResume, setIsEditingResume] = useState(false);
  const { user, session, loading, signOut } = useAuth();
  const { getFirstName } = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate('/auth');
    }
  }, [loading, session, navigate]);

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 gap-1 lg:w-auto h-auto p-1">
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
              <span className="text-xs md:text-sm">Job Match</span>
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <FileText className="w-4 h-4" />
              <span className="text-xs md:text-sm">Resume Vault</span>
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
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab("achievements")}
                  >
                    <Trophy className="w-6 h-6" />
                    <span className="text-sm">+ Log Wins</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab("experience")}
                  >
                    <Briefcase className="w-6 h-6" />
                    <span className="text-sm">+ Experience</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab("education")}
                  >
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-sm">+ Education</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                    onClick={() => setActiveTab("certifications")}
                  >
                    <Award className="w-6 h-6" />
                    <span className="text-sm">+ Certifications</span>
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
                      onClick={() => setActiveTab("jobs")}
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
            <GettingStarted onComplete={() => setActiveTab("my-resume")} />
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
            <WorkExperienceBlocks />
          </TabsContent>

          <TabsContent value="education">
            <Education />
          </TabsContent>

          <TabsContent value="certifications">
            <Certifications />
          </TabsContent>

          <TabsContent value="my-resume">
            <MyResume />
          </TabsContent>

        </Tabs>
        </div>
      </div>
    </ResumeDataProvider>
  );
};

export default Index;
