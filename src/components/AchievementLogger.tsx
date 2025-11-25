import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Target, List, Trophy } from "lucide-react";
import WinLogger from "./WinLogger";
import { useAchievements } from "@/hooks/useAchievements";
import { formatDateForDisplay } from "@/lib/dateUtils";

const AchievementLogger = () => {
  const [activeTab, setActiveTab] = useState("quick-win");
  const { achievements, loading, fetchAchievements } = useAchievements();

  const handleWinSuccess = () => {
    fetchAchievements();
    setActiveTab("history");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Log Your Wins</h2>
        <p className="text-slate-600">Capture your achievements through conversation or quick logging</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick-win" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Quick Win
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

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievement Timeline</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${achievements.length} achievements logged • Ready for resume generation`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="text-center py-8 text-slate-500">Loading achievements...</div>
              ) : achievements.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No achievements logged yet. Click "Quick Win" to add your first achievement!
                </div>
              ) : (
                achievements.map((achievement) => (
                  <div key={achievement.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {achievement.title}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {achievement.date_achieved ? formatDateForDisplay(achievement.date_achieved) : 'No date'}
                          </span>
                          {achievement.category && (
                            <Badge variant="outline" className="text-xs">
                              {achievement.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-slate-700 mb-3">{achievement.description}</p>

                    {achievement.metrics && (
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Impact: {achievement.metrics}</span>
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
