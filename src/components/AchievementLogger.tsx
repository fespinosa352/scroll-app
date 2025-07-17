
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, MessageSquare, List, Trophy, Building2 } from "lucide-react";
import ChatAchievementLogger from "./ChatAchievementLogger";
import WinLogger from "./WinLogger";
import { useProjects } from "@/hooks/useProjects";

interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  impact: string;
  date: string;
  tags: string[];
}

const AchievementLogger = () => {
  const [activeTab, setActiveTab] = useState("quick-win");
  const { projects, loading: projectsLoading, refreshProjects } = useProjects();

  const handleWinSuccess = () => {
    refreshProjects();
    setActiveTab("history");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Log Your Wins</h2>
        <p className="text-slate-600">Capture your achievements through conversation or quick logging</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick-win" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Quick Win
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat Assistant
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Achievement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick-win" className="space-y-4">
          <WinLogger 
            onCancel={() => setActiveTab("history")}
            onSuccess={handleWinSuccess}
          />
        </TabsContent>

        <TabsContent value="chat" className="space-y-4">
          <ChatAchievementLogger />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievement Timeline</CardTitle>
              <CardDescription>
                {projectsLoading ? 'Loading...' : `${projects.length} achievements logged • Ready for resume generation`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projectsLoading ? (
                <div className="text-center py-8 text-slate-500">Loading achievements...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No achievements logged yet. Click "Quick Win" to add your first achievement!
                </div>
              ) : (
                projects.map((project) => (
                  <div key={project.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {project.title.replace('Win - ', '')}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {project.start_date ? new Date(project.start_date).toLocaleDateString() : 'No date'}
                          </span>
                          {project.work_experiences && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {project.work_experiences.company_name || 'Unknown Company'}
                            </span>
                          )}
                          <Badge variant="outline" className="text-xs">
                            Win
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-slate-700 mb-3">{project.description}</p>
                    
                    {project.impact_metrics && (
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Impact: {project.impact_metrics}</span>
                      </div>
                    )}
                    
                    {project.technologies_used && project.technologies_used.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies_used.map((tech, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementLogger;
