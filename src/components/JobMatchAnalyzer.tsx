import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Target, 
  AlertCircle, 
  CheckCircle, 
  Brain,
  FileText,
  BarChart3,
  Lightbulb,
  Clock,
  Star,
  TrendingUp,
  Zap,
  ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import { useJobAnalysis, type JobAnalysis } from '@/hooks/useJobAnalysis';
import { useResumeVersions } from '@/hooks/useResumeVersions';
import { useResumeData } from '@/contexts/ResumeDataContext';
import { useMarkupConverter } from '@/hooks/useMarkupConverter';
import AnalysisResults from './AnalysisResults';

interface ATSScore {
  overall: number;
  keyword: number;
  content: number;
  structure: number;
  experience: number;
}

interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  importance: 'high' | 'medium' | 'low';
  found: boolean;
  suggestions: string[];
}

interface ClaudeAnalysisResponse {
  overallScore: number;
  categoryScores: {
    keyword: number;
    content: number;
    structure: number;
    experience: number;
  };
  keywordAnalysis: Array<{
    keyword: string;
    found: boolean;
    frequency: number;
    importance: 'high' | 'medium' | 'low';
    suggestions: string[];
  }>;
  suggestions: Array<{
    type: 'critical' | 'important' | 'suggestion';
    category: string;
    title: string;
    description: string;
    impact: number;
    autoFixAvailable: boolean;
  }>;
  strengths: string[];
  improvements: string[];
}

const JobMatchAnalyzer = () => {
  const [jobDescription, setJobDescription] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [atsScore, setATSScore] = useState<ATSScore>({
    overall: 0,
    keyword: 0,
    content: 0,
    structure: 0,
    experience: 0
  });
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [claudeAnalysis, setClaudeAnalysis] = useState<ClaudeAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recentlyCreatedResumeId, setRecentlyCreatedResumeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('analysis');
  
  const { getUserSkillNames, saveJobAnalysis } = useJobAnalysis();
  const { generateResumeFromAnalysis } = useResumeVersions();
  const { workExperience, education, certifications, skills, personalInfo } = useResumeData();
  const { convertMarkupToStructured } = useMarkupConverter();

  // Generate resume content from user data
  const generateResumeContent = useCallback(() => {
    let content = '';
    
    // Personal Info
    if (personalInfo?.name) {
      content += `# ${personalInfo.name}\n\n`;
      if (personalInfo.email) content += `${personalInfo.email}\n`;
      if (personalInfo.phone) content += `${personalInfo.phone}\n`;
      if (personalInfo.location) content += `${personalInfo.location}\n`;
      content += '\n';
    }

    // Work Experience
    if (workExperience?.length > 0) {
      content += '## Professional Experience\n\n';
      workExperience.forEach(exp => {
        content += `### ${exp.position}\n`;
        content += `**${exp.company}**\n`;
        if (exp.startDate || exp.endDate) {
          const start = exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
          const end = exp.isCurrentRole ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');
          content += `${start} - ${end}\n\n`;
        }
        if (exp.description) {
          const bullets = exp.description.split('\n').filter(line => line.trim());
          bullets.forEach(bullet => {
            const cleanBullet = bullet.replace(/^[•\-*]\s*/, '');
            content += `- ${cleanBullet}\n`;
          });
        }
        content += '\n';
      });
    }

    // Education
    if (education?.length > 0) {
      content += '## Education\n\n';
      education.forEach(edu => {
        content += `### ${edu.degree}\n`;
        content += `**${edu.institution}**\n`;
        if (edu.fieldOfStudy) content += `${edu.fieldOfStudy}\n`;
        if (edu.startDate) {
          const year = new Date(edu.startDate).getFullYear();
          content += `${year}\n`;
        }
        if (edu.gpa) content += `GPA: ${edu.gpa}\n`;
        content += '\n';
      });
    }

    // Skills
    if (skills?.length > 0) {
      content += '## Skills\n\n';
      skills.forEach(skill => {
        content += `- ${skill}\n`;
      });
      content += '\n';
    }

    // Certifications
    if (certifications?.length > 0) {
      content += '## Certifications\n\n';
      certifications.forEach(cert => {
        content += `### ${cert.name}\n`;
        content += `**${cert.issuer}**\n`;
        if (cert.issueDate) {
          const year = new Date(cert.issueDate).getFullYear();
          content += `${year}\n`;
        }
        content += '\n';
      });
    }

    return content;
  }, [workExperience, education, certifications, skills, personalInfo]);

  // Call Claude API for comprehensive analysis
  const analyzeWithClaude = useCallback(async (jobDesc: string, resumeContent: string) => {
    if (!jobDesc.trim() || !resumeContent.trim()) return null;

    try {
      const response = await fetch('https://hwonitvnvhcepwjqeodj.supabase.co/functions/v1/claude-ats-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDesc,
          resumeContent: resumeContent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Claude analysis error:', error);
      return null;
    }
  }, []);

  // Enhanced job matching logic
  const performJobMatch = useCallback(async () => {
    if (!jobDescription.trim()) return;

    setIsAnalyzing(true);
    
    try {
      const resumeContent = generateResumeContent();
      
      // Get Claude analysis for enhanced scoring
      const claudeResult = await analyzeWithClaude(jobDescription, resumeContent);
      
      if (claudeResult) {
        setClaudeAnalysis(claudeResult);
        setATSScore({
          overall: claudeResult.overallScore,
          keyword: claudeResult.categoryScores.keyword,
          content: claudeResult.categoryScores.content,
          structure: claudeResult.categoryScores.structure,
          experience: claudeResult.categoryScores.experience
        });
        setKeywordAnalysis(claudeResult.keywordAnalysis || []);
      }

      // Create traditional job analysis
      const jobAnalysisResult = await performTraditionalAnalysis();
      setAnalysis(jobAnalysisResult);
      
      // Save to database
      const savedAnalysis = await saveJobAnalysis(jobAnalysisResult);
      if (savedAnalysis) {
        toast.success("Job match analysis complete!");
      }
      
    } catch (error) {
      console.error('Job match analysis error:', error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobDescription, generateResumeContent, analyzeWithClaude, saveJobAnalysis]);

  // Traditional analysis for compatibility
  const performTraditionalAnalysis = useCallback(async () => {
    const extractedKeywords = extractJobKeywords(jobDescription);
    const userSkillNames = getUserSkillNames();
    const resumeSkillNames = skills || [];
    const allUserSkills = [...new Set([...userSkillNames, ...resumeSkillNames])];

    const matchedSkills = extractedKeywords.filter(keyword => 
      allUserSkills.some(userSkill => 
        userSkill.toLowerCase().includes(keyword.toLowerCase()) ||
        keyword.toLowerCase().includes(userSkill.toLowerCase())
      )
    );

    const missingSkills = extractedKeywords.filter(keyword => 
      !matchedSkills.includes(keyword)
    ).slice(0, 6);

    const skillsMatchRatio = matchedSkills.length / Math.max(extractedKeywords.length, 1);
    
    // More realistic scoring that heavily weights skill match
    let baseScore = Math.round(skillsMatchRatio * 100); // Base score purely on skill match (0-100%)
    
    // Only give bonuses if there are actual skill matches
    let relevancyBonus = 0;
    if (skillsMatchRatio > 0.3) { // Only if 30%+ skill match
      if (workExperience?.length > 0) relevancyBonus += 5;
      if (education?.length > 0) relevancyBonus += 3;
      if (certifications?.length > 0) relevancyBonus += 2;
    }
    
    // Experience relevancy - check if work experience titles/descriptions match job keywords
    let experienceRelevancyBonus = 0;
    if (workExperience?.length > 0 && skillsMatchRatio > 0.2) {
      const experienceText = workExperience.map(exp => 
        `${exp.position} ${exp.description}`.toLowerCase()
      ).join(' ');
      
      const relevantKeywords = extractedKeywords.filter(keyword => 
        experienceText.includes(keyword.toLowerCase())
      );
      
      experienceRelevancyBonus = Math.min(relevantKeywords.length * 2, 8); // Max 8 points
    }
    
    const matchScore = Math.min(baseScore + relevancyBonus + experienceRelevancyBonus, 100);

    const recommendations = [
      `Emphasize ${matchedSkills.slice(0, 2).join(' and ')} prominently in your resume`,
      'Use specific metrics when describing your achievements',
      'Mirror the job\'s language and terminology',
      'Quantify your achievements with numbers and percentages'
    ];

    if (missingSkills.length > 0) {
      recommendations.push(`Consider highlighting experience with ${missingSkills[0]} or related technologies`);
    }

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
      key_requirements: extractKeyRequirements(jobDescription),
      recommendations
    };
  }, [jobDescription, jobTitle, company, getUserSkillNames, skills, workExperience, education, certifications]);

  // Extract keywords from job description
  const extractJobKeywords = (description: string) => {
    const commonSkills = [
      'python', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes',
      'agile', 'scrum', 'product management', 'data analysis', 'machine learning',
      'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
      'strategic planning', 'user experience', 'ux', 'ui', 'design', 'figma'
    ];

    const lowerText = description.toLowerCase();
    return commonSkills.filter(skill => lowerText.includes(skill.toLowerCase()));
  };

  // Extract key requirements
  const extractKeyRequirements = (description: string) => {
    const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 10);
    return sentences
      .filter(sentence => {
        const lower = sentence.toLowerCase();
        return lower.includes('required') || lower.includes('must') || 
               lower.includes('essential') || lower.includes('experience') ||
               lower.includes('degree') || lower.includes('certification');
      })
      .slice(0, 5)
      .map(req => req.trim());
  };

  // Check if user has sufficient data
  const hasSufficientData = () => {
    const hasWorkExperience = workExperience && workExperience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;
    const hasPersonalInfo = personalInfo && personalInfo.name;
    
    console.log('Data check:', {
      workExperience: workExperience?.length || 0,
      education: education?.length || 0,
      skills: skills?.length || 0,
      personalInfo: personalInfo,
      hasPersonalInfo
    });
    
    return (hasWorkExperience && hasSkills) || (hasEducation && hasSkills);
  };

  // Auto-analyze when job description changes
  useEffect(() => {
    if (jobDescription.trim() && hasSufficientData()) {
      const timer = setTimeout(performJobMatch, 1000);
      return () => clearTimeout(timer);
    }
  }, [jobDescription, performJobMatch]);

  const handleGenerateResume = async () => {
    console.log('Generate resume clicked, analysis:', analysis);
    
    if (!analysis) {
      toast.error("Please analyze a job first before generating a resume");
      return;
    }

    if (!jobTitle.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    
    try {
      // Generate the actual resume content with user's personal data
      const resumeContent = generateResumeContent();
      console.log('Generated resume content length:', resumeContent.length);
      
      toast.loading("Generating optimized resume...");
      
      const newResume = await generateResumeFromAnalysis(analysis, resumeContent);
      
      if (newResume) {
        setRecentlyCreatedResumeId(newResume.id);
        console.log('Resume generated successfully:', newResume.id);
      } else {
        throw new Error('Resume generation returned null');
      }
    } catch (error) {
      console.error('Resume generation error:', error);
      toast.error(`Failed to generate resume: ${error.message}`);
    }
  };

  const handleNavigateToVault = () => {
    setRecentlyCreatedResumeId(null);
    window.dispatchEvent(new CustomEvent('navigateToResumeVault'));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Job Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Job Match Analysis
          </CardTitle>
          <CardDescription>
            Paste a job description to get AI-powered matching and real-time optimization feedback
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
              placeholder="Paste the full job description here for real-time analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={8}
              className="min-h-[200px]"
            />
          </div>

          {!hasSufficientData() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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
        </CardContent>
      </Card>

      {/* Real-time Score Overview */}
      {jobDescription.trim() && hasSufficientData() && (
        <Card className={`border-2 ${getScoreBg(atsScore.overall)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Match Score
                {isAnalyzing && <Clock className="w-4 h-4 animate-spin" />}
                {claudeAnalysis && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    AI Enhanced
                  </Badge>
                )}
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(atsScore.overall)}`}>
                {atsScore.overall}%
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Keywords', value: atsScore.keyword, icon: Target },
                { label: 'Content', value: atsScore.content, icon: FileText },
                { label: 'Structure', value: atsScore.structure, icon: BarChart3 },
                { label: 'Experience', value: atsScore.experience, icon: Star }
              ].map((metric, index) => (
                <div key={index} className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                    <metric.icon className="w-3 h-3" />
                    {metric.label}
                  </div>
                  <div className={`text-lg font-semibold ${getScoreColor(metric.value)}`}>
                    {metric.value}%
                  </div>
                  <Progress value={metric.value} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="suggestions">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis">
            <AnalysisResults 
              analysis={analysis} 
              onGenerateResume={handleGenerateResume}
              onNavigateToVault={handleNavigateToVault}
              recentlyCreatedResumeId={recentlyCreatedResumeId}
            />
          </TabsContent>

          <TabsContent value="keywords" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Keyword Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {keywordAnalysis.slice(0, 12).map((keyword, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 ${
                        keyword.found 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{keyword.keyword}</span>
                        {keyword.found ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {keyword.importance}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {keyword.frequency}x
                        </span>
                      </div>
                      {keyword.suggestions.length > 0 && (
                        <p className="text-xs text-slate-600">
                          {keyword.suggestions[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suggestions" className="space-y-4">
            {claudeAnalysis && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {claudeAnalysis.strengths.map((strength, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-blue-600" />
                      AI Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {claudeAnalysis.suggestions.slice(0, 5).map((suggestion, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium text-blue-900">{suggestion.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              +{suggestion.impact}%
                            </Badge>
                          </div>
                          <p className="text-sm text-blue-800">{suggestion.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default JobMatchAnalyzer;