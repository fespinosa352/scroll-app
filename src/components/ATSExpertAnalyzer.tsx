import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Users,
  Zap,
  BarChart,
  FileText,
  Download,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useATSExpert, type ComprehensiveATSAnalysis } from '@/hooks/useATSExpert';
import { useResumeData } from '@/contexts/ResumeDataContext';

const ATSExpertAnalyzer: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [activeTab, setActiveTab] = useState('analysis');
  
  const { analysis, isAnalyzing, performComprehensiveAnalysis } = useATSExpert();
  const { workExperience, personalInfo, education, skills } = useResumeData();

  const hasCompleteProfile = () => {
    return workExperience.length > 0 && skills.length > 0 && personalInfo?.name;
  };

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }

    if (!hasCompleteProfile()) {
      toast.error('Please complete your profile data first');
      return;
    }

    try {
      await performComprehensiveAnalysis(jobDescription, jobTitle, company);
      toast.success('Comprehensive ATS analysis complete!');
      setActiveTab('analysis');
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
      console.error('ATS Expert analysis error:', error);
    }
  };

  const copyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const generateResumeMarkup = (analysis: ComprehensiveATSAnalysis): string => {
    const resume = analysis.preliminaryResume;
    let markup = `# ${resume.personalInfo.name}\n\n`;
    markup += `${resume.personalInfo.email} | ${resume.personalInfo.phone}\n`;
    markup += `${resume.personalInfo.location} | ${resume.personalInfo.linkedin}\n\n`;
    
    markup += `## Professional Summary\n\n${resume.professionalSummary}\n\n`;
    
    markup += `## Core Competencies\n\n`;
    resume.coreCompetencies.forEach(skill => {
      markup += `- ${skill}\n`;
    });
    markup += '\n';
    
    markup += `## Professional Experience\n\n`;
    resume.workExperience.forEach(exp => {
      markup += `### ${exp.position}\n`;
      markup += `**${exp.company}** | ${exp.duration}\n\n`;
      exp.optimizedBullets.forEach(bullet => {
        markup += `- ${bullet}\n`;
      });
      markup += '\n';
    });

    return markup;
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center justify-center gap-2">
          <Brain className="w-8 h-8 text-blue-600" />
          ATS Optimization Expert
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Advanced AI-powered job analysis with comprehensive ATS scoring, keyword optimization, 
          and intelligent resume generation
        </p>
      </div>

      {/* Job Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Job Analysis Input
          </CardTitle>
          <CardDescription>
            Provide job details for comprehensive ATS optimization analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Company</label>
              <Input
                placeholder="e.g., Google, Microsoft, Tesla"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Job Description</label>
            <Textarea
              placeholder="Paste the complete job description here for detailed analysis..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={10}
              className="min-h-[250px]"
            />
          </div>

          {!hasCompleteProfile() && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">Profile Incomplete</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Complete your work experience, skills, and personal information for optimal analysis.
              </p>
            </div>
          )}

          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !hasCompleteProfile()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                Performing Deep Analysis...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Run Expert ATS Analysis
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="optimization">Optimization</TabsTrigger>
            <TabsTrigger value="resume">Resume</TabsTrigger>
            <TabsTrigger value="guidance">Guidance</TabsTrigger>
          </TabsList>

          {/* Analysis Tab */}
          <TabsContent value="analysis" className="space-y-4">
            {/* ATS Score Overview */}
            <Card className={getScoreBgColor(analysis.atsOptimization.currentScore.overall)}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <BarChart className="w-5 h-5" />
                    ATS Optimization Score
                  </span>
                  <span className={`text-2xl font-bold ${getScoreColor(analysis.atsOptimization.currentScore.overall)}`}>
                    {analysis.atsOptimization.currentScore.overall}/100
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Keywords</div>
                    <div className="text-lg font-semibold">{analysis.atsOptimization.currentScore.breakdown.keywordOptimization}%</div>
                    <Progress value={analysis.atsOptimization.currentScore.breakdown.keywordOptimization} className="h-2 mt-1" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Content</div>
                    <div className="text-lg font-semibold">{analysis.atsOptimization.currentScore.breakdown.contentQuality}%</div>
                    <Progress value={analysis.atsOptimization.currentScore.breakdown.contentQuality} className="h-2 mt-1" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Structure</div>
                    <div className="text-lg font-semibold">{analysis.atsOptimization.currentScore.breakdown.structureFormat}%</div>
                    <Progress value={analysis.atsOptimization.currentScore.breakdown.structureFormat} className="h-2 mt-1" />
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-600">Relevance</div>
                    <div className="text-lg font-semibold">{analysis.atsOptimization.currentScore.breakdown.experienceRelevance}%</div>
                    <Progress value={analysis.atsOptimization.currentScore.breakdown.experienceRelevance} className="h-2 mt-1" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Extracted Keywords
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.jobAnalysis.extractedKeywords.slice(0, 10).map((keyword, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="font-medium">{keyword.keyword}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(keyword.priority)}>
                            {keyword.priority}
                          </Badge>
                          <Badge variant="outline">
                            {keyword.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Role Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-slate-600">Seniority Level:</span>
                      <div className="font-medium capitalize">{analysis.jobAnalysis.roleIntelligence.seniorityLevel}</div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Expected Experience:</span>
                      <div className="font-medium">{analysis.jobAnalysis.roleIntelligence.expectedExperience || 'Not specified'}</div>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Competitive Factors:</span>
                      <div className="space-y-1 mt-1">
                        {analysis.jobAnalysis.competitiveFactors.slice(0, 3).map((factor, index) => (
                          <div key={index} className="text-sm bg-slate-50 p-2 rounded">
                            {factor}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skill Matching */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Skill Matching Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        Matching Skills ({analysis.userDataMatching.skillMatches.filter(sm => sm.matchScore > 0).length})
                      </h4>
                      <div className="space-y-2">
                        {analysis.userDataMatching.skillMatches.filter(sm => sm.matchScore > 0).slice(0, 5).map((match, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                            <span className="text-sm font-medium">{match.userSkill}</span>
                            <Badge className="bg-green-100 text-green-800">
                              {match.matchScore}% match
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-700 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" />
                        Missing Critical Skills
                      </h4>
                      <div className="space-y-2">
                        {analysis.userDataMatching.gapAnalysis.criticalMissing.slice(0, 5).map((skill, index) => (
                          <div key={index} className="p-2 bg-red-50 rounded">
                            <span className="text-sm font-medium text-red-800">{skill}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Optimization Tab */}
          <TabsContent value="optimization" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    Critical Issues
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.atsOptimization.criticalIssues.map((issue, index) => (
                      <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-red-800">{issue.issue}</span>
                          <Badge className={getPriorityColor(issue.priority)}>
                            {issue.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-red-700 mb-2">{issue.impact}</div>
                        <div className="text-sm text-slate-700">{issue.solution}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-600">
                    <Lightbulb className="w-4 h-4" />
                    Optimization Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.atsOptimization.optimizationOpportunities.map((opp, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-blue-800">{opp.opportunity}</span>
                          <Badge className={getPriorityColor(opp.priority)}>
                            {opp.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-blue-700 mb-2">{opp.expectedImpact}</div>
                        <div className="text-sm text-slate-700">{opp.action}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>Expert Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="immediate" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="immediate">Immediate</TabsTrigger>
                    <TabsTrigger value="strategic">Strategic</TabsTrigger>
                    <TabsTrigger value="keywords">Keywords</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="immediate">
                    <div className="space-y-2">
                      {analysis.atsOptimization.recommendations.immediateActions.map((action, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{action}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="strategic">
                    <div className="space-y-2">
                      {analysis.atsOptimization.recommendations.strategicImprovements.map((improvement, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                          <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="keywords">
                    <div className="space-y-2">
                      {analysis.atsOptimization.recommendations.keywordIntegration.map((keyword, index) => (
                        <Badge key={index} variant="outline" className="mr-2 mb-2">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content">
                    <div className="space-y-2">
                      {analysis.atsOptimization.recommendations.contentEnhancements.map((enhancement, index) => (
                        <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                          <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{enhancement}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Resume Tab */}
          <TabsContent value="resume" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Optimized Resume Preview
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(generateResumeMarkup(analysis))}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-xl font-bold">{analysis.preliminaryResume.personalInfo.name}</h3>
                    <p className="text-slate-600">
                      {analysis.preliminaryResume.personalInfo.email} | {analysis.preliminaryResume.personalInfo.phone}
                    </p>
                    <p className="text-slate-600">
                      {analysis.preliminaryResume.personalInfo.location} | {analysis.preliminaryResume.personalInfo.linkedin}
                    </p>
                  </div>

                  {/* Professional Summary */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Professional Summary</h4>
                    <p className="text-slate-700 leading-relaxed">{analysis.preliminaryResume.professionalSummary}</p>
                  </div>

                  {/* Core Competencies */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">Core Competencies</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysis.preliminaryResume.coreCompetencies.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Work Experience */}
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-4">Professional Experience</h4>
                    <div className="space-y-4">
                      {analysis.preliminaryResume.workExperience.map((exp, index) => (
                        <div key={index} className="border-l-2 border-blue-200 pl-4">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-semibold">{exp.position}</h5>
                            <Badge className="bg-blue-100 text-blue-800">
                              {exp.relevanceScore}% relevant
                            </Badge>
                          </div>
                          <p className="text-slate-600 mb-2">{exp.company} | {exp.duration}</p>
                          <ul className="space-y-1">
                            {exp.optimizedBullets.map((bullet, bulletIndex) => (
                              <li key={bulletIndex} className="text-sm text-slate-700 flex items-start gap-2">
                                <span className="text-blue-600 mt-1.5 w-1 h-1 bg-blue-600 rounded-full flex-shrink-0"></span>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                          {exp.keywordsIntegrated.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs text-slate-500">Keywords integrated: </span>
                              {exp.keywordsIntegrated.map((keyword, kwIndex) => (
                                <Badge key={kwIndex} variant="outline" className="text-xs mr-1">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Optimization Notes */}
                  <Card className="bg-slate-50">
                    <CardHeader>
                      <CardTitle className="text-sm">Optimization Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Keywords Added: </span>
                        {analysis.preliminaryResume.optimizationNotes.keywordsAdded.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Content Enhanced: </span>
                        {analysis.preliminaryResume.optimizationNotes.contentEnhanced.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Strategic Choices: </span>
                        {analysis.preliminaryResume.optimizationNotes.strategicChoices.join(', ')}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guidance Tab */}
          <TabsContent value="guidance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Next Steps
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.implementationGuidance.nextSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-green-50 rounded">
                        <span className="text-green-600 font-bold text-sm mt-0.5">{index + 1}.</span>
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Score Improvement Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.implementationGuidance.scoreImprovementPlan.map((plan, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="font-medium text-blue-800 mb-1">{plan.action}</div>
                        <div className="text-sm text-blue-700 mb-1">Timeline: {plan.timeframe}</div>
                        <div className="text-sm text-green-700">Impact: {plan.expectedImpact}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Long-term Strategy</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.implementationGuidance.longTermStrategy.map((strategy, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-purple-50 rounded">
                        <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{strategy}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Application Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {analysis.implementationGuidance.jobApplicationTips.map((tip, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-yellow-50 rounded">
                        <Lightbulb className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default ATSExpertAnalyzer;