
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, Calendar, User, Download, Edit3, Archive, Trash2, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { exportResume, type ExportableResume } from "@/utils/resumeExport";

interface ResumeVersionsProps {
  onEditResume?: (resumeId: string) => void;
  onCreateNew?: () => void;
}

const ResumeVersions: React.FC<ResumeVersionsProps> = ({ onEditResume, onCreateNew }) => {
  const { resumes, duplicateResume, deleteResume, updateResumeStatus, regenerateResumeWithLatestData } = useResumeVersions();
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

  const handleDownload = async (resume: any, format: 'copy' | 'txt') => {
    try {
      const exportableResume: ExportableResume = {
        name: resume.name,
        content: resume.content || {}, // Use empty object if no content
        ats_score: resume.atsScore,
        created_at: resume.createdDate
      };
      
      if (format === 'copy') {
        const success = await exportResume(exportableResume, format);
        if (success) {
          toast.success('Resume copied to clipboard');
        } else {
          toast.error('Failed to copy to clipboard');
        }
      } else {
        exportResume(exportableResume, format);
        toast.success(`Resume downloaded as ${format.toUpperCase()}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`Failed to export resume`);
    }
  };

  const handleDuplicate = async (resumeId: string) => {
    try {
      await duplicateResume(resumeId);
      toast.success('Resume duplicated successfully');
    } catch (error) {
      toast.error('Failed to duplicate resume');
    }
  };

  const handleArchive = async (resumeId: string) => {
    try {
      await updateResumeStatus(resumeId, 'archived');
      toast.success('Resume archived');
    } catch (error) {
      toast.error('Failed to archive resume');
    }
  };

  const handleRefreshResume = async (resumeId: string) => {
    console.log('Refresh button clicked for resume:', resumeId);
    try {
      toast.loading('Refreshing resume with latest profile data...');
      await regenerateResumeWithLatestData(resumeId);
      toast.success('Resume refreshed with latest profile data!');
    } catch (error) {
      console.error('Failed to refresh resume:', error);
      toast.error('Failed to refresh resume');
    }
  };

  const handleDelete = async (resumeId: string) => {
    if (window.confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      try {
        await deleteResume(resumeId);
        toast.success('Resume deleted');
      } catch (error) {
        toast.error('Failed to delete resume');
      }
    }
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
                 <span className="text-sm text-slate-600">Matched Skills</span>
                 <Badge variant="secondary">
                   {resume.matchedAchievements} items
                 </Badge>
               </div>

              {/* Action Buttons */}
               <div className="grid grid-cols-2 md:flex md:flex-wrap gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="touch" 
                    onClick={() => handleRefreshResume(resume.id)}
                    className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                    title="Refresh with latest work experience and skills"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                  <Button variant="outline" size="touch" onClick={() => handleDuplicate(resume.id)}>
                    Duplicate
                  </Button>
                  <Button variant="outline" size="touch" onClick={() => handleDownload(resume, 'copy')}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="touch" onClick={() => handleDownload(resume, 'txt')}>
                    <Download className="w-4 h-4 mr-1" />
                    TXT
                  </Button>
                 <Button 
                   variant="primary" 
                   size="touch"
                   onClick={() => handleEdit(resume)}
                 >
                   <Edit3 className="w-4 h-4 mr-1" />
                   Edit
                 </Button>
                 <Button 
                   variant="outline" 
                   size="touch"
                   onClick={() => handleArchive(resume.id)}
                   className="text-orange-600 hover:text-orange-700"
                 >
                   <Archive className="w-4 h-4 mr-1" />
                   Archive
                 </Button>
                 <Button 
                   variant="outline" 
                   size="touch"
                   onClick={() => handleDelete(resume.id)}
                   className="text-red-600 hover:text-red-700"
                 >
                   <Trash2 className="w-4 h-4 mr-1" />
                   Delete
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
