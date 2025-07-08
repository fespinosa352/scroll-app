
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, Calendar, User, Download, Edit3 } from "lucide-react";
import { toast } from "sonner";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import { useResumeData } from "@/contexts/ResumeDataContext";

interface ResumeVersionsProps {
  onEditResume?: (resumeId: string) => void;
  onCreateNew?: () => void;
}

const ResumeVersions: React.FC<ResumeVersionsProps> = ({ onEditResume, onCreateNew }) => {
  const { resumes, duplicateResume } = useResumeVersions();
  const { loadResumeForEditing } = useResumeData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 border-green-200";
      case "draft": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "archived": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getATSScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const handleDownload = (resumeId: string, format: string) => {
    toast.success(`Resume downloaded as ${format.toUpperCase()}`);
  };

  const handleDuplicate = (resumeId: string) => {
    duplicateResume(resumeId);
  };

  const handleEdit = (resume: any) => {
    // Load the resume data into the context for editing
    loadResumeForEditing(resume);
    
    // Call the parent callback to switch to edit mode
    if (onEditResume) {
      onEditResume(resume.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Create New Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Resume Versions</h2>
          <p className="text-slate-600">Manage and optimize your tailored resumes</p>
        </div>
        <Button 
          variant="primary" 
          size="touch"
          onClick={onCreateNew}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Resume
        </Button>
      </div>

      {/* Resume Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {resumes.map((resume) => (
          <Card key={resume.id} className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{resume.name}</CardTitle>
                  <CardDescription className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {resume.targetRole} at {resume.company}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Created {new Date(resume.createdDate).toLocaleDateString()}
                    </div>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(resume.status)}>
                  {resume.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* ATS Score */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ATS Optimization Score</span>
                  <span className={`text-sm font-bold ${getATSScoreColor(resume.atsScore)}`}>
                    {resume.atsScore}%
                  </span>
                </div>
                <Progress value={resume.atsScore} className="h-2" />
              </div>

              {/* Matched Achievements */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm text-slate-600">Matched Achievements</span>
                <Badge variant="secondary">{resume.matchedAchievements} items</Badge>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 pt-2">
                <Button variant="outline" size="touch" onClick={() => handleDuplicate(resume.id)}>
                  Duplicate
                </Button>
                <Button variant="outline" size="touch" onClick={() => handleDownload(resume.id, 'pdf')}>
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
                <Button variant="outline" size="touch" onClick={() => handleDownload(resume.id, 'docx')}>
                  <Download className="w-4 h-4 mr-1" />
                  DOCX
                </Button>
                <Button 
                  variant="primary" 
                  size="touch"
                  onClick={() => handleEdit(resume)}
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>
            </CardContent>

            {/* Status indicator line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${
              resume.status === 'active' ? 'bg-green-500' :
              resume.status === 'draft' ? 'bg-yellow-500' : 'bg-gray-400'
            }`} />
          </Card>
        ))}
      </div>

    </div>
  );
};

export default ResumeVersions;
