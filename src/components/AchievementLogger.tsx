
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, MessageSquare, List } from "lucide-react";
import ChatAchievementLogger from "./ChatAchievementLogger";

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
  const [activeTab, setActiveTab] = useState("chat");

  // Mock achievements for the history view
  const achievements: Achievement[] = [
    {
      id: "1",
      title: "Led Q4 Product Launch",
      description: "Successfully coordinated cross-functional team of 12 members to deliver new feature ahead of schedule, resulting in 25% increase in user engagement.",
      category: "Leadership",
      impact: "25% increase in user engagement",
      date: "2024-12-15",
      tags: ["leadership", "product-management", "cross-functional"]
    },
    {
      id: "2",
      title: "Implemented CI/CD Pipeline",
      description: "Reduced deployment time by 60% and eliminated production bugs through automated testing and deployment processes.",
      category: "Technical",
      impact: "60% faster deployments, zero production bugs",
      date: "2024-12-10",
      tags: ["devops", "automation", "ci-cd"]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Log Your Wins</h2>
        <p className="text-slate-600">Capture your achievements through conversation or quick logging</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat Assistant
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Achievement History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-4">
          <ChatAchievementLogger />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievement Timeline</CardTitle>
              <CardDescription>
                {achievements.length} achievements logged • Ready for resume generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-1">{achievement.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(achievement.date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {achievement.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 mb-3">{achievement.description}</p>
                  
                  {achievement.impact && (
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">Impact: {achievement.impact}</span>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    {achievement.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AchievementLogger;
