import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trophy, Save, X } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { toast } from "sonner";

interface WinLoggerProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const ACHIEVEMENT_CATEGORIES = [
  "Leadership",
  "Technical Achievement",
  "Business Impact",
  "Process Improvement",
  "Team Collaboration",
  "Innovation",
  "Customer Success",
  "Other"
];

const WinLogger = ({ onCancel, onSuccess }: WinLoggerProps) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    metrics: "",
    date: ""
  });
  const [saving, setSaving] = useState(false);
  const { createAchievement } = useAchievements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.category || !formData.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const achievement = await createAchievement({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        metrics: formData.metrics || null,
        date_achieved: formData.date
      });

      if (achievement) {
        onSuccess();

        // Reset form
        setFormData({
          title: "",
          description: "",
          category: "",
          metrics: "",
          date: ""
        });
      }
    } catch (error) {
      console.error('Error logging win:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-600" />
          Log Your Win
        </CardTitle>
        <CardDescription>
          Record your achievement with details that will make your resume stand out
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Achievement Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Led team to deliver project 2 weeks ahead of schedule"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select achievement category" />
              </SelectTrigger>
              <SelectContent>
                {ACHIEVEMENT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date Achieved *</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your achievement in detail. What was the challenge? What actions did you take? What was the outcome?"
              rows={4}
              required
            />
            <p className="text-sm text-gray-500">
              Be specific about what you accomplished and your role in achieving it.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="metrics">Quantifiable Impact (Optional)</Label>
            <Input
              id="metrics"
              value={formData.metrics}
              onChange={(e) => handleInputChange('metrics', e.target.value)}
              placeholder="e.g., Increased revenue by 25%, Reduced costs by $50K, Improved efficiency by 40%"
            />
            <p className="text-sm text-gray-500">
              Include specific numbers, percentages, or dollar amounts when possible.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Log Win'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default WinLogger;