import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, Target, CheckCircle, ArrowRight, Sparkles, FileText, User, MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface WeeklyStats {
  weekOf: string;
  achievementsLogged: number;
  skillsImproved: number;
  resumesGenerated: number;
  jobsAnalyzed: number;
  completionRate: number;
}

interface WeeklyGoal {
  id: string;
  title: string;
  completed: boolean;
  category: "achievement" | "skill" | "resume" | "job";
}

const WeeklyDigest = () => {
  const [currentWeek] = useState<WeeklyStats>({
    weekOf: "December 23, 2024",
    achievementsLogged: 3,
    skillsImproved: 2,
    resumesGenerated: 1,
    jobsAnalyzed: 4,
    completionRate: 75
  });

  const [weeklyGoals] = useState<WeeklyGoal[]>([
    { id: "1", title: "Log 5 new achievements", completed: false, category: "achievement" },
    { id: "2", title: "Update technical skills section", completed: true, category: "skill" },
    { id: "3", title: "Generate resume for PM role", completed: true, category: "resume" },
    { id: "4", title: "Analyze 3 target job descriptions", completed: false, category: "job" }
  ]);

  const [recentHighlights] = useState([
    {
      type: "achievement",
      title: "Led Q4 product launch resulting in 40% user growth",
      date: "2 days ago",
      impact: "High Impact"
    },
    {
      type: "skill",
      title: "Completed Advanced SQL certification",
      date: "4 days ago",
      impact: "Skill Gap Closed"
    },
    {
      type: "resume",
      title: "Generated tailored resume for Senior PM at TechFlow",
      date: "5 days ago",
      impact: "92% ATS Score"
    }
  ]);

  const handleUpdateResume = () => {
    toast.success("Redirecting to Log Wins to update your achievements...");
    // In a real app, this would navigate to the achievements tab
  };

  const handleRequestTextUpdates = () => {
    toast.success("Text message notifications enabled! You'll receive weekly prompts.");
  };

  const completedGoals = weeklyGoals.filter(goal => goal.completed).length;
  const goalCompletionRate = (completedGoals / weeklyGoals.length) * 100;

  return (
    <div className="space-y-6">
      {/* Weekly Overview */}
      <Card className="bg-gradient-to-br from-blue-50 to-emerald-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Digest
          </CardTitle>
          <CardDescription>
            Week of {currentWeek.weekOf} • Your career growth at a glance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentWeek.achievementsLogged}</div>
              <div className="text-sm text-slate-600">Achievements</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">{currentWeek.skillsImproved}</div>
              <div className="text-sm text-slate-600">Skills Updated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{currentWeek.resumesGenerated}</div>
              <div className="text-sm text-slate-600">Resumes Generated</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{currentWeek.jobsAnalyzed}</div>
              <div className="text-sm text-slate-600">Jobs Analyzed</div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-medium text-slate-700 mb-2">
              Week Completion: {currentWeek.completionRate}%
            </div>
            <Progress value={currentWeek.completionRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Weekly Goals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Weekly Goals
          </CardTitle>
          <CardDescription>
            {completedGoals} of {weeklyGoals.length} goals completed ({goalCompletionRate.toFixed(0)}%)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {weeklyGoals.map((goal) => (
              <div key={goal.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle 
                    className={`w-5 h-5 ${
                      goal.completed ? 'text-green-500' : 'text-slate-300'
                    }`} 
                  />
                  <span className={goal.completed ? 'line-through text-slate-500' : 'text-slate-700'}>
                    {goal.title}
                  </span>
                </div>
                <Badge 
                  variant={goal.completed ? "default" : "outline"}
                  className={
                    goal.category === 'achievement' ? 'bg-blue-100 text-blue-700' :
                    goal.category === 'skill' ? 'bg-purple-100 text-purple-700' :
                    goal.category === 'resume' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-orange-100 text-orange-700'
                  }
                >
                  {goal.category}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Highlights Reel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            This Week's Highlights
          </CardTitle>
          <CardDescription>
            Your career growth moments that deserve recognition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentHighlights.map((highlight, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg border-l-4 border-blue-400">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 mb-1">{highlight.title}</h4>
                  <p className="text-sm text-slate-600">{highlight.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-white">
                    {highlight.impact}
                  </Badge>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Keep Growing
            </CardTitle>
            <CardDescription>
              Don't let your momentum slow down
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              You're on track for a great week! Add more achievements to make your resume stand out.
            </p>
            <Button 
              onClick={handleUpdateResume}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Update My Resume Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Stay Connected
            </CardTitle>
            <CardDescription>
              Get weekly reminders via text message
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">
              Enable text notifications to receive weekly prompts and submit updates on the go.
            </p>
            <Button 
              onClick={handleRequestTextUpdates}
              variant="outline"
              className="w-full"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Enable Text Updates
            </Button>
            <p className="text-xs text-slate-500">
              Requires backend integration • Coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Insights */}
      <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Weekly Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="p-3 bg-white/80 rounded-lg border">
              <h4 className="font-medium text-purple-900 mb-1">💡 Career Tip</h4>
              <p className="text-sm text-slate-700">
                Your Q4 product launch achievement is a strong differentiator. Consider quantifying the impact further with specific metrics.
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-lg border">
              <h4 className="font-medium text-purple-900 mb-1">🎯 Focus Area</h4>
              <p className="text-sm text-slate-700">
                You're missing ML skills for your target roles. Consider adding relevant courses or projects to bridge this gap.
              </p>
            </div>
            <div className="p-3 bg-white/80 rounded-lg border">
              <h4 className="font-medium text-purple-900 mb-1">📈 Progress</h4>
              <p className="text-sm text-slate-700">
                Your ATS scores have improved by 15% this month. Keep updating your resume with fresh achievements!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklyDigest;