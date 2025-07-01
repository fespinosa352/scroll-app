
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, User, Target } from "lucide-react";
import { toast } from "sonner";

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
  const [achievements, setAchievements] = useState<Achievement[]>([
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
  ]);

  const [newAchievement, setNewAchievement] = useState({
    title: "",
    description: "",
    category: "",
    impact: "",
    tags: ""
  });

  const categories = ["Leadership", "Technical", "Sales", "Marketing", "Operations", "Strategy"];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAchievement.title || !newAchievement.description) {
      toast.error("Please fill in title and description");
      return;
    }

    const achievement: Achievement = {
      id: Date.now().toString(),
      title: newAchievement.title,
      description: newAchievement.description,
      category: newAchievement.category || "General",
      impact: newAchievement.impact,
      date: new Date().toISOString().split('T')[0],
      tags: newAchievement.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    };

    setAchievements([achievement, ...achievements]);
    setNewAchievement({ title: "", description: "", category: "", impact: "", tags: "" });
    toast.success("Achievement logged successfully!");
  };

  return (
    <div className="space-y-6">
      {/* Quick Log Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Log New Achievement
          </CardTitle>
          <CardDescription>
            Capture your wins while they're fresh in your mind
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Achievement Title</label>
                <Input
                  placeholder="e.g., Led successful product launch"
                  value={newAchievement.title}
                  onChange={(e) => setNewAchievement({ ...newAchievement, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={newAchievement.category}
                  onValueChange={(value) => setNewAchievement({ ...newAchievement, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description & Context</label>
              <Textarea
                placeholder="Describe what you accomplished, the challenges you overcame, and the methods you used..."
                value={newAchievement.description}
                onChange={(e) => setNewAchievement({ ...newAchievement, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Measurable Impact</label>
                <Input
                  placeholder="e.g., 25% increase in sales, $100K cost savings"
                  value={newAchievement.impact}
                  onChange={(e) => setNewAchievement({ ...newAchievement, impact: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Skills/Tags</label>
                <Input
                  placeholder="leadership, project-management, analytics"
                  value={newAchievement.tags}
                  onChange={(e) => setNewAchievement({ ...newAchievement, tags: e.target.value })}
                />
              </div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Log Achievement
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Achievement History */}
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
    </div>
  );
};

export default AchievementLogger;
