import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Building, 
  GraduationCap, 
  Award, 
  Mic, 
  User,
  Calendar,
  ArrowRight,
  CheckCircle,
  Briefcase,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useResumeData } from "@/contexts/ResumeDataContext";

interface GettingStartedProps {
  onComplete?: () => void;
}

interface WorkExperienceForm {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  responsibilities: string[];
  accomplishments: string[];
}

interface EducationForm {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  isCurrentlyEnrolled: boolean;
  gpa?: string;
}

interface CertificationForm {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate?: string;
  doesNotExpire: boolean;
}

interface SpeakingEngagementForm {
  title: string;
  event: string;
  location: string;
  date: string;
  description: string;
}

const GettingStarted = ({ onComplete }: GettingStartedProps) => {
  const [currentStep, setCurrentStep] = useState<"work" | "education" | "certifications" | "speaking" | "skills" | "complete">("work");
  const [workExperiences, setWorkExperiences] = useState<WorkExperienceForm[]>([]);
  const [educations, setEducations] = useState<EducationForm[]>([]);
  const [certificationsList, setCertificationsList] = useState<CertificationForm[]>([]);
  const [speakingEngagements, setSpeakingEngagements] = useState<SpeakingEngagementForm[]>([]);
  const [skills, setSkillsLocal] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  
  
  const { setWorkExperience, setEducation, setCertifications, setSkills } = useResumeData();

  // Work Experience Form
  const [workForm, setWorkForm] = useState<WorkExperienceForm>({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    isCurrentRole: false,
    responsibilities: [],
    accomplishments: []
  });

  const [responsibilityInput, setResponsibilityInput] = useState("");
  const [accomplishmentInput, setAccomplishmentInput] = useState("");

  // Education Form
  const [educationForm, setEducationForm] = useState<EducationForm>({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    isCurrentlyEnrolled: false,
    gpa: ""
  });

  // Certification Form
  const [certificationForm, setCertificationForm] = useState<CertificationForm>({
    name: "",
    issuer: "",
    issueDate: "",
    expiryDate: "",
    doesNotExpire: false
  });

  // Speaking Engagement Form
  const [speakingForm, setSpeakingForm] = useState<SpeakingEngagementForm>({
    title: "",
    event: "",
    location: "",
    date: "",
    description: ""
  });

  const addWorkExperience = () => {
    if (!workForm.company || !workForm.position || !workForm.startDate) {
      toast.error("Please fill in company, position, and start date");
      return;
    }

    const newExperience = { ...workForm };
    setWorkExperiences([...workExperiences, newExperience]);
    
    // Reset form
    setWorkForm({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      isCurrentRole: false,
      responsibilities: [],
      accomplishments: []
    });
    
    toast.success("Work experience added!");
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

  const addEducation = () => {
    if (!educationForm.institution || !educationForm.degree) {
      toast.error("Please fill in institution and degree");
      return;
    }

    setEducations([...educations, educationForm]);
    setEducationForm({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      isCurrentlyEnrolled: false,
      gpa: ""
    });
    
    toast.success("Education added!");
  };

  const addCertification = () => {
    if (!certificationForm.name || !certificationForm.issuer) {
      toast.error("Please fill in certification name and issuer");
      return;
    }

    setCertificationsList([...certificationsList, certificationForm]);
    setCertificationForm({
      name: "",
      issuer: "",
      issueDate: "",
      expiryDate: "",
      doesNotExpire: false
    });
    
    toast.success("Certification added!");
  };

  const addSpeakingEngagement = () => {
    if (!speakingForm.title || !speakingForm.event) {
      toast.error("Please fill in title and event");
      return;
    }

    setSpeakingEngagements([...speakingEngagements, speakingForm]);
    setSpeakingForm({
      title: "",
      event: "",
      location: "",
      date: "",
      description: ""
    });
    
    toast.success("Speaking engagement added!");
  };

  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkillsLocal([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  // Helper function to clean and process pasted text
  const cleanPastedText = (text: string): string[] => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.match(/^[•\-\*]\s*$/)) // Remove empty bullet points
      .map(line => line.replace(/^[•\-\*]\s*/, '')) // Remove bullet point prefixes
      .filter(line => line.length > 0);
  };


  const handleComplete = () => {
    // Save all data to context
    const workExpData = workExperiences.map((exp, index) => ({
      id: `work-${index}`,
      company: exp.company,
      position: exp.position,
      startDate: exp.startDate,
      endDate: exp.isCurrentRole ? "" : exp.endDate,
      isCurrentRole: exp.isCurrentRole,
      description: [...exp.responsibilities, ...exp.accomplishments].join('\n'),
      location: "",
      skills: []
    }));

    const educationData = educations.map((edu, index) => ({
      id: `edu-${index}`,
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.isCurrentlyEnrolled ? "" : edu.endDate,
      isCurrentlyEnrolled: edu.isCurrentlyEnrolled,
      gpa: edu.gpa || undefined
    }));

    const certificationData = certificationsList.map((cert, index) => ({
      id: `cert-${index}`,
      name: cert.name,
      issuer: cert.issuer,
      issueDate: cert.issueDate,
      expiryDate: cert.doesNotExpire ? undefined : cert.expiryDate,
      doesNotExpire: cert.doesNotExpire
    }));

    // Update context
    setWorkExperience(workExpData);
    setEducation(educationData);
    setCertifications(certificationData);
    setSkills(skills);

    toast.success("Professional profile created successfully!");
    onComplete?.();
  };

  const steps = [
    { id: "work", title: "Work Experience", icon: Briefcase },
    { id: "education", title: "Education", icon: GraduationCap },
    { id: "certifications", title: "Certifications", icon: Award },
    { id: "speaking", title: "Speaking", icon: Mic },
    { id: "skills", title: "Skills", icon: User },
    { id: "complete", title: "Complete", icon: CheckCircle }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4 mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className={`flex items-center space-x-2 ${currentStep === step.id ? "text-blue-600 font-semibold" : "text-slate-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${currentStep === step.id ? "bg-blue-600 text-white" : "bg-slate-200"}`}>
                <step.icon className="w-4 h-4" />
              </div>
              <span className="hidden md:block">{step.title}</span>
            </div>
            {index < steps.length - 1 && <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">Build Your Professional Profile</h1>
        <p className="text-xl text-slate-600 mb-8">Create your comprehensive career database by adding your experience manually</p>
      </div>


      {/* Work Experience Step */}
      {currentStep === "work" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
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
                  <h4 className="font-medium text-blue-900 mb-1">💡 Manual Copy-Paste</h4>
                  <p className="text-sm text-blue-800">
                    Prefer manual entry? Copy bullet points directly from your resume and paste them in the text areas below. 
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

            {/* Added Work Experiences */}
            {workExperiences.length > 0 && (
              <div>
                <Label>Added Work Experiences</Label>
                <div className="space-y-2 mt-2">
                  {workExperiences.map((exp, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{exp.position} at {exp.company}</div>
                      <div className="text-sm text-slate-600">
                        {exp.startDate} - {exp.isCurrentRole ? "Present" : exp.endDate}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        {exp.responsibilities.length + exp.accomplishments.length} items added
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={addWorkExperience} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Work Experience
              </Button>
              <Button 
                onClick={() => setCurrentStep("education")} 
                variant="outline"
                disabled={workExperiences.length === 0}
              >
                Continue to Education
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Education Step */}
      {currentStep === "education" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education
            </CardTitle>
            <CardDescription>
              Add your educational background.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="institution">Institution *</Label>
                <Input
                  id="institution"
                  value={educationForm.institution}
                  onChange={(e) => setEducationForm({...educationForm, institution: e.target.value})}
                  placeholder="University/College Name"
                />
              </div>
              <div>
                <Label htmlFor="degree">Degree *</Label>
                <Input
                  id="degree"
                  value={educationForm.degree}
                  onChange={(e) => setEducationForm({...educationForm, degree: e.target.value})}
                  placeholder="Bachelor's, Master's, etc."
                />
              </div>
              <div>
                <Label htmlFor="fieldOfStudy">Field of Study</Label>
                <Input
                  id="fieldOfStudy"
                  value={educationForm.fieldOfStudy}
                  onChange={(e) => setEducationForm({...educationForm, fieldOfStudy: e.target.value})}
                  placeholder="Computer Science, Business, etc."
                />
              </div>
              <div>
                <Label htmlFor="gpa">GPA (Optional)</Label>
                <Input
                  id="gpa"
                  value={educationForm.gpa}
                  onChange={(e) => setEducationForm({...educationForm, gpa: e.target.value})}
                  placeholder="3.8"
                />
              </div>
              <div>
                <Label htmlFor="eduStartDate">Start Date</Label>
                <Input
                  id="eduStartDate"
                  type="date"
                  value={educationForm.startDate}
                  onChange={(e) => setEducationForm({...educationForm, startDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="eduEndDate">End Date</Label>
                <Input
                  id="eduEndDate"
                  type="date"
                  value={educationForm.endDate}
                  onChange={(e) => setEducationForm({...educationForm, endDate: e.target.value})}
                  disabled={educationForm.isCurrentlyEnrolled}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="currentlyEnrolled"
                    checked={educationForm.isCurrentlyEnrolled}
                    onCheckedChange={(checked) => setEducationForm({...educationForm, isCurrentlyEnrolled: checked as boolean})}
                  />
                  <Label htmlFor="currentlyEnrolled" className="text-sm">Currently enrolled</Label>
                </div>
              </div>
            </div>

            {/* Added Education */}
            {educations.length > 0 && (
              <div>
                <Label>Added Education</Label>
                <div className="space-y-2 mt-2">
                  {educations.map((edu, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</div>
                      <div className="text-sm text-slate-600">{edu.institution}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={addEducation} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Education
              </Button>
              <Button onClick={() => setCurrentStep("certifications")}>
                Continue to Certifications
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certifications Step */}
      {currentStep === "certifications" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </CardTitle>
            <CardDescription>
              Add your professional certifications.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certName">Certification Name *</Label>
                <Input
                  id="certName"
                  value={certificationForm.name}
                  onChange={(e) => setCertificationForm({...certificationForm, name: e.target.value})}
                  placeholder="AWS Certified Solutions Architect"
                />
              </div>
              <div>
                <Label htmlFor="issuer">Issuing Organization *</Label>
                <Input
                  id="issuer"
                  value={certificationForm.issuer}
                  onChange={(e) => setCertificationForm({...certificationForm, issuer: e.target.value})}
                  placeholder="Amazon Web Services"
                />
              </div>
              <div>
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={certificationForm.issueDate}
                  onChange={(e) => setCertificationForm({...certificationForm, issueDate: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={certificationForm.expiryDate}
                  onChange={(e) => setCertificationForm({...certificationForm, expiryDate: e.target.value})}
                  disabled={certificationForm.doesNotExpire}
                />
                <div className="flex items-center space-x-2 mt-2">
                  <Checkbox
                    id="doesNotExpire"
                    checked={certificationForm.doesNotExpire}
                    onCheckedChange={(checked) => setCertificationForm({...certificationForm, doesNotExpire: checked as boolean})}
                  />
                  <Label htmlFor="doesNotExpire" className="text-sm">Does not expire</Label>
                </div>
              </div>
            </div>

            {/* Added Certifications */}
            {certificationsList.length > 0 && (
              <div>
                <Label>Added Certifications</Label>
                <div className="space-y-2 mt-2">
                  {certificationsList.map((cert, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-sm text-slate-600">{cert.issuer}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={addCertification} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Certification
              </Button>
              <Button onClick={() => setCurrentStep("speaking")}>
                Continue to Speaking
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Speaking Engagements Step */}
      {currentStep === "speaking" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5" />
              Speaking Engagements
            </CardTitle>
            <CardDescription>
              Add your speaking engagements, conferences, and presentations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="speakingTitle">Presentation Title *</Label>
                <Input
                  id="speakingTitle"
                  value={speakingForm.title}
                  onChange={(e) => setSpeakingForm({...speakingForm, title: e.target.value})}
                  placeholder="How to Build Scalable APIs"
                />
              </div>
              <div>
                <Label htmlFor="event">Event/Conference *</Label>
                <Input
                  id="event"
                  value={speakingForm.event}
                  onChange={(e) => setSpeakingForm({...speakingForm, event: e.target.value})}
                  placeholder="Tech Conference 2024"
                />
              </div>
              <div>
                <Label htmlFor="speakingLocation">Location</Label>
                <Input
                  id="speakingLocation"
                  value={speakingForm.location}
                  onChange={(e) => setSpeakingForm({...speakingForm, location: e.target.value})}
                  placeholder="San Francisco, CA"
                />
              </div>
              <div>
                <Label htmlFor="speakingDate">Date</Label>
                <Input
                  id="speakingDate"
                  type="date"
                  value={speakingForm.date}
                  onChange={(e) => setSpeakingForm({...speakingForm, date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="speakingDescription">Description</Label>
              <Textarea
                id="speakingDescription"
                value={speakingForm.description}
                onChange={(e) => setSpeakingForm({...speakingForm, description: e.target.value})}
                placeholder="Paste or type a description of your presentation, key points covered, audience size, etc..."
                rows={4}
                className="resize-y"
              />
            </div>

            {/* Added Speaking Engagements */}
            {speakingEngagements.length > 0 && (
              <div>
                <Label>Added Speaking Engagements</Label>
                <div className="space-y-2 mt-2">
                  {speakingEngagements.map((speaking, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium">{speaking.title}</div>
                      <div className="text-sm text-slate-600">{speaking.event}</div>
                      {speaking.location && (
                        <div className="text-sm text-slate-500">{speaking.location}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={addSpeakingEngagement} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Speaking Engagement
              </Button>
              <Button onClick={() => setCurrentStep("skills")}>
                Continue to Skills
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Step */}
      {currentStep === "skills" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Skills
            </CardTitle>
            <CardDescription>
              Add your technical and professional skills.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Textarea
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Paste your skills here (comma-separated or one per line) or type individual skills..."
                rows={3}
                className="resize-none"
              />
              <div className="flex gap-2">
                <Button onClick={addSkill} variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Single Skill
                </Button>
                <Button 
                  onClick={() => {
                    // Handle both comma-separated and line-separated skills
                    const skillText = skillInput.trim();
                    if (!skillText) return;
                    
                    let skillsList: string[] = [];
                    
                    // Check if it contains commas (comma-separated)
                    if (skillText.includes(',')) {
                      skillsList = skillText.split(',').map(skill => skill.trim()).filter(skill => skill);
                    } else {
                      // Treat as line-separated
                      skillsList = skillText.split('\n').map(skill => skill.trim()).filter(skill => skill);
                    }
                    
                    // Filter out duplicates
                    const newSkills = skillsList.filter(skill => !skills.includes(skill));
                    
                    if (newSkills.length > 0) {
                      setSkillsLocal([...skills, ...newSkills]);
                      setSkillInput("");
                      toast.success(`Added ${newSkills.length} skills`);
                    } else {
                      toast.warning("No new skills to add");
                    }
                  }} 
                  variant="default" 
                  size="sm"
                  disabled={!skillInput.trim()}
                >
                  Add All Skills
                </Button>
              </div>
            </div>

            {skills.length > 0 && (
              <div>
                <Label>Added Skills</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((skill, index) => (
                    <div key={index} className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {skill}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 w-4 p-0 hover:bg-blue-200"
                        onClick={() => setSkillsLocal(skills.filter((_, i) => i !== index))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={() => setCurrentStep("complete")} className="flex-1">
                Complete Profile Setup
                <CheckCircle className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      {currentStep === "complete" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Profile Complete!
            </CardTitle>
            <CardDescription>
              Review your professional profile before saving.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-6 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{workExperiences.length}</div>
                <div className="text-sm text-slate-600">Work Experiences</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600">{educations.length}</div>
                <div className="text-sm text-slate-600">Education</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{certificationsList.length}</div>
                <div className="text-sm text-slate-600">Certifications</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-600">{speakingEngagements.length}</div>
                <div className="text-sm text-slate-600">Speaking</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{skills.length}</div>
                <div className="text-sm text-slate-600">Skills</div>
              </div>
            </div>

            <Button onClick={handleComplete} size="lg" className="w-full">
              Save Profile & Go to My Resume
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default GettingStarted;