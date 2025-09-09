import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Calendar, Building, Edit2, Trash2, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { WorkExperienceModal, WorkExperienceFormData } from "./WorkExperienceModal";

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
  const { workExperience: resumeExperience, setWorkExperience } = useResumeData();
  
  // Use resume data if available, otherwise show empty state
  const experiences = resumeExperience;
  
  const updateExperiences = (newExperiences: WorkExperience[]) => {
    setWorkExperience(newExperiences);
  };

  const [showModal, setShowModal] = useState(false);
  const [editingExperience, setEditingExperience] = useState<WorkExperience | null>(null);

  const handleSave = (formData: WorkExperienceFormData) => {
    const newExperience: WorkExperience = {
      id: editingExperience?.id || Date.now().toString(),
      company: formData.company,
      position: formData.title,
      startDate: `${formData.startYear}-${formData.startMonth.padStart(2, '0')}`,
      endDate: formData.isCurrentRole ? "" : `${formData.endYear}-${formData.endMonth.padStart(2, '0')}`,
      description: formData.description,
      isCurrentRole: formData.isCurrentRole,
      skills: [] // Skills can be extracted from description if needed
    };

    if (editingExperience) {
      const updatedExperiences = experiences.map(exp => exp.id === editingExperience.id ? newExperience : exp);
      updateExperiences(updatedExperiences);
      toast.success("Work experience updated!");
    } else {
      const updatedExperiences = [newExperience, ...experiences];
      updateExperiences(updatedExperiences);
      toast.success("Work experience added!");
    }

    setEditingExperience(null);
  };

  const handleEdit = (experience: WorkExperience) => {
    setEditingExperience(experience);
    setShowModal(true);
  };

  const handleDelete = () => {
    if (editingExperience) {
      const updatedExperiences = experiences.filter(exp => exp.id !== editingExperience.id);
      updateExperiences(updatedExperiences);
      toast.success("Work experience deleted");
      setEditingExperience(null);
    }
  };

  const convertToModalFormat = (experience: WorkExperience): WorkExperienceFormData => {
    const [startYear, startMonth] = experience.startDate.split('-');
    const [endYear, endMonth] = experience.endDate ? experience.endDate.split('-') : ['', ''];
    
    return {
      id: experience.id,
      title: experience.position,
      company: experience.company,
      location: "",
      country: "",
      isCurrentRole: experience.isCurrentRole,
      startMonth: startMonth || "",
      startYear: startYear || "",
      endMonth: endMonth || "",
      endYear: endYear || "",
      description: experience.description,
    };
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
            onClick={() => setShowModal(true)}
            variant="primary"
            size="touch"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Work Experience
          </Button>
        </CardContent>
      </Card>

      <WorkExperienceModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingExperience(null);
        }}
        onSave={handleSave}
        onDelete={editingExperience ? handleDelete : undefined}
        initialData={editingExperience ? convertToModalFormat(editingExperience) : undefined}
        isEditing={!!editingExperience}
      />

      {/* Experience List */}
      <div className="space-y-4">
        {experiences.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No work experience added yet</h3>
                <p className="text-slate-600 mb-4">
                  Upload a resume in Getting Started or manually add your work experience here.
                </p>
                <Button 
                  onClick={() => setShowModal(true)}
                  variant="primary"
                  size="touch"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Experience
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          experiences.map((experience) => (
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
                      onClick={() => {
                        setEditingExperience(experience);
                        handleDelete();
                      }}
                      className="text-red-600 hover:text-red-700 flex-1 md:flex-none"
                    >
                      <Trash2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Delete</span>
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>
      
      {/* Navigation Helper - Only show if user has experiences */}
      {experiences.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Ready to optimize your resume?</h3>
                  <p className="text-sm text-blue-700">
                    Use your updated work experience to get better job matches in Resume Optimization.
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => window.dispatchEvent(new CustomEvent('navigateToJobAnalysis'))}
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
              >
                Go to Resume Optimization
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WorkExperience;