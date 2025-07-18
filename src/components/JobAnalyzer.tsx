
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Target, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useJobAnalysis, type JobAnalysis } from "@/hooks/useJobAnalysis";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import { useResumeData } from "@/contexts/ResumeDataContext";
import AnalysisResults from "./AnalysisResults";

const JobAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentlyCreatedResumeId, setRecentlyCreatedResumeId] = useState<string | null>(null);
  
  const { getUserSkillNames, saveJobAnalysis, loading } = useJobAnalysis();
  const { generateResumeFromAnalysis } = useResumeVersions();
  const { workExperience, education, certifications, skills, personalInfo } = useResumeData();

  // Enhanced keyword extraction and analysis
  const extractKeywords = (text: string) => {
    const commonSkills = [
      'python', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes',
      'agile', 'scrum', 'product management', 'data analysis', 'machine learning',
      'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
      'strategic planning', 'user experience', 'ux', 'ui', 'design', 'figma',
      'stakeholder management', 'cross-functional', 'b2b', 'saas', 'api', 'rest',
      'microservices', 'ci/cd', 'git', 'jira', 'confluence', 'adobe', 'salesforce'
    ];

    const requirements = [
      'bachelor', 'master', 'degree', 'years experience', 'experience in',
      'required', 'must have', 'essential', 'preferred', 'certification'
    ];

    const lowerText = text.toLowerCase();
    
    const foundSkills = commonSkills.filter(skill => 
      lowerText.includes(skill.toLowerCase())
    );

    const foundRequirements = requirements.filter(req =>
      lowerText.includes(req.toLowerCase())
    );

    // Extract year requirements
    const yearMatches = text.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/gi) || [];
    
    // Extract specific requirements by sentence
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const keyRequirements = sentences
      .filter(sentence => {
        const lower = sentence.toLowerCase();
        return lower.includes('required') || lower.includes('must') || 
               lower.includes('essential') || lower.includes('experience') ||
               lower.includes('degree') || lower.includes('certification');
      })
      .slice(0, 5)
      .map(req => req.trim());

    return { foundSkills, foundRequirements, yearMatches, keyRequirements };
  };

  // Check if user has sufficient resume data for analysis
  const hassufficientData = () => {
    const hasWorkExperience = workExperience && workExperience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;
    const hasPersonalInfo = personalInfo && personalInfo.name;
    
    // Require at least work experience and skills, or education and skills
    return (hasWorkExperience && hasSkills) || (hasEducation && hasSkills);
  };

  const analyzeJobMatch = (jobDescription: string) => {
    const { foundSkills, keyRequirements } = extractKeywords(jobDescription);
    
    // Check if we have sufficient data for meaningful analysis
    if (!hassufficientData()) {
      return {
        job_title: jobTitle,
        company: company,
        job_description: jobDescription,
        match_score: 0, // No score when insufficient data
        matched_skills: [],
        missing_skills: foundSkills.map(skill => 
          skill.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        ).slice(0, 8),
        key_requirements: keyRequirements.length > 0 ? keyRequirements : [
          'Review the full job description for specific requirements',
          'Experience in relevant field',
          'Strong communication and collaboration skills'
        ],
        recommendations: [
          'Add your work experience to get personalized recommendations',
          'Include your skills and certifications for better matching',
          'Complete your education information if applicable',
          'Upload or manually enter your professional background',
          'The more data you provide, the better recommendations you\'ll receive'
        ]
      };
    }
    
    // Get real user skills from database and resume context
    const userSkillNames = getUserSkillNames();
    const resumeSkillNames = skills || [];
    const allUserSkills = [...new Set([...userSkillNames, ...resumeSkillNames])];

    const matchedSkills = foundSkills.filter(skill => 
      allUserSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const missingSkills = foundSkills.filter(skill => 
      !matchedSkills.includes(skill)
    ).slice(0, 6);

    // Calculate match score based on skills overlap and data completeness
    const skillsMatchRatio = matchedSkills.length / Math.max(foundSkills.length, 1);
    const baseScore = Math.round(skillsMatchRatio * 85) + 15;
    
    // Boost score based on available resume data
    let dataCompletenessBonus = 0;
    if (workExperience && workExperience.length > 0) dataCompletenessBonus += 5;
    if (education && education.length > 0) dataCompletenessBonus += 3;
    if (certifications && certifications.length > 0) dataCompletenessBonus += 2;
    
    const matchScore = Math.min(baseScore + dataCompletenessBonus, 95);

    // Generate personalized recommendations based on user's actual data
    const recommendations = [];
    
    if (matchedSkills.length > 0) {
      recommendations.push(`Emphasize ${matchedSkills.slice(0, 2).join(' and ')} prominently in your resume summary`);
    }
    
    if (workExperience && workExperience.length > 0) {
      recommendations.push(`Use specific metrics when describing your ${matchedSkills[0] || 'professional'} achievements`);
    }
    
    if (missingSkills.length > 0) {
      recommendations.push(`Consider highlighting any experience with ${missingSkills[0]} or related technologies`);
    } else {
      recommendations.push('Your skills align well with this role');
    }
    
    recommendations.push(`Mirror the job's language - use "${foundSkills[0] || 'relevant keywords'}" instead of synonyms`);
    recommendations.push('Quantify your achievements with specific numbers and percentages');

    return {
      job_title: jobTitle,
      company: company,
      job_description: jobDescription,
      match_score: matchScore,
      matched_skills: matchedSkills.map(skill => 
        skill.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      ).slice(0, 8),
      missing_skills: missingSkills.map(skill => 
        skill.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      ),
      key_requirements: keyRequirements.length > 0 ? keyRequirements : [
        'Review the full job description for specific requirements',
        'Experience in relevant field',
        'Strong communication and collaboration skills'
      ],
      recommendations
    };
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error("Please paste a job description to analyze");
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Simulate processing time for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const analysisResult = analyzeJobMatch(jobDescription);
      setAnalysis(analysisResult);
      
      // Save to database
      const savedAnalysis = await saveJobAnalysis(analysisResult);
      if (savedAnalysis) {
        toast.success("Job analysis complete and saved!");
      } else {
        toast.success("Job analysis complete!");
        toast.error("Failed to save analysis to database");
      }
    } catch (error) {
      toast.error("Analysis failed. Please try again.");
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateResume = async () => {
    if (!analysis) {
      toast.error("Please analyze a job first before generating a resume");
      return;
    }
    
    const newResume = await generateResumeFromAnalysis(analysis);
    if (newResume) {
      setRecentlyCreatedResumeId(newResume.id);
    }
  };

  const handleNavigateToVault = () => {
    // This will be handled by the parent component (Index.tsx)
    // Reset state and switch to Resume Vault tab
    setRecentlyCreatedResumeId(null);
    // Trigger navigation to resume vault
    window.dispatchEvent(new CustomEvent('navigateToResumeVault'));
  };

  return (
    <div className="space-y-6">
      {/* Job Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Analyze Job Description
          </CardTitle>
          <CardDescription>
            Paste a job description to get AI-powered matching and resume optimization
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
                placeholder="e.g., Google, Microsoft, Airbnb"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Description</label>
            <Textarea
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="min-h-[200px]"
            />
          </div>

          {!hassufficientData() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Insufficient Resume Data</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Please add your work experience, education, and skills to get meaningful job analysis. 
                Go to "My Resume" section to complete your profile.
              </p>
            </div>
          )}

          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !hassufficientData()}
            className={`w-full ${
              hassufficientData() 
                ? "bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700" 
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analyze & Optimize
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <AnalysisResults 
          analysis={analysis} 
          onGenerateResume={handleGenerateResume}
          onNavigateToVault={handleNavigateToVault}
          recentlyCreatedResumeId={recentlyCreatedResumeId}
        />
      )}
    </div>
  );
};

export default JobAnalyzer;
