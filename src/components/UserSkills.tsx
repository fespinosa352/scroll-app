import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, User, Award } from "lucide-react";
import { toast } from "sonner";
import { useJobAnalysis } from "@/hooks/useJobAnalysis";

const UserSkills = () => {
  const [skillName, setSkillName] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [yearsExperience, setYearsExperience] = useState(1);
  
  const { userSkills, addUserSkill, loading } = useJobAnalysis();

  const handleAddSkill = async () => {
    if (!skillName.trim()) {
      toast.error("Please enter a skill name");
      return;
    }

    const newSkill = {
      skill_name: skillName.trim(),
      proficiency_level: proficiencyLevel,
      years_experience: yearsExperience
    };

    const result = await addUserSkill(newSkill);
    if (result) {
      toast.success("Skill added successfully!");
      setSkillName("");
      setProficiencyLevel('intermediate');
      setYearsExperience(1);
    } else {
      toast.error("Failed to add skill. It may already exist.");
    }
  };

  const getProficiencyColor = (level: string | null) => {
    switch (level) {
      case 'beginner': return 'border-yellow-200 text-yellow-700 bg-yellow-50';
      case 'intermediate': return 'border-blue-200 text-blue-700 bg-blue-50';
      case 'advanced': return 'border-green-200 text-green-700 bg-green-50';
      case 'expert': return 'border-purple-200 text-purple-700 bg-purple-50';
      default: return 'border-gray-200 text-gray-700 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Skill */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Your Skills
          </CardTitle>
          <CardDescription>
            Add your skills to get better job matching and personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Skill Name</label>
              <Input
                placeholder="e.g., Python, Project Management"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Proficiency Level</label>
              <Select value={proficiencyLevel} onValueChange={(value: any) => setProficiencyLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                  <SelectItem value="expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Years Experience</label>
              <Input
                type="number"
                min="0"
                max="50"
                value={yearsExperience}
                onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">&nbsp;</label>
              <Button 
                onClick={handleAddSkill}
                disabled={loading}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Your Skills ({userSkills.length})
          </CardTitle>
          <CardDescription>
            These skills will be used to match you with job requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userSkills.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No skills added yet. Add your first skill above to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {userSkills.map((skill) => (
                <div key={skill.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium">{skill.skill_name}</h3>
                    <Badge 
                      variant="outline" 
                      className={getProficiencyColor(skill.proficiency_level)}
                    >
                      {skill.proficiency_level || 'Unspecified'}
                    </Badge>
                  </div>
                  <div className="text-sm text-slate-600">
                    {skill.years_experience} {skill.years_experience === 1 ? 'year' : 'years'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSkills;
