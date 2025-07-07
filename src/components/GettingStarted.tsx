
import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, Shield, Eye, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useResumes } from "@/hooks/useResumes";
import { useAuth } from "@/hooks/useAuth";

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
  const [currentStep, setCurrentStep] = useState<"upload" | "preview" | "confirm">("upload");
  const { saveResume, uploading } = useResumes();
  const { user } = useAuth();

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

        // Simulate AI parsing with realistic data
        setTimeout(() => {
          const mockParsedData = {
            personalInfo: {
              name: "Your Name",
              email: "your.email@gmail.com", 
              phone: "(555) 123-4567",
              location: "Your City, State"
            },
            summary: "Experienced professional with proven track record of delivering results through strategic leadership and innovation.",
            experience: [
              {
                title: "Senior Product Manager",
                company: "Microsoft",
                duration: "2022 - Present",
                achievements: [
                  "Led cross-functional team of 15+ engineers to deliver Azure feature used by 2M+ users",
                  "Increased user engagement by 45% through data-driven product improvements",
                  "Managed $50M product budget and delivered 3 major releases ahead of schedule"
                ]
              },
              {
                title: "Product Manager",
                company: "Google",
                duration: "2020 - 2022",
                achievements: [
                  "Launched Gmail feature that improved user retention by 30%",
                  "Conducted 200+ user interviews to identify key product opportunities",
                  "Collaborated with 5 engineering teams to ship 12 product updates quarterly"
                ]
              }
            ],
            education: [
              {
                degree: "MBA",
                institution: "Stanford University",
                year: "2020"
              },
              {
                degree: "BS Computer Science",
                institution: "UC Berkeley",
                year: "2018"
              }
            ],
            skills: [
              "Product Strategy", "Team Leadership", "Data Analysis", 
              "User Research", "Agile Development", "Cross-functional Collaboration"
            ]
          };

          setUploadedResumes(prev => 
            prev.map(r => r.id === resume.id ? { 
              ...r, 
              status: "completed", 
              parsedData: mockParsedData 
            } : r)
          );

          // Auto-advance to preview step when parsing is complete
          setCurrentStep("preview");
          toast.success("AI extraction complete! Review your achievements below.");
        }, 2000);
      }, 500);
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

  const handleCompleteSetup = async () => {
    if (!user) {
      toast.error("Please log in to save your resumes");
      return;
    }

    // Save all completed resumes to the database
    const savePromises = completedResumes.map(resume => {
      if (resume.parsedData) {
        return saveResume({
          name: resume.name.replace(/\.[^/.]+$/, ""), // Remove file extension
          content: resume.parsedData,
          source_file: resume.name,
          imported_from: 'Getting Started'
        }, resume.file);
      }
      return Promise.resolve(null);
    });

    try {
      await Promise.all(savePromises);
      toast.success("Your resumes have been imported successfully!");
    } catch (error) {
      toast.error("Some resumes failed to save. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        <div className={`flex items-center space-x-2 ${currentStep === "upload" ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === "upload" ? "bg-blue-600 text-white" : "bg-slate-200"}`}>1</div>
          <span>Upload</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <div className={`flex items-center space-x-2 ${currentStep === "preview" ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === "preview" ? "bg-blue-600 text-white" : "bg-slate-200"}`}>2</div>
          <span>AI Preview</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400" />
        <div className={`flex items-center space-x-2 ${currentStep === "confirm" ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === "confirm" ? "bg-blue-600 text-white" : "bg-slate-200"}`}>3</div>
          <span>Confirm</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {currentStep === "upload" && (
        <>
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Transform Your Resume in 2 Minutes</h1>
            <p className="text-xl text-slate-600 mb-8">Upload your resume and watch our AI extract your achievements for better job matches</p>
          </div>

          {/* Security Message */}
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg mb-6">
            <Shield className="w-5 h-5 text-green-600" />
            <span>Files processed securely, never stored permanently</span>
          </div>

          {/* Upload Area */}
          <Card>
            <CardContent className="p-12">
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                  isDragging 
                    ? 'border-blue-500 bg-blue-50 scale-105' 
                    : 'border-slate-300 hover:border-slate-400'
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
              >
                <Upload className="w-16 h-16 mx-auto mb-6 text-slate-400" />
                <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                  Drop your resume here
                </h3>
                <p className="text-slate-600 mb-8 text-lg">
                  PDF, DOC, or DOCX files supported
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
                  <Button size="lg" className="text-lg px-8 py-4">
                    Choose Files
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Processing */}
          {uploadedResumes.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {uploadedResumes.map((resume) => (
                    <div key={resume.id} className="flex items-center space-x-4 p-4 bg-slate-50 rounded-lg">
                      <div className={getStatusColor(resume.status)}>
                        {getStatusIcon(resume.status)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-slate-900">{resume.name}</p>
                        <p className="text-sm text-slate-600">
                          {resume.status === "uploading" && "Uploading securely..."}
                          {resume.status === "parsing" && "AI extracting achievements..."}
                          {resume.status === "completed" && "Ready for preview"}
                        </p>
                      </div>
                      {resume.status === "parsing" && (
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: "60%"}}></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Step 2: Preview Extracted Achievements */}
      {currentStep === "preview" && completedResumes.length > 0 && (
        <>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 inline mr-3" />
              AI Extraction Complete!
            </h2>
            <p className="text-xl text-slate-600">Review the achievements and skills we found</p>
          </div>

          {completedResumes.map((resume) => (
            <Card key={resume.id}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Preview: {resume.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-6 p-6 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {resume.parsedData?.experience.reduce((acc, exp) => acc + exp.achievements.length, 0)}
                    </div>
                    <div className="text-sm text-slate-600">Achievements Found</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">
                      {resume.parsedData?.skills.length}
                    </div>
                    <div className="text-sm text-slate-600">Skills Identified</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      {resume.parsedData?.experience.length}
                    </div>
                    <div className="text-sm text-slate-600">Work Experiences</div>
                  </div>
                </div>

                {/* Sample Achievements Preview */}
                <div>
                  <h4 className="font-semibold text-slate-900 mb-4">Top Achievements Extracted:</h4>
                  <div className="space-y-3">
                    {resume.parsedData?.experience.slice(0, 2).map((exp, expIndex) => (
                      <div key={expIndex}>
                        <div className="font-medium text-slate-700 mb-2">{exp.title} at {exp.company}</div>
                        {exp.achievements.slice(0, 2).map((achievement, achIndex) => (
                          <div key={achIndex} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg mb-2">
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                            <span className="text-slate-700">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-6">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentStep("upload")}
                  >
                    Upload Another Resume
                  </Button>
                  <Button 
                    onClick={() => setCurrentStep("confirm")}
                    size="lg"
                    className="px-8"
                  >
                    Looks Good - Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* Step 3: Confirm and Complete */}
      {currentStep === "confirm" && (
        <>
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">You're All Set!</h2>
            <p className="text-xl text-slate-600">Your achievements are ready. Let's start optimizing your resumes.</p>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="text-5xl font-bold text-emerald-600 mb-2">
                  {completedResumes.reduce((acc, resume) => 
                    acc + resume.parsedData?.experience.reduce((expAcc, exp) => 
                      expAcc + exp.achievements.length, 0
                    ) || 0, 0
                  )}
                </div>
                <div className="text-lg text-slate-600">achievements ready for optimization</div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center justify-center space-x-2 text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Achievements extracted and categorized</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Skills profile created</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-slate-600">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span>Ready for job-specific optimization</span>
                </div>
              </div>

              <Button 
                onClick={handleCompleteSetup}
                size="lg"
                className="text-lg px-12 py-4"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default GettingStarted;
