
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, User, BookOpen, Target, TrendingUp, Search, PlayCircle, Scroll, Briefcase, Calendar, Activity } from "lucide-react";
import AchievementLogger from "@/components/AchievementLogger";
import ResumeVersions from "@/components/ResumeVersions";
import JobAnalyzer from "@/components/JobAnalyzer";
import SkillsAssessment from "@/components/SkillsAssessment";
import ATSOptimizer from "@/components/ATSOptimizer";
import GettingStarted from "@/components/GettingStarted";
import WorkExperience from "@/components/WorkExperience";
import WeeklyDigest from "@/components/WeeklyDigest";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  // Mock data for demonstration
  const weeklyStats = {
    achievementsLogged: 7,
    resumesGenerated: 2,
    skillsImproved: 3,
    atsScore: 85
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Scroll</h1>
                <p className="text-sm text-slate-600">Your Living Resume Companion</p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              <User className="w-4 h-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1 lg:w-auto">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="getting-started" className="flex items-center gap-2">
              <PlayCircle className="w-4 h-4" />
              Get Started
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Log Wins
            </TabsTrigger>
            <TabsTrigger value="resumes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Resumes
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Job Match
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="digest" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Digest
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Weekly Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Achievements</CardTitle>
                  <CardDescription className="text-slate-600">This week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{weeklyStats.achievementsLogged}</div>
                  <p className="text-sm text-slate-600 mt-1">Keep the momentum going!</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Resumes</CardTitle>
                  <CardDescription className="text-slate-600">Generated</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{weeklyStats.resumesGenerated}</div>
                  <p className="text-sm text-slate-600 mt-1">Tailored for success</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">Skills</CardTitle>
                  <CardDescription className="text-slate-600">Improved</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{weeklyStats.skillsImproved}</div>
                  <p className="text-sm text-slate-600 mt-1">Growing stronger</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-50 border-slate-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-slate-900">ATS Score</CardTitle>
                  <CardDescription className="text-slate-600">Average</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-slate-900">{weeklyStats.atsScore}%</div>
                  <Progress value={weeklyStats.atsScore} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest career developments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Led cross-functional team for Q4 product launch</p>
                    <p className="text-sm text-slate-600">2 hours ago • Achievement logged</p>
                  </div>
                  <Badge variant="secondary">Leadership</Badge>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Resume tailored for Senior PM role at TechCorp</p>
                    <p className="text-sm text-slate-600">1 day ago • Resume generated</p>
                  </div>
                  <Badge variant="outline">ATS: 92%</Badge>
                </div>
                <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="font-medium">Started AWS Solutions Architect prep course</p>
                    <p className="text-sm text-slate-600">3 days ago • Skill development</p>
                  </div>
                  <Badge variant="outline">In Progress</Badge>
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
  );
};

export default Index;
