
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, User, BookOpen, Target, TrendingUp, Search, PlayCircle, Briefcase, Calendar, Activity, LogOut } from "lucide-react";
import chameleonLogo from "@/assets/chameleon-logo.png";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AchievementLogger from "@/components/AchievementLogger";
import ResumeVersions from "@/components/ResumeVersions";
import JobAnalyzer from "@/components/JobAnalyzer";
import UserSkills from "@/components/UserSkills";
import SkillsAssessment from "@/components/SkillsAssessment";
import ATSOptimizer from "@/components/ATSOptimizer";
import GettingStarted from "@/components/GettingStarted";
import WorkExperience from "@/components/WorkExperience";
import WeeklyDigest from "@/components/WeeklyDigest";
import InlineAchievementLogger from "@/components/InlineAchievementLogger";
import SocialProof from "@/components/SocialProof";
import { ResumeDataProvider } from "@/contexts/ResumeDataContext";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, session, loading, signOut } = useAuth();
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
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center p-1">
                  <img src={chameleonLogo} alt="Chameleon" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Chameleon</h1>
                  <p className="text-sm text-slate-600">Your Living Resume Companion</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-600">
                  Welcome, {user?.user_metadata?.display_name || user?.email}
                </span>
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 md:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 lg:w-auto h-auto p-1">
            <TabsTrigger value="dashboard" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Target className="w-4 h-4" />
              <span className="text-xs md:text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="getting-started" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <PlayCircle className="w-4 h-4" />
              <span className="text-xs md:text-sm">Get Started</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Plus className="w-4 h-4" />
              <span className="text-xs md:text-sm">Log Wins</span>
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <FileText className="w-4 h-4" />
              <span className="text-xs md:text-sm">Resumes</span>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Search className="w-4 h-4" />
              <span className="text-xs md:text-sm">Job Match</span>
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs md:text-sm">Skills</span>
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Briefcase className="w-4 h-4" />
              <span className="text-xs md:text-sm">Experience</span>
            </TabsTrigger>
            <TabsTrigger value="digest" className="flex items-center gap-1 md:gap-2 p-2 md:p-3 h-auto">
              <Calendar className="w-4 h-4" />
              <span className="text-xs md:text-sm">Digest</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4 md:space-y-6">
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

            {/* Social Proof */}
            <SocialProof />

            {/* Recently Logged Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5" />
                  <span>Recently Logged Achievements</span>
                </CardTitle>
                <CardDescription>Your latest career wins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">Led cross-functional team for Q4 product launch</p>
                      <p className="text-sm text-slate-600">2 hours ago • +3 ATS score impact</p>
                    </div>
                    <Badge variant="secondary" className="self-start md:self-center">Leadership</Badge>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">Completed AWS Solutions Architect certification</p>
                      <p className="text-sm text-slate-600">1 day ago • +5 ATS score impact</p>
                    </div>
                    <Badge variant="secondary" className="self-start md:self-center">Technical</Badge>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-slate-50 rounded-lg">
                    <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">Increased team productivity by implementing new workflow</p>
                      <p className="text-sm text-slate-600">3 days ago • +4 ATS score impact</p>
                    </div>
                    <Badge variant="secondary" className="self-start md:self-center">Process Improvement</Badge>
                  </div>
                </div>
                
                {/* Inline Achievement Logger */}
                <InlineAchievementLogger />
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
            <ResumeVersions />
          </TabsContent>

          <TabsContent value="jobs">
            <JobAnalyzer />
          </TabsContent>

          <TabsContent value="skills">
            <SkillsAssessment />
          </TabsContent>

          <TabsContent value="experience">
            <WorkExperience />
          </TabsContent>

          <TabsContent value="digest">
            <WeeklyDigest />
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </ResumeDataProvider>
  );
};

export default Index;
