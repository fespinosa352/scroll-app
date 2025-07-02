
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UploadedResume {
  id: string;
  name: string;
  file: File;
  status: "uploading" | "parsing" | "completed" | "error";
  parsedData?: {
    personalInfo: {
      name: string;
      email: string;
      phone: string;
      location: string;
    };
    summary: string;
    experience: Array<{
      title: string;
      company: string;
      duration: string;
      achievements: string[];
    }>;
    education: Array<{
      degree: string;
      institution: string;
      year: string;
    }>;
    skills: string[];
  };
  error?: string;
}

const GettingStarted = () => {
  const [uploadedResumes, setUploadedResumes] = useState<UploadedResume[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const resumeFiles = files.filter(file => 
      file.type === 'application/pdf' || 
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.type === 'application/msword'
    );

    if (resumeFiles.length === 0) {
      toast.error("Please upload PDF or Word documents only");
      return;
    }

    handleFileUpload(resumeFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = (files: File[]) => {
    const newResumes: UploadedResume[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      file,
      status: "uploading"
    }));

    setUploadedResumes(prev => [...prev, ...newResumes]);

    // Simulate upload and parsing process
    newResumes.forEach(resume => {
      setTimeout(() => {
        setUploadedResumes(prev => 
          prev.map(r => r.id === resume.id ? { ...r, status: "parsing" } : r)
        );

        // Simulate AI parsing with mock data
        setTimeout(() => {
          const mockParsedData = {
            personalInfo: {
              name: "John Doe",
              email: "john.doe@email.com",
              phone: "(555) 123-4567",
              location: "San Francisco, CA"
            },
            summary: "Experienced product manager with 5+ years in SaaS development and team leadership.",
            experience: [
              {
                title: "Senior Product Manager",
                company: "TechCorp Inc.",
                duration: "2022 - Present",
                achievements: [
                  "Led cross-functional team of 12 engineers and designers",
                  "Increased user engagement by 35% through data-driven feature development",
                  "Successfully launched 3 major product initiatives"
                ]
              },
              {
                title: "Product Manager",
                company: "StartupXYZ",
                duration: "2020 - 2022",
                achievements: [
                  "Managed product roadmap for B2B SaaS platform",
                  "Conducted user research with 100+ customers",
                  "Improved customer retention by 25%"
                ]
              }
            ],
            education: [
              {
                degree: "MBA, Business Administration",
                institution: "Stanford University",
                year: "2020"
              },
              {
                degree: "BS, Computer Science",
                institution: "UC Berkeley",
                year: "2018"
              }
            ],
            skills: [
              "Product Management", "Agile/Scrum", "Data Analysis", 
              "User Research", "Strategic Planning", "Cross-functional Leadership"
            ]
          };

          setUploadedResumes(prev => 
            prev.map(r => r.id === resume.id ? { 
              ...r, 
              status: "completed", 
              parsedData: mockParsedData 
            } : r)
          );

          toast.success(`Resume "${resume.name}" parsed successfully!`);
        }, 3000);
      }, 1000);
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600";
      case "error": return "text-red-600";
      case "parsing": 
      case "uploading": return "text-blue-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      case "parsing": 
      case "uploading": return <Loader2 className="w-4 h-4 animate-spin" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const completedResumes = uploadedResumes.filter(r => r.status === "completed");
  const canProceed = completedResumes.length > 0;

  const handleCompleteSetup = () => {
    toast.success("Your resumes have been imported successfully!");
    // This would typically save the data to the backend
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Import Your Existing Resumes</h2>
        <p className="text-slate-600">Upload your current resume versions and let our AI extract your achievements, skills, and experience</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Resume Files</CardTitle>
          <CardDescription>
            Upload one or more versions of your resume. Our AI will parse them and extract your achievements, skills, and experience.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your resume files here
            </h3>
            <p className="text-gray-600 mb-4">
              Support for PDF, DOC, and DOCX files
            </p>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              id="resume-upload"
            />
            <label htmlFor="resume-upload">
              <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
                Choose Files
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedResumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Resumes</CardTitle>
            <CardDescription>
              Our AI is analyzing your resumes and extracting key information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {uploadedResumes.map((resume) => (
              <div key={resume.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={getStatusColor(resume.status)}>
                    {getStatusIcon(resume.status)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{resume.name}</p>
                    <p className="text-sm text-slate-600">
                      {resume.status === "uploading" && "Uploading..."}
                      {resume.status === "parsing" && "Parsing with AI..."}
                      {resume.status === "completed" && "Parsing complete"}
                      {resume.status === "error" && "Error occurred"}
                    </p>
                  </div>
                </div>
                <Badge variant={resume.status === "completed" ? "default" : "secondary"}>
                  {resume.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Summary of Parsed Data */}
      {completedResumes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Information</CardTitle>
            <CardDescription>
              Here's what we found in your resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {completedResumes.reduce((acc, resume) => 
                    acc + (resume.parsedData?.experience.length || 0), 0
                  )}
                </div>
                <div className="text-sm text-slate-600">Work Experiences</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-1">
                  {completedResumes.reduce((acc, resume) => 
                    acc + (resume.parsedData?.skills.length || 0), 0
                  )}
                </div>
                <div className="text-sm text-slate-600">Skills Identified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {completedResumes.reduce((acc, resume) => 
                    acc + resume.parsedData?.experience.reduce((expAcc, exp) => 
                      expAcc + exp.achievements.length, 0
                    ) || 0, 0
                  )}
                </div>
                <div className="text-sm text-slate-600">Achievements Found</div>
              </div>
            </div>

            {canProceed && (
              <div className="text-center">
                <Button 
                  onClick={handleCompleteSetup}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
                >
                  Save Imported Data
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GettingStarted;
