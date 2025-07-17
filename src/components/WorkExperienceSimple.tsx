import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Briefcase, FileText, Trash2, Edit, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useWorkExperience } from "@/hooks/useWorkExperience";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { formatDateRange } from "@/lib/dateUtils";

interface WorkExperienceForm {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  location: string;
  isCurrentRole: boolean;
  responsibilities: string[];
  accomplishments: string[];
}

interface WorkExperienceSimpleProps {
  onClose?: () => void;
  editingExperience?: any;
}

const WorkExperienceSimple = ({ onClose, editingExperience }: WorkExperienceSimpleProps) => {
  const { saveWorkExperience, updateWorkExperience, deleteWorkExperience, saving } = useWorkExperience();
  const { workExperience } = useResumeData();
  const [showForm, setShowForm] = useState(!!editingExperience);
  const [currentEditingExp, setCurrentEditingExp] = useState(editingExperience);
  
  const [workForm, setWorkForm] = useState<WorkExperienceForm>(() => {
    if (currentEditingExp) {
      const descriptions = currentEditingExp.description?.replace(/^• /, '').split('\n• ').filter(Boolean) || [];
      return {
        company: currentEditingExp.company_name || currentEditingExp.company || "",
        position: currentEditingExp.title || currentEditingExp.position || "",
        startDate: currentEditingExp.start_date || currentEditingExp.startDate || "",
        endDate: currentEditingExp.end_date || currentEditingExp.endDate || "",
        location: currentEditingExp.location || "",
        isCurrentRole: currentEditingExp.is_current || currentEditingExp.isCurrentRole || false,
        responsibilities: descriptions,
        accomplishments: []
      };
    }
    return {
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      location: "",
      isCurrentRole: false,
      responsibilities: [],
      accomplishments: []
    };
  });

  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [accomplishmentInput, setAccomplishmentInput] = useState("");

  const resetForm = () => {
    setWorkForm({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      location: "",
      isCurrentRole: false,
      responsibilities: [],
      accomplishments: []
    });
    setResponsibilityInput("");
    setAccomplishmentInput("");
    setCurrentEditingExp(null);
  };

  const handleEdit = (experience: any) => {
    setCurrentEditingExp(experience);
    const descriptions = experience.description?.replace(/^• /, '').split('\n• ').filter(Boolean) || [];
    setWorkForm({
      company: experience.company_name || experience.company || "",
      position: experience.title || experience.position || "",
      startDate: experience.start_date || experience.startDate || "",
      endDate: experience.end_date || experience.endDate || "",
      location: experience.location || "",
      isCurrentRole: experience.is_current || experience.isCurrentRole || false,
      responsibilities: descriptions,
      accomplishments: []
    });
    setShowForm(true);
  };

  // Helper function to clean and process pasted text (same as Getting Started)
  const cleanPastedText = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^[•\-\*]\s*$/)) // Remove empty bullet points
      .map(line => line.replace(/^[•\-\*]\s*/, '')) // Remove bullet point prefixes
      .filter(line => line.length > 0);
  };

  const addResponsibility = () => {
    if (responsibilityInput.trim()) {
      setWorkForm({
        ...workForm,
        responsibilities: [...workForm.responsibilities, responsibilityInput.trim()]
      });
      setResponsibilityInput("");
    }
  };

  const addAccomplishment = () => {
    if (accomplishmentInput.trim()) {
      setWorkForm({
        ...workForm,
        accomplishments: [...workForm.accomplishments, accomplishmentInput.trim()]
      });
      setAccomplishmentInput("");
    }
  };

  const handleSave = async () => {
    if (!workForm.company || !workForm.position || !workForm.startDate) {
      toast.error("Please fill in company, position, and start date");
      return;
    }

    const description = [...workForm.responsibilities, ...workForm.accomplishments].join('\n• ');

    const workExperienceData = {
      title: workForm.position,
      company_name: workForm.company,
      start_date: workForm.startDate,
      end_date: workForm.isCurrentRole ? null : workForm.endDate,
      is_current: workForm.isCurrentRole,
      location: workForm.location,
      description: description ? `• ${description}` : ""
    };

    try {
      if (currentEditingExp?.id) {
        await updateWorkExperience(currentEditingExp.id, workExperienceData);
        toast.success("Work experience updated!");
      } else {
        await saveWorkExperience(workExperienceData);
        toast.success("Work experience added!");
      }
      
      resetForm();
      setShowForm(false);
      
      // If this is a modal, close it
      if (onClose && editingExperience) {
        onClose();
      }
    } catch (error) {
      toast.error("Failed to save work experience");
    }
  };

  const handleDelete = async () => {
    if (currentEditingExp?.id) {
      try {
        await deleteWorkExperience(currentEditingExp.id);
        toast.success("Work experience deleted!");
        resetForm();
        setShowForm(false);
        if (onClose && editingExperience) {
          onClose();
        }
      } catch (error) {
        toast.error("Failed to delete work experience");
      }
    }
  };

  // If no editing experience provided and no form shown, show the list
  if (!editingExperience && !showForm) {
    return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Work Experience</h2>
            <p className="text-slate-600">Manage your professional experience with copy-paste magic</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Experience
          </Button>
        </div>

        {/* Experience List */}
        {workExperience.length > 0 ? (
          <div className="space-y-4">
            {workExperience.map((exp, index) => (
              <Card key={exp.id || index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">{exp.position}</h3>
                      <p className="text-slate-700 font-medium">{exp.company}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDateRange(exp.startDate, exp.endDate, exp.isCurrentRole)}
                        </div>
                        {exp.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {exp.location}
                          </div>
                        )}
                      </div>
                      {exp.description && (
                        <div className="mt-3 text-sm text-slate-600">
                          {exp.description.split('\n• ').slice(0, 2).map((item, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-slate-400 mt-1">•</span>
                              <span>{item.replace(/^• /, '')}</span>
                            </div>
                          ))}
                          {exp.description.split('\n• ').length > 2 && (
                            <p className="text-slate-400 text-xs mt-1">
                              +{exp.description.split('\n• ').length - 2} more items
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <Button
                      onClick={() => handleEdit(exp)}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No work experience yet</h3>
              <p className="text-slate-600 mb-4">
                Add your first work experience with our intuitive copy-paste system
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Experience
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="w-5 h-5" />
          {editingExperience ? "Edit Work Experience" : "Add Work Experience"}
        </CardTitle>
        <CardDescription>
          Add your work experience. You can copy-paste bullet points directly from your resume - we'll handle the formatting automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Copy-Paste Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-1">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">💡 Copy-Paste Magic</h4>
              <p className="text-sm text-blue-800">
                Copy bullet points directly from your resume and paste them in the text areas below. 
                We'll automatically clean up formatting and split them into individual items.
              </p>
            </div>
          </div>
        </div>

        {/* Basic Work Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="company">Company Name *</Label>
            <Input
              id="company"
              value={workForm.company}
              onChange={(e) => setWorkForm({...workForm, company: e.target.value})}
              placeholder="Company Name"
            />
          </div>
          <div>
            <Label htmlFor="position">Job Title *</Label>
            <Input
              id="position"
              value={workForm.position}
              onChange={(e) => setWorkForm({...workForm, position: e.target.value})}
              placeholder="Job Title"
            />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <Input
              id="startDate"
              type="date"
              value={workForm.startDate}
              onChange={(e) => setWorkForm({...workForm, startDate: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={workForm.endDate}
              onChange={(e) => setWorkForm({...workForm, endDate: e.target.value})}
              disabled={workForm.isCurrentRole}
            />
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="currentRole"
                checked={workForm.isCurrentRole}
                onCheckedChange={(checked) => setWorkForm({...workForm, isCurrentRole: checked as boolean})}
              />
              <Label htmlFor="currentRole" className="text-sm">This is my current role</Label>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={workForm.location}
              onChange={(e) => setWorkForm({...workForm, location: e.target.value})}
              placeholder="City, State or Remote"
            />
          </div>
        </div>

        {/* Responsibilities */}
        <div>
          <Label>Responsibilities</Label>
          <div className="space-y-2">
            <Textarea
              value={responsibilityInput}
              onChange={(e) => setResponsibilityInput(e.target.value)}
              placeholder="Paste your responsibilities here (one per line) or type individual items..."
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={addResponsibility} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Single Item
              </Button>
              <Button 
                onClick={() => {
                  const lines = cleanPastedText(responsibilityInput);
                  if (lines.length > 0) {
                    setWorkForm({
                      ...workForm,
                      responsibilities: [...workForm.responsibilities, ...lines]
                    });
                    setResponsibilityInput("");
                    toast.success(`Added ${lines.length} responsibilities`);
                  }
                }} 
                variant="default" 
                size="sm"
                disabled={!responsibilityInput.trim()}
              >
                Add All Lines
              </Button>
            </div>
          </div>
          {workForm.responsibilities.length > 0 && (
            <div className="mt-2 space-y-1">
              {workForm.responsibilities.map((resp, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">{resp}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWorkForm({
                      ...workForm,
                      responsibilities: workForm.responsibilities.filter((_, i) => i !== index)
                    })}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Accomplishments */}
        <div>
          <Label>Accomplishments</Label>
          <div className="space-y-2">
            <Textarea
              value={accomplishmentInput}
              onChange={(e) => setAccomplishmentInput(e.target.value)}
              placeholder="Paste your accomplishments here (one per line) or type individual items..."
              rows={4}
              className="resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={addAccomplishment} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Single Item
              </Button>
              <Button 
                onClick={() => {
                  const lines = cleanPastedText(accomplishmentInput);
                  if (lines.length > 0) {
                    setWorkForm({
                      ...workForm,
                      accomplishments: [...workForm.accomplishments, ...lines]
                    });
                    setAccomplishmentInput("");
                    toast.success(`Added ${lines.length} accomplishments`);
                  }
                }} 
                variant="default" 
                size="sm"
                disabled={!accomplishmentInput.trim()}
              >
                Add All Lines
              </Button>
            </div>
          </div>
          {workForm.accomplishments.length > 0 && (
            <div className="mt-2 space-y-1">
              {workForm.accomplishments.map((acc, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm">{acc}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setWorkForm({
                      ...workForm,
                      accomplishments: workForm.accomplishments.filter((_, i) => i !== index)
                    })}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <div>
            {currentEditingExp && (
              <Button 
                onClick={handleDelete} 
                variant="destructive" 
                disabled={saving}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                if (editingExperience && onClose) {
                  onClose();
                } else {
                  resetForm();
                  setShowForm(false);
                }
              }} 
              variant="outline" 
              disabled={saving}
            >
              {editingExperience ? "Cancel" : "Back to List"}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : currentEditingExp ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WorkExperienceSimple;