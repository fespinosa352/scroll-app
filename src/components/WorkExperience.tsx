import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Calendar, Building, Edit2, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WorkExperience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
  isCurrentRole: boolean;
  skills: string[];
}

const WorkExperience = () => {
  const [experiences, setExperiences] = useState<WorkExperience[]>([
    {
      id: "1",
      company: "Microsoft",
      position: "Senior Product Manager",
      startDate: "2022-03",
      endDate: "",
      description: "Led cross-functional teams to deliver B2B SaaS products. Increased user engagement by 40% through data-driven product decisions and user research initiatives.",
      isCurrentRole: true,
      skills: ["Product Management", "Cross-functional Leadership", "Data Analysis", "User Research"]
    },
    {
      id: "2",
      company: "Google",
      position: "Product Manager",
      startDate: "2020-01",
      endDate: "2022-02",
      description: "Managed product roadmap for early-stage fintech startup. Collaborated with engineering and design teams to launch MVP that acquired 10,000+ users in first year.",
      isCurrentRole: false,
      skills: ["Product Strategy", "MVP Development", "Agile Methodology", "Stakeholder Management"]
    }
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    description: "",
    isCurrentRole: false,
    skills: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company || !formData.position || !formData.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const skillsArray = formData.skills.split(",").map(s => s.trim()).filter(s => s);
    
    const newExperience: WorkExperience = {
      id: editingId || Date.now().toString(),
      company: formData.company,
      position: formData.position,
      startDate: formData.startDate,
      endDate: formData.isCurrentRole ? "" : formData.endDate,
      description: formData.description,
      isCurrentRole: formData.isCurrentRole,
      skills: skillsArray
    };

    if (editingId) {
      setExperiences(prev => prev.map(exp => exp.id === editingId ? newExperience : exp));
      toast.success("Work experience updated!");
    } else {
      setExperiences(prev => [newExperience, ...prev]);
      toast.success("Work experience added!");
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      description: "",
      isCurrentRole: false,
      skills: ""
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (experience: WorkExperience) => {
    setFormData({
      company: experience.company,
      position: experience.position,
      startDate: experience.startDate,
      endDate: experience.endDate,
      description: experience.description,
      isCurrentRole: experience.isCurrentRole,
      skills: experience.skills.join(", ")
    });
    setEditingId(experience.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setExperiences(prev => prev.filter(exp => exp.id !== id));
    toast.success("Work experience deleted");
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Work Experience
          </CardTitle>
          <CardDescription>
            Track your professional journey and build a comprehensive work history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowForm(true)}
            variant="primary"
            size="touch"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Work Experience
          </Button>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Work Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company *</label>
                  <Input
                    placeholder="e.g., Microsoft, Google, Airbnb"
                    value={formData.company}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Position *</label>
                  <Input
                    placeholder="e.g., Senior Product Manager"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date *</label>
                  <Input
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="month"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    disabled={formData.isCurrentRole}
                    placeholder={formData.isCurrentRole ? "Present" : ""}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="currentRole"
                  checked={formData.isCurrentRole}
                  onChange={(e) => setFormData({...formData, isCurrentRole: e.target.checked, endDate: e.target.checked ? "" : formData.endDate})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="currentRole" className="text-sm font-medium">
                  This is my current role
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe your role, achievements, and key responsibilities..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Skills (comma-separated)</label>
                <Input
                  placeholder="e.g., Product Management, Leadership, Data Analysis"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="touch" className="flex-1 md:flex-none">
                  {editingId ? "Update" : "Add"} Experience
                </Button>
                <Button type="button" variant="outline" size="touch" onClick={resetForm} className="flex-1 md:flex-none">
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.map((experience) => (
          <Card key={experience.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Building className="w-4 h-4 text-slate-500" />
                    <h3 className="font-semibold text-lg">{experience.position}</h3>
                    {experience.isCurrentRole && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-600 font-medium mb-1">{experience.company}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(experience.startDate)} - {formatDate(experience.endDate)}</span>
                  </div>
                  {experience.description && (
                    <p className="text-slate-700 mb-3">{experience.description}</p>
                  )}
                  {experience.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {experience.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4 md:ml-0 md:mt-4">
                  <Button
                    variant="ghost"
                    size="touch"
                    onClick={() => handleEdit(experience)}
                    className="flex-1 md:flex-none"
                  >
                    <Edit2 className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="touch"
                    onClick={() => handleDelete(experience.id)}
                    className="text-red-600 hover:text-red-700 flex-1 md:flex-none"
                  >
                    <Trash2 className="w-4 h-4 md:mr-2" />
                    <span className="hidden md:inline">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkExperience;