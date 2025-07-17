import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Trophy, Save, X } from "lucide-react";
import { useWorkExperience } from "@/hooks/useWorkExperience";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDateForInput } from "@/lib/dateUtils";

interface WinLoggerProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const WinLogger = ({ onCancel, onSuccess }: WinLoggerProps) => {
  const [formData, setFormData] = useState({
    company: "",
    date: "",
    description: ""
  });
  const [saving, setSaving] = useState(false);
  const { workExperiences, loading } = useWorkExperience();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to log wins');
      return;
    }

    if (!formData.company || !formData.date || !formData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      // Find the selected work experience
      const selectedWorkExperience = workExperiences.find(
        exp => exp.id === formData.company
      );

      if (!selectedWorkExperience) {
        toast.error('Selected company not found');
        return;
      }

      // Create the win as a project entry
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          work_experience_id: formData.company,
          title: `Win - ${selectedWorkExperience.company_name || 'Unknown Company'}`,
          description: formData.description,
          start_date: formData.date,
          end_date: formData.date,
          impact_metrics: null,
          technologies_used: []
        });

      if (error) throw error;

      toast.success('Win logged successfully!');
      onSuccess();
      
      // Reset form
      setFormData({
        company: "",
        date: "",
        description: ""
      });
    } catch (error) {
      console.error('Error logging win:', error);
      toast.error('Failed to log win');
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
          Record your achievement and associate it with a company from your work experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <Select 
              value={formData.company} 
              onValueChange={(value) => handleInputChange('company', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select company where you achieved this win" />
              </SelectTrigger>
              <SelectContent>
                {workExperiences.map((exp) => (
                  <SelectItem key={exp.id} value={exp.id}>
                    {exp.company_name || 'Unknown Company'} - {exp.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
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
            <Label htmlFor="description">Win Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your achievement in detail. Example: 'Presented to Board of Directors a recommendation to improve benefits and they agreed, resulting in 15% increase in employee satisfaction.'"
              rows={4}
              required
            />
            <p className="text-sm text-gray-500">
              Be specific about what you accomplished and include measurable impact when possible.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={saving || loading}
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