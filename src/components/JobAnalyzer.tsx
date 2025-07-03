
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Target, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface JobAnalysis {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  keyRequirements: string[];
  recommendations: string[];
}

const JobAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    
    // Simulate user's existing skills (in real app, this would come from user profile)
    const userSkills = [
      'product management', 'agile', 'scrum', 'data analysis', 'leadership',
      'stakeholder management', 'cross-functional', 'strategic planning',
      'user experience', 'communication', 'teamwork', 'problem solving'
    ];

    const matchedSkills = foundSkills.filter(skill => 
      userSkills.some(userSkill => 
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
      matchScore,
      matchedSkills: matchedSkills.map(skill => 
        skill.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      ).slice(0, 8),
      missingSkills: missingSkills.map(skill => 
        skill.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
      ),
      keyRequirements: keyRequirements.length > 0 ? keyRequirements : [
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
    
    // Simulate processing time for better UX
    setTimeout(() => {
      const analysis = analyzeJobMatch(jobDescription);
      setAnalysis(analysis);
      setIsAnalyzing(false);
      toast.success("Job analysis complete!");
    }, 1500);
  };

  const handleGenerateResume = () => {
    toast.success("AI-tailored resume generated! Check your Resume Versions tab.");
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
                placeholder="e.g., TechCorp Inc."
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
        <div className="space-y-6">
          {/* Match Score */}
          <Card>
            <CardHeader>
              <CardTitle>Match Analysis Results</CardTitle>
              <CardDescription>
                Based on your logged achievements and the job requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-blue-600 mb-2">{analysis.matchScore}%</div>
                <div className="text-slate-600">Overall Match Score</div>
                <Progress value={analysis.matchScore} className="mt-4 h-3" />
              </div>
              
              <div className="flex justify-center gap-4">
                <Button onClick={handleGenerateResume} className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Tailored Resume
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => toast.success("Optimization suggestions will help improve your match score!")}
                  className="border-blue-200 hover:bg-blue-50"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Improve Match Score
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Skills Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  Matched Skills
                </CardTitle>
                <CardDescription>Skills you have that match the job</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.matchedSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="border-green-200 text-green-700 bg-green-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  Skills to Develop
                </CardTitle>
                <CardDescription>Areas for improvement or learning</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.missingSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Key Job Requirements</CardTitle>
              <CardDescription>Critical requirements extracted from the job description</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.keyRequirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-slate-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>AI Recommendations</CardTitle>
              <CardDescription>Personalized advice to improve your application</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-slate-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default JobAnalyzer;
