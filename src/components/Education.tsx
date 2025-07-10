import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, GraduationCap, Calendar, Building, Edit2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { useEducation } from "@/hooks/useEducation";

interface Education {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  gpa?: string;
  isCurrentlyEnrolled: boolean;
}

const Education = () => {
  const { education: resumeEducation, setEducation } = useResumeData();
  const { saveEducation, updateEducation: updateEducationDb, deleteEducation, saving } = useEducation();
  
  // Use resume data if available, otherwise show empty state
  const educationList = resumeEducation || [];
  
  const updateEducation = (newEducation: Education[]) => {
    setEducation(newEducation);
  };

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    gpa: "",
    isCurrentlyEnrolled: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.institution || !formData.degree) {
      toast.error("Please fill in institution and degree");
      return;
    }

    // Prepare database format
    const educationData = {
      institution: formData.institution,
      degree: formData.degree,
      field_of_study: formData.fieldOfStudy,
      start_date: formData.startDate || null,
      end_date: formData.isCurrentlyEnrolled ? null : formData.endDate || null,
      gpa: formData.gpa ? parseFloat(formData.gpa) : null,
      description: null,
      user_id: '', // Will be set by the hook
    };

    try {
      if (editingId && !editingId.startsWith('parsed-edu-')) {
        // Update existing database record
        const result = await updateEducationDb(editingId, educationData);
        if (result) {
          // Update local state
          const updatedEducation = educationList.map(edu => 
            edu.id === editingId ? {
              ...edu,
              institution: formData.institution,
              degree: formData.degree,
              fieldOfStudy: formData.fieldOfStudy,
              startDate: formData.startDate,
              endDate: formData.isCurrentlyEnrolled ? "" : formData.endDate,
              gpa: formData.gpa,
              isCurrentlyEnrolled: formData.isCurrentlyEnrolled
            } : edu
          );
          updateEducation(updatedEducation);
        }
      } else {
        // Create new database record
        const result = await saveEducation(educationData);
        if (result) {
          // Create local format for UI
          const newEducation: Education = {
            id: result.id,
            institution: formData.institution,
            degree: formData.degree,
            fieldOfStudy: formData.fieldOfStudy,
            startDate: formData.startDate,
            endDate: formData.isCurrentlyEnrolled ? "" : formData.endDate,
            gpa: formData.gpa,
            isCurrentlyEnrolled: formData.isCurrentlyEnrolled
          };
          
          const updatedEducation = [newEducation, ...educationList];
          updateEducation(updatedEducation);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving education:', error);
      toast.error('Failed to save education');
    }
  };

  const resetForm = () => {
    setFormData({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      gpa: "",
      isCurrentlyEnrolled: false
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (education: Education) => {
    setFormData({
      institution: education.institution,
      degree: education.degree,
      fieldOfStudy: education.fieldOfStudy,
      startDate: education.startDate,
      endDate: education.endDate,
      gpa: education.gpa || "",
      isCurrentlyEnrolled: education.isCurrentlyEnrolled
    });
    setEditingId(education.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Only delete from database if it's not a local-only record
      if (!id.startsWith('parsed-edu-')) {
        const success = await deleteEducation(id);
        if (!success) {
          return; // Don't update local state if database deletion failed
        }
      }
      
      // Update local state
      const updatedEducation = educationList.filter(edu => edu.id !== id);
      updateEducation(updatedEducation);
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Failed to delete education');
    }
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
            <GraduationCap className="w-5 h-5" />
            Education
          </CardTitle>
          <CardDescription>
            Track your educational background and academic achievements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setShowForm(true)}
            variant="primary"
            size="touch"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Education
          </Button>
        </CardContent>
      </Card>

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit" : "Add"} Education</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institution *</label>
                  <Input
                    placeholder="e.g., Stanford University, MIT"
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Degree *</label>
                  <Input
                    placeholder="e.g., Bachelor of Science, Master of Arts"
                    value={formData.degree}
                    onChange={(e) => setFormData({...formData, degree: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Field of Study</label>
                <Input
                  placeholder="e.g., Computer Science, Business Administration"
                  value={formData.fieldOfStudy}
                  onChange={(e) => setFormData({...formData, fieldOfStudy: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="month"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Date</label>
                  <Input
                    type="month"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    disabled={formData.isCurrentlyEnrolled}
                    placeholder={formData.isCurrentlyEnrolled ? "Present" : ""}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">GPA (Optional)</label>
                  <Input
                    placeholder="e.g., 3.8, 4.0"
                    value={formData.gpa}
                    onChange={(e) => setFormData({...formData, gpa: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="currentlyEnrolled"
                  checked={formData.isCurrentlyEnrolled}
                  onChange={(e) => setFormData({...formData, isCurrentlyEnrolled: e.target.checked, endDate: e.target.checked ? "" : formData.endDate})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="currentlyEnrolled" className="text-sm font-medium">
                  Currently enrolled
                </label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="touch" className="flex-1 md:flex-none" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    `${editingId ? "Update" : "Add"} Education`
                  )}
                </Button>
                <Button type="button" variant="outline" size="touch" onClick={resetForm} className="flex-1 md:flex-none" disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Education List */}
      <div className="space-y-4">
        {educationList.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No education added yet</h3>
                <p className="text-slate-600 mb-4">
                  Upload a resume in Getting Started or manually add your education here.
                </p>
                <Button 
                  onClick={() => setShowForm(true)}
                  variant="primary"
                  size="touch"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Education
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          educationList.map((education) => (
            <Card key={education.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold text-lg">{education.degree}</h3>
                      {education.isCurrentlyEnrolled && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-slate-600 font-medium mb-1">{education.institution}</p>
                    {education.fieldOfStudy && (
                      <p className="text-slate-600 mb-1">{education.fieldOfStudy}</p>
                    )}
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(education.startDate)} - {formatDate(education.endDate)}</span>
                    </div>
                    {education.gpa && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          GPA: {education.gpa}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4 md:ml-0 md:mt-4">
                    <Button
                      variant="ghost"
                      size="touch"
                      onClick={() => handleEdit(education)}
                      className="flex-1 md:flex-none"
                    >
                      <Edit2 className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="touch"
                      onClick={() => handleDelete(education.id)}
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
    </div>
  );
};

export default Education;