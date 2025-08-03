import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Target, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Brain,
  FileText,
  Eye,
  BarChart3,
  Lightbulb,
  Users,
  Clock,
  Star,
  ArrowRight
} from 'lucide-react';
import { useMarkupConverter } from '@/hooks/useMarkupConverter';
import { useATSAnalyzer } from '@/hooks/useATSAnalyzer';
import { useResumeData } from '@/contexts/ResumeDataContext';
import { toast } from 'sonner';

interface ATSRealTimeScore {
  overall: number;
  keyword: number;
  content: number;
  structure: number;
  experience: number;
}

interface OptimizationSuggestion {
  type: 'critical' | 'important' | 'suggestion';
  category: string;
  title: string;
  description: string;
  impact: number;
  autoFixAvailable?: boolean;
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

interface KeywordAnalysis {
  keyword: string;
  frequency: number;
  importance: 'high' | 'medium' | 'low';
  found: boolean;
  suggestions: string[];
}
const RealTimeATSAnalyzer: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [resumeContent, setResumeContent] = useState(`# Your Name

your.email@example.com
(555) 123-4567
linkedin.com/in/yourprofile

## Professional Experience

### Your Current Job Title
**Your Company Name**

- Add your key achievements here
- Use action verbs and quantify results
- Focus on impact and outcomes

## Skills

- Skill 1
- Skill 2
- Skill 3`);
  
  const [realTimeScore, setRealTimeScore] = useState<ATSRealTimeScore>({
    overall: 0,
    keyword: 0,
    content: 0,
    structure: 0,
    experience: 0
  });
  
  const [suggestions, setSuggestions] = useState<OptimizationSuggestion[]>([]);
  const [keywordAnalysis, setKeywordAnalysis] = useState<KeywordAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  const [hasJobDescription, setHasJobDescription] = useState(false);
  const [claudeAnalysis, setClaudeAnalysis] = useState<ClaudeAnalysisResponse | null>(null);

  const { convertMarkupToStructured } = useMarkupConverter();
  const { analyzeContent } = useATSAnalyzer();
  const { workExperience, personalInfo, skills } = useResumeData();

  // Call Claude API for comprehensive analysis
  const analyzeWithClaude = useCallback(async (jobDesc: string, resume: string) => {
    if (!jobDesc.trim() || !resume.trim()) return null;

    try {
      const response = await fetch('https://hwonitvnvhcepwjqeodj.supabase.co/functions/v1/claude-ats-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDesc,
          resumeContent: resume
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Claude analysis error:', error);
      toast.error('Failed to analyze with Claude. Please try again.');
      return null;
    }
  }, []);

  // Real-time analysis
  const performRealTimeAnalysis = useCallback(async () => {
    const hasJob = jobDescription.trim().length > 0;
    setHasJobDescription(hasJob);
    
    if (!hasJob) {
      // Reset scores when no job description
      setRealTimeScore({
        overall: 0,
        keyword: 0,
        content: 0,
        structure: 0,
        experience: 0
      });
      setSuggestions([]);
      setKeywordAnalysis([]);
      setClaudeAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Get Claude analysis
      const claudeResult = await analyzeWithClaude(jobDescription, resumeContent);
      
      if (claudeResult) {
        setClaudeAnalysis(claudeResult);
        
        // Update real-time scores from Claude analysis
        setRealTimeScore({
          overall: claudeResult.overallScore,
          keyword: claudeResult.categoryScores.keyword,
          content: claudeResult.categoryScores.content,
          structure: claudeResult.categoryScores.structure,
          experience: claudeResult.categoryScores.experience
        });

        // Update suggestions from Claude
        setSuggestions(claudeResult.suggestions || []);
        
        // Update keyword analysis from Claude
        setKeywordAnalysis(claudeResult.keywordAnalysis || []);
      } else {
        // Fallback to local analysis if Claude fails
        const structured = convertMarkupToStructured(resumeContent);
        const atsAnalysis = await analyzeContent(structured);
        
        // Basic keyword extraction as fallback
        const keywords = extractJobKeywords(jobDescription);
        
        const keywordScore = keywords.length > 0 ? 
          (keywords.filter(k => k.found).length / keywords.length) * 100 : 50;
        
        const contentScore = Math.max(0, Math.min(100, 
          (resumeContent.split('\n').filter(line => line.trim().startsWith('-')).length * 10) +
          (resumeContent.match(/\d+%|\$\d+|\d+x|\d+\+/g)?.length || 0) * 15
        ));
        
        const structureScore = Math.max(0, Math.min(100,
          (resumeContent.includes('##') ? 30 : 0) +
          (resumeContent.includes('###') ? 25 : 0) +
          (resumeContent.includes('**') ? 20 : 0) +
          (resumeContent.includes('*') && !resumeContent.includes('**') ? 25 : 0)
        ));
        
        const experienceScore = Math.max(0, Math.min(100,
          (structured.experienceBullets?.length || 0) * 20
        ));
        
        const overall = Math.round((keywordScore + contentScore + structureScore + experienceScore) / 4);
        
        setRealTimeScore({
          overall,
          keyword: Math.round(keywordScore),
          content: Math.round(contentScore),
          structure: Math.round(structureScore),
          experience: Math.round(experienceScore)
        });

        setKeywordAnalysis(keywords);
      }
      
    } catch (error) {
      console.error('Real-time analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [resumeContent, jobDescription, convertMarkupToStructured, analyzeContent, analyzeWithClaude]);

  // Extract keywords from job description (fallback method)
  const extractJobKeywords = useCallback((description: string): KeywordAnalysis[] => {
    if (!description.trim()) return [];

    const keywords = [
      // Technical skills
      'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'AWS', 'Docker', 'Kubernetes',
      'Machine Learning', 'Data Analysis', 'API', 'REST', 'GraphQL', 'MongoDB', 'PostgreSQL',
      // Soft skills
      'Leadership', 'Communication', 'Problem Solving', 'Team Collaboration', 'Project Management',
      'Agile', 'Scrum', 'CI/CD', 'Testing', 'Documentation',
      // Industry terms
      'Software Development', 'Web Development', 'Full Stack', 'Frontend', 'Backend',
      'DevOps', 'Cloud Computing', 'Microservices', 'Architecture', 'Security'
    ];

    return keywords.map(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = description.match(regex) || [];
      const resumeMatches = resumeContent.match(regex) || [];
      
      return {
        keyword,
        frequency: matches.length,
        importance: (matches.length > 2 ? 'high' : matches.length > 0 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
        found: resumeMatches.length > 0,
        suggestions: resumeMatches.length === 0 ? [
          `Add "${keyword}" to your skills section`,
          `Include "${keyword}" in your work experience`,
          `Highlight "${keyword}" in project descriptions`
        ] : []
      };
    }).filter(k => k.frequency > 0).sort((a, b) => b.frequency - a.frequency);
  }, [resumeContent]);

  // Debounced analysis
  useEffect(() => {
    const timer = setTimeout(performRealTimeAnalysis, 500);
    return () => clearTimeout(timer);
  }, [resumeContent, jobDescription, performRealTimeAnalysis]);

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

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'important': return <Target className="w-4 h-4 text-yellow-600" />;
      default: return <Lightbulb className="w-4 h-4 text-blue-600" />;
    }
  };

  const handleAutoFix = (suggestion: OptimizationSuggestion) => {
    if (suggestion.category === 'Keywords' && keywordAnalysis.length > 0) {
      const missingKeywords = keywordAnalysis.filter(k => !k.found).slice(0, 3);
      const skillsToAdd = missingKeywords.map(k => k.keyword).join(', ');
      
      if (skillsToAdd) {
        const updatedContent = resumeContent.replace(
          /## Skills\n\n/,
          `## Skills\n\n- ${skillsToAdd}\n`
        );
        setResumeContent(updatedContent);
        toast.success('Added missing keywords to skills section');
      }
    } else if (suggestion.category === 'Structure') {
      const updatedContent = resumeContent
        .replace(/^- /gm, '• ')
        .replace(/^([A-Z][^#\n]*?)$/gm, '**$1**');
      setResumeContent(updatedContent);
      toast.success('Applied formatting improvements');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <div className="relative">
            <Zap className="w-8 h-8 text-blue-600" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Real-Time ATS Analyzer</h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Live optimization feedback as you type. Get instant ATS scores and improvement suggestions.
        </p>
      </div>

      {/* Real-time Score Overview - Only show if job description exists */}
      {hasJobDescription && (
        <Card className={`border-2 ${getScoreBg(realTimeScore.overall)}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Live ATS Score
                {isAnalyzing && <Clock className="w-4 h-4 animate-spin" />}
                {claudeAnalysis && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Powered by Claude
                  </Badge>
                )}
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(realTimeScore.overall)}`}>
                {realTimeScore.overall}%
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Keywords', value: realTimeScore.keyword, icon: Target },
                { label: 'Content', value: realTimeScore.content, icon: FileText },
                { label: 'Structure', value: realTimeScore.structure, icon: Eye },
                { label: 'Experience', value: realTimeScore.experience, icon: Star }
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

      {/* No Job Description Message */}
      {!hasJobDescription && (
        <Card className="border-2 border-slate-200">
          <CardContent className="text-center py-8">
            <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Enter a Job Description to Start Analysis
            </h3>
            <p className="text-slate-600">
              Paste a job description in the editor below to get real-time ATS optimization feedback powered by Claude AI.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="editor" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="keywords" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Keywords
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Suggestions
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Paste the job description here to analyze keyword requirements..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={12}
                  className="min-h-[300px]"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Resume Content
                  <Badge variant="secondary">
                    {resumeContent.split('\n').length} lines
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={resumeContent}
                  onChange={(e) => setResumeContent(e.target.value)}
                  rows={12}
                  className="min-h-[300px] font-mono text-sm"
                  placeholder="Type your resume content in markdown format..."
                />
              </CardContent>
            </Card>
          </div>
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
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {keyword.importance}
                      </Badge>
                      <span className="text-xs text-slate-600">
                        Found {keyword.frequency}x in job
                      </span>
                    </div>
                    {!keyword.found && keyword.suggestions.length > 0 && (
                      <p className="text-xs text-slate-600 mt-1">
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      {getSuggestionIcon(suggestion.type)}
                      {suggestion.title}
                    </div>
                    <Badge variant="outline">
                      +{suggestion.impact}pts
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-3">{suggestion.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge className={
                      suggestion.type === 'critical' ? 'bg-red-100 text-red-800' :
                      suggestion.type === 'important' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {suggestion.category}
                    </Badge>
                    {suggestion.autoFixAvailable && (
                      <Button 
                        size="sm" 
                        onClick={() => handleAutoFix(suggestion)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Auto-fix
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {suggestions.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Great work! 
                </h3>
                <p className="text-slate-600">
                  No critical issues found. Your resume is well optimized for ATS systems.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Content Quality
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Bullet Points</span>
                    <span className="font-medium">
                      {resumeContent.split('\n').filter(line => line.trim().startsWith('-')).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Quantified Results</span>
                    <span className="font-medium">
                      {resumeContent.match(/\d+%|\$\d+|\d+x|\d+\+/g)?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Action Verbs</span>
                    <span className="font-medium">
                      {resumeContent.match(/\b(Led|Managed|Developed|Created|Improved|Increased)\b/gi)?.length || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sections</span>
                    <span className="font-medium">
                      {(resumeContent.match(/^##/gm) || []).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Subsections</span>
                    <span className="font-medium">
                      {(resumeContent.match(/^###/gm) || []).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Word Count</span>
                    <span className="font-medium">
                      {resumeContent.split(/\s+/).filter(word => word.length > 0).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Optimization Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Use industry keywords
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Quantify achievements
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Strong action verbs
                  </div>
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-3 h-3" />
                    Clear formatting
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RealTimeATSAnalyzer;