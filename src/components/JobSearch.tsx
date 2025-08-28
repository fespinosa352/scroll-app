import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  Search, 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Briefcase,
  MapPin,
  Calendar,
  Building,
  Users,
  TrendingUp,
  FileText,
  Sparkles,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { useResumeVersions } from "@/hooks/useResumeVersions";

interface ProcessedJob {
  job_id?: string;
  company_name: string;
  title: string;
  category: string;
  employment_type: string;
  workplace_type: string;
  locations: string[];
  description_text: string;
  requirements_summary: string;
  skills: string[];
  experience_min_years: number;
}

interface JobMatch {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  recommendations: string[];
  strengths: string[];
  improvement_areas: string[];
}

const JobSearch = () => {
  const [activeTab, setActiveTab] = useState("paste");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedJob, setProcessedJob] = useState<ProcessedJob | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { user } = useAuth();
  const { workExperience, education, certifications, skills, personalInfo } = useResumeData();
  const { generateResumeFromJobData } = useResumeVersions();

  // Check if user has sufficient resume data for analysis
  const hasSufficientData = () => {
    const hasWorkExperience = workExperience && workExperience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;
    const hasPersonalInfo = personalInfo && personalInfo.name;
    
    return (hasWorkExperience && hasSkills) || (hasEducation && hasSkills);
  };

  const processJobDescription = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description");
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await supabase.functions.invoke('process-job-description', {
        body: {
          jobDescription,
          jobTitle,
          company,
          userId: user?.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to process job description');
      }

      setProcessedJob(response.data.data);
      toast.success("Job description processed successfully!");
      setActiveTab("analysis");
    } catch (error) {
      console.error('Error processing job:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to process job description: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeJobMatch = async () => {
    if (!processedJob || !hasSufficientData()) {
      toast.error("Please complete your profile first to get job matching");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Get user skills from database
      const { data: userSkills } = await supabase
        .from('user_skills')
        .select('skill_name')
        .eq('user_id', user?.id);

      const allUserSkills = [
        ...(skills || []),
        ...(userSkills?.map(s => s.skill_name) || [])
      ];

      // Simple matching algorithm (could be enhanced with Claude API)
      const jobSkills = processedJob.skills.map(s => s.toLowerCase());
      const userSkillsLower = allUserSkills.map(s => s.toLowerCase());
      
      const matchedSkills = jobSkills.filter(skill => 
        userSkillsLower.some(userSkill => 
          userSkill.includes(skill) || skill.includes(userSkill)
        )
      );

      const missingSkills = jobSkills.filter(skill => !matchedSkills.includes(skill));
      
      const matchScore = Math.min(
        Math.round((matchedSkills.length / Math.max(jobSkills.length, 1)) * 100),
        95
      );

      const match: JobMatch = {
        match_score: matchScore,
        matched_skills: matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        missing_skills: missingSkills.slice(0, 8).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
        recommendations: [
          `Emphasize your ${matchedSkills.slice(0, 2).join(' and ')} experience`,
          `Quantify achievements in your ${processedJob.category.toLowerCase()} work`,
          `Use keywords from the job description in your resume`,
          `Highlight relevant projects and impact metrics`
        ],
        strengths: matchedSkills.length > 0 ? [
          `Strong match in ${matchedSkills.slice(0, 3).join(', ')}`,
          `Experience aligns with ${processedJob.category} requirements`
        ] : ["Review job requirements and update your profile"],
        improvement_areas: missingSkills.length > 0 ? [
          `Consider developing skills in ${missingSkills.slice(0, 2).join(', ')}`,
          `Add relevant certifications if available`
        ] : ["Strong skill alignment with job requirements"]
      };

      setJobMatch(match);

      // Save interaction to database
      if (processedJob.job_id) {
        await supabase.from('job_user_interactions').insert({
          user_id: user?.id,
          job_id: processedJob.job_id,
          interaction_type: 'analyzed',
          match_score: match.match_score,
          matched_skills: match.matched_skills,
          missing_skills: match.missing_skills,
          recommendations: match.recommendations
        });
      }

      toast.success("Job analysis complete!");
    } catch (error) {
      console.error('Error analyzing job match:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to analyze job match: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateOptimizedResume = async () => {
    if (!processedJob || !jobMatch) {
      toast.error("Please analyze the job first");
      return;
    }

    try {
      const resumeName = `${processedJob.company_name} - ${processedJob.title}`;
      const newResume = await generateResumeFromJobData(processedJob, jobMatch, resumeName);
      
      if (newResume) {
        // Save interaction
        if (processedJob.job_id) {
          await supabase.from('job_user_interactions').insert({
            user_id: user?.id,
            job_id: processedJob.job_id,
            interaction_type: 'resume_generated',
            generated_resume_id: newResume.id
          });
        }
        
        toast.success("Optimized resume generated!");
        // Navigate to editor or resume vault
        window.dispatchEvent(new CustomEvent('navigateToEditor', { detail: { resumeId: newResume.id } }));
      }
    } catch (error) {
      console.error('Error generating resume:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to generate resume: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Smart Job Search</h2>
        <p className="text-slate-600">Analyze job descriptions and optimize your resume with AI</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="paste" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            <span>Paste Job</span>
          </TabsTrigger>
          <TabsTrigger value="analysis" disabled={!processedJob} className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="optimize" disabled={!jobMatch} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>Optimize</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paste" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Job Information
              </CardTitle>
              <CardDescription>
                Paste a job description to get AI-powered analysis and resume optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Job Title</label>
                  <Input
                    placeholder="e.g., Senior Product Manager"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <Input
                    placeholder="e.g., Google, Microsoft"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Description</label>
                <Textarea
                  placeholder="Paste the complete job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="min-h-[300px]"
                />
              </div>

              <Button 
                onClick={processJobDescription}
                disabled={isProcessing || !jobDescription.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Process Job Description
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          {processedJob && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Building className="w-5 h-5" />
                      {processedJob.title}
                    </span>
                    <Badge variant="secondary">{processedJob.category}</Badge>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <Building className="w-4 h-4" />
                      {processedJob.company_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {processedJob.employment_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {processedJob.workplace_type}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {processedJob.locations.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="w-4 h-4" />
                      {processedJob.locations.join(', ')}
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2">Requirements Summary</h4>
                    <p className="text-sm text-slate-600">{processedJob.requirements_summary}</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Key Skills Required</h4>
                    <div className="flex flex-wrap gap-2">
                      {processedJob.skills.map((skill, index) => (
                        <Badge key={index} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  {processedJob.experience_min_years > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      Minimum {processedJob.experience_min_years} years of experience required
                    </div>
                  )}

                  {!hasSufficientData() ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-amber-800">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Complete Your Profile</span>
                      </div>
                      <p className="text-sm text-amber-700 mt-1">
                        Add your work experience and skills to get personalized job matching and resume optimization.
                      </p>
                    </div>
                  ) : (
                    <Button 
                      onClick={analyzeJobMatch}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Analyzing Match...
                        </>
                      ) : (
                        <>
                          <TrendingUp className="w-4 h-4 mr-2" />
                          Analyze Job Match
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>

              {jobMatch && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      Match Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Match Score</span>
                        <span className="text-2xl font-bold text-emerald-600">{jobMatch.match_score}%</span>
                      </div>
                      <Progress value={jobMatch.match_score} className="h-2" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2 text-emerald-700">Matched Skills</h4>
                        <div className="space-y-1">
                          {jobMatch.matched_skills.map((skill, index) => (
                            <Badge key={index} className="bg-emerald-100 text-emerald-800 border-emerald-200">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-amber-700">Skills to Develop</h4>
                        <div className="space-y-1">
                          {jobMatch.missing_skills.map((skill, index) => (
                            <Badge key={index} variant="outline" className="border-amber-200 text-amber-700">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="space-y-1 text-sm">
                        {jobMatch.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button 
                      onClick={() => setActiveTab("optimize")}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Optimize Resume for This Job
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="optimize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Resume Optimization
              </CardTitle>
              <CardDescription>
                Generate a tailored resume optimized for this specific job
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {jobMatch && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Optimization Strategy</h4>
                    <ul className="space-y-2 text-sm text-blue-800">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        Emphasize {jobMatch.matched_skills.slice(0, 2).join(' and ')} prominently
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        Mirror job description keywords for ATS optimization
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        Quantify achievements relevant to {processedJob?.category} roles
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                        Structure content for maximum ATS compatibility
                      </li>
                    </ul>
                  </div>

                  <Button 
                    onClick={generateOptimizedResume}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    size="lg"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    Generate Optimized Resume
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default JobSearch;