
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
import AnalysisResults from "./AnalysisResults";

const JobAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const { getUserSkillNames, saveJobAnalysis, loading } = useJobAnalysis();
  const { generateResumeFromAnalysis } = useResumeVersions();

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

  const analyzeJobMatch = (jobDescription: string) => {
    const { foundSkills, keyRequirements } = extractKeywords(jobDescription);
    
    // Get real user skills from database
    const userSkillNames = getUserSkillNames();

    const matchedSkills = foundSkills.filter(skill => 
      userSkillNames.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const missingSkills = foundSkills.filter(skill => 
      !matchedSkills.includes(skill)
    ).slice(0, 6);

    // Calculate match score based on skills overlap
    const matchScore = Math.min(
      Math.round((matchedSkills.length / Math.max(foundSkills.length, 1)) * 85) + 15,
      95
    );

    // Generate personalized recommendations
    const recommendations = [
      `Emphasize ${matchedSkills.slice(0, 2).join(' and ')} prominently in your resume summary`,
      `Use specific metrics when describing your ${matchedSkills[0] || 'experience'} achievements`,
      missingSkills.length > 0 ? `Consider highlighting any experience with ${missingSkills[0]} or related technologies` : 'Your skills align well with this role',
      `Mirror the job's language - use "${foundSkills[0] || 'relevant keywords'}" instead of synonyms`,
      'Quantify your achievements with specific numbers and percentages'
    ].filter(Boolean);

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

  const handleGenerateResume = () => {
    if (!analysis) {
      toast.error("Please analyze a job first before generating a resume");
      return;
    }
    
    generateResumeFromAnalysis(analysis);
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

          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Analyzing with AI...
              </>
            ) : (
              <>
                <Target className="w-4 h-4 mr-2" />
                Analyze Job Match
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
        />
      )}
    </div>
  );
};

export default JobAnalyzer;
