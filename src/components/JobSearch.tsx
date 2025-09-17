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
  Clock,
  Globe
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import JobMatchAnalyzer from "./JobMatchAnalyzer";

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

interface WebJobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  experienceLevel: string;
  employmentType: string;
  salaryRange?: string;
  posted: string;
  applyUrl?: string;
  source: string;
}

interface JobSearchParams {
  jobTitle: string;
  location?: string;
  experienceLevel?: string;
  skills?: string[];
  remoteWork?: boolean;
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
  const [activeTab, setActiveTab] = useState("browse");
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedJob, setProcessedJob] = useState<ProcessedJob | null>(null);
  const [jobMatch, setJobMatch] = useState<JobMatch | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Web search state
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    jobTitle: "",
    location: "Remote",
    experienceLevel: "Mid-level",
    skills: [],
    remoteWork: true
  });
  const [webJobs, setWebJobs] = useState<WebJobListing[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedWebJob, setSelectedWebJob] = useState<WebJobListing | null>(null);
  
  const { user } = useAuth();
  const { workExperience, education, certifications, skills, personalInfo } = useResumeData();
  const { generateResumeFromJobData } = useResumeVersions();

  // Detect if user is on Chrome
  const isChrome = () => {
    return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
  };

  // Check if user has sufficient resume data for analysis
  const hasSufficientData = () => {
    const hasWorkExperience = workExperience && workExperience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;
    const hasPersonalInfo = personalInfo && personalInfo.name;
    
    return (hasWorkExperience && hasSkills) || (hasEducation && hasSkills);
  };

  const searchJobsWithClaude = async () => {
    if (!searchParams.jobTitle.trim()) {
      toast.error("Please enter a job title to search");
      return;
    }

    setIsSearching(true);
    setWebJobs([]);
    
    try {
      console.log('Searching for jobs with params:', searchParams);
      
      const response = await supabase.functions.invoke('search-jobs-with-claude', {
        body: {
          jobTitle: searchParams.jobTitle,
          location: searchParams.location,
          experienceLevel: searchParams.experienceLevel,
          skills: searchParams.skills,
          remoteWork: searchParams.remoteWork
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Failed to search for jobs');
      }

      setWebJobs(response.data.jobs || []);
      toast.success(`Found ${response.data.jobs?.length || 0} job listings!`);
    } catch (error) {
      console.error('Error searching jobs:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to search for jobs: ${errorMessage}`);
    } finally {
      setIsSearching(false);
    }
  };

  const selectWebJob = (job: WebJobListing) => {
    setSelectedWebJob(job);
    
    // Convert WebJobListing to ProcessedJob format
    const processedWebJob: ProcessedJob = {
      company_name: job.company,
      title: job.title,
      category: 'Technology', // Default category
      employment_type: job.employmentType,
      workplace_type: job.location.toLowerCase().includes('remote') ? 'Remote' : 'On-site',
      locations: [job.location],
      description_text: job.description,
      requirements_summary: job.requirements.join('. '),
      skills: job.skills,
      experience_min_years: job.experienceLevel.toLowerCase().includes('senior') ? 5 : 
                           job.experienceLevel.toLowerCase().includes('junior') ? 1 : 3
    };
    
    setProcessedJob(processedWebJob);
    setActiveTab("analysis");
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

      console.log('Job analysis complete for:', processedJob.title);

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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Browse Jobs</span>
          </TabsTrigger>
          <TabsTrigger value="match" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            <span>Job Match</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Browse Jobs on HiringCafe
              </CardTitle>
              <CardDescription>
                Explore thousands of job opportunities and easily copy job descriptions for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-800 rounded-full p-2 flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">How to use:</h4>
                    <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 ml-4 list-decimal">
                      <li>Browse jobs in the embedded HiringCafe below</li>
                      <li>Click on any job to view its full description</li>
                      <li>Copy the job description text</li>
                      <li>Switch to the "Job Match" tab and paste the description</li>
                      <li>Analyze the job match with your resume</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Chrome-specific warning */}
              {isChrome() && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-2 flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100">Chrome Users Notice:</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Due to Chrome's security policies, the "Copy Job Description" button may not work in the embedded view below. 
                        For the best experience, we recommend opening HiringCafe in a new tab or manually selecting and copying text (Ctrl+C).
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                <Button 
                  onClick={() => window.open('https://hiring.cafe', '_blank')}
                  variant={isChrome() ? "default" : "outline"}
                  className="flex items-center gap-2"
                >
                  <Globe className="w-4 h-4" />
                  {isChrome() ? "Open in New Tab (Recommended for Chrome)" : "Open in New Tab"}
                </Button>
                <Button 
                  onClick={() => setActiveTab('match')}
                  variant={isChrome() ? "outline" : "default"}
                  className="flex items-center gap-2"
                >
                  <Target className="w-4 h-4" />
                  Go to Job Match
                </Button>
              </div>

              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <iframe
                  src="https://hiring.cafe"
                  className="w-full h-[800px] border-0"
                  title="HiringCafe Job Browser"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-popups-to-escape-sandbox"
                  allow="clipboard-read; clipboard-write"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="match" className="space-y-4">
          <JobMatchAnalyzer />
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