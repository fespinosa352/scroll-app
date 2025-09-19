import React, { useState, useCallback, useEffect, useRef } from 'react';
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
  Clock,
  ArrowRight,
  RefreshCw,
  Bell,
  TrendingUp,
  History,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { useJobAnalysis, type JobAnalysis } from '@/hooks/useJobAnalysis';
import { useResumeVersions } from '@/hooks/useResumeVersions';
import { useResumeData } from '@/contexts/ResumeDataContext';
import { useMarkupConverter } from '@/hooks/useMarkupConverter';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AnalysisResults from './AnalysisResults';
import ResumeEditor from './ResumeEditor';
import { ResumeOptimizer } from '@/services/resumeOptimizer';

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
  const [previousAnalysis, setPreviousAnalysis] = useState<JobAnalysis | null>(null);
  const [analysisTimestamp, setAnalysisTimestamp] = useState<string | null>(null);
  const [profileUpdateDetected, setProfileUpdateDetected] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showResumeEditor, setShowResumeEditor] = useState(false);
  const [currentResumeId, setCurrentResumeId] = useState(null);
  
  const { getUserSkillNames, saveJobAnalysis } = useJobAnalysis();
  const { generateResumeFromAnalysis } = useResumeVersions();
  const { workExperience, education, certifications, skills, personalInfo } = useResumeData();
  const { user } = useAuth();
  
  // Track profile data for change detection
  const profileDataRef = useRef({ workExperience, education, certifications, skills, personalInfo });
  const [profileDataHash, setProfileDataHash] = useState('');
  const lastAnalyzedJobDescription = useRef<string>('');
  const { convertMarkupToStructured } = useMarkupConverter();

  // Generate optimized resume content from user data and job analysis
  const generateResumeContent = useCallback(async (jobAnalysis?: JobAnalysis) => {
    // If we have job analysis, use the optimizer for targeted content
    if (jobAnalysis) {
      try {
        const optimizedContent = await ResumeOptimizer.optimizeResumeForJob(jobAnalysis, {
          personalInfo,
          workExperience,
          education,
          certifications,
          skills
        });
        return ResumeOptimizer.generateResumeContent(optimizedContent);
      } catch (error) {
        console.warn('ResumeOptimizer not available, falling back to basic generation:', error);
        // Fall through to basic generation
      }
    }
    
    // Fallback to original logic for backward compatibility
    let content = '';
    
    // Personal Info
    if (personalInfo?.name) {
      content += `# ${personalInfo.name}\n\n`;
      if (personalInfo.email) content += `${personalInfo.email}\n`;
      if (personalInfo.phone) content += `${personalInfo.phone}\n`;
      if (personalInfo.location) content += `${personalInfo.location}\n`;
      content += '\n';
    }

    // Work Experience (limited to most recent for fallback)
    if (workExperience?.length > 0) {
      content += '## Professional Experience\n\n';
      workExperience.slice(0, 3).forEach(exp => {
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

    // Education (limited for fallback)
    if (education?.length > 0) {
      content += '## Education\n\n';
      education.slice(0, 2).forEach(edu => {
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

    // Skills (limited for fallback)
    if (skills?.length > 0) {
      content += '## Skills\n\n';
      skills.slice(0, 10).forEach(skill => {
        content += `- ${skill}\n`;
      });
      content += '\n';
    }

    // Certifications (limited for fallback)
    if (certifications?.length > 0) {
      content += '## Certifications\n\n';
      certifications.slice(0, 3).forEach(cert => {
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

  const performJobMatch = useCallback(async () => {
    if (!jobDescription.trim()) return;
    
    // Prevent multiple concurrent analyses
    if (isAnalyzing) return;
    
    // Prevent duplicate analysis of the same job description
    if (lastAnalyzedJobDescription.current === jobDescription.trim()) return;

    setIsAnalyzing(true);
    lastAnalyzedJobDescription.current = jobDescription.trim();
    
    try {
      const resumeContent = await generateResumeContent();
      
      // Remove Claude analysis for enhanced scoring
      setClaudeAnalysis(null);
      setATSScore({
        overall: 0,
        keyword: 0,
        content: 0,
        structure: 0,
        experience: 0
      });
      setKeywordAnalysis([]);

      // Create traditional job analysis
      const jobAnalysisResult = await performTraditionalAnalysis();
      setAnalysis(jobAnalysisResult);
      
      // NEW: Save to job staging table
      if (user) {
        try {
          const { data: stagedJob, error: stagingError } = await supabase
            .from('job_staging')
            .insert({
              user_id: user.id,
              job_title: jobTitle || 'Untitled Job',
              company: company || 'Unknown Company',
              job_description: jobDescription,
              extracted_keywords: {
                skills: jobAnalysisResult.matched_skills.concat(jobAnalysisResult.missing_skills),
                requirements: jobAnalysisResult.key_requirements
              },
              status: 'analyzed'
            })
            .select()
            .single();

          if (stagingError) {
            console.error('Error staging job:', stagingError);
            toast.error('Analysis complete, but failed to save job');
          } else {
            console.log('Job staged successfully:', stagedJob);
          }
        } catch (stagingError) {
          console.error('Job staging error:', stagingError);
        }
      }
      
      // Save to database and update timestamps
      const savedAnalysis = await saveJobAnalysis(jobAnalysisResult);
      if (savedAnalysis) {
        setAnalysisTimestamp(new Date().toISOString());
        setProfileUpdateDetected(false);
        updateProfileDataHash();
        toast.success("Job analyzed and saved!");
      }
      
    } catch (error) {
      console.error('Job match analysis error:', error);
      toast.error("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [jobDescription, generateResumeContent, analyzeWithClaude, saveJobAnalysis]);

  // Copy analysis to clipboard function
  const copyAnalysisToClipboard = (analysis: JobAnalysis) => {
    const text = `Job Analysis Summary
  
Job: ${analysis.job_title} at ${analysis.company}

Matched Skills: ${analysis.matched_skills.join(', ')}
Missing Skills: ${analysis.missing_skills.join(', ')}

Key Requirements:
${analysis.key_requirements.map(req => `• ${req}`).join('\n')}

Recommendations:
${analysis.recommendations.map(rec => `• ${rec}`).join('\n')}`;

    navigator.clipboard.writeText(text);
    toast.success('Analysis copied to clipboard!');
  };

  // Enhanced analysis with proper keyword matching
  const performTraditionalAnalysis = useCallback(async () => {
    try {
      console.log('Starting traditional analysis...');
      console.log('Job description length:', jobDescription.length);
      console.log('Job title:', jobTitle);
      console.log('Company:', company);
      
      const jobKeywords = extractJobKeywords(jobDescription);
      console.log('Extracted job keywords:', jobKeywords);
      
      const workHistoryText = getWorkHistoryText();
      console.log('Work history text length:', workHistoryText.length);
      
      // Direct keyword matches in work history
      const directMatches = findDirectMatches(jobKeywords, workHistoryText);
      console.log('Direct matches found:', directMatches);
      
      const userSkillNames = getUserSkillNames();
      const resumeSkillNames = skills || [];
      const allUserSkills = [...new Set([...userSkillNames, ...resumeSkillNames])];
      console.log('All user skills:', allUserSkills.length, 'skills');
      
      // Skill matches from user's skills list
      const skillMatches = jobKeywords.filter(keyword => 
        allUserSkills.some(userSkill => 
          userSkill.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      console.log('Skill matches found:', skillMatches);
      
      const allMatches = [...new Set([...directMatches, ...skillMatches])];
      const missingKeywords = jobKeywords.filter(keyword => !allMatches.includes(keyword));
      console.log('Total matches:', allMatches.length, 'Missing:', missingKeywords.length);
      
      let matchScore = 0;
      const criticalAreas: string[] = [];
      
      if (allMatches.length > 0) {
        // Calculate score based on matches found
        const matchRatio = allMatches.length / jobKeywords.length;
        matchScore = Math.round(matchRatio * 85); // Base score from matches
        
        // Bonus for data completeness
        if (workExperience?.length > 0) matchScore += 5;
        if (education?.length > 0) matchScore += 3;
        if (certifications?.length > 0) matchScore += 2;
        
        matchScore = Math.min(matchScore, 95); // Cap at 95% for keyword-based matching
        console.log('Calculated match score:', matchScore);
      } else {
        // No direct matches - use AI fallback
        console.log('No matches found, using AI fallback...');
        matchScore = await performAIFallbackAnalysis(jobDescription, workHistoryText);
        criticalAreas.push(
          'No direct keyword matches found between job description and work history.',
          'Consider using AI analysis to identify transferable skills and experience.',
          'Review job requirements and align your experience descriptions accordingly.'
        );
        console.log('Fallback analysis score:', matchScore);
      }
      
      // Add critical areas for missing important keywords
      if (missingKeywords.length > 0) {
        criticalAreas.push(
          `Missing keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
          'Consider adding relevant experience or training in these areas.'
        );
      }

      const recommendations = [
        'Use specific metrics when describing your achievements',
        'Mirror the job\'s language and terminology',
        'Quantify your achievements with numbers and percentages'
      ];

      if (allMatches.length > 0) {
        recommendations.unshift(`Emphasize ${allMatches.slice(0, 2).join(' and ')} prominently in your resume`);
      }

      // Sanitize job description to prevent encoding errors
      const sanitizeText = (text: string) => {
        return text
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
          .replace(/↵/g, '\n') // Replace special line break symbols with normal line breaks
          .replace(/[^\x20-\x7E\n\r\t]/g, '') // Keep only printable ASCII characters and basic whitespace
          .substring(0, 10000) // Limit length to prevent database issues
          .trim();
      };

      const analysisResult = {
        job_title: jobTitle.substring(0, 255), // Limit job title length
        company: company.substring(0, 255), // Limit company length
        job_description: sanitizeText(jobDescription),
        match_score: matchScore,
        matched_skills: allMatches.map(skill => 
          skill.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        ).slice(0, 8),
        missing_skills: missingKeywords.map(skill => 
          skill.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')
        ).slice(0, 6),
        key_requirements: extractKeyRequirements(jobDescription),
        recommendations,
        critical_areas: criticalAreas
      };
      
      console.log('Analysis result created:', analysisResult);
      return analysisResult;
      
    } catch (error) {
      console.error('Error in performTraditionalAnalysis:', error);
      throw new Error(`Traditional analysis failed: ${error.message}`);
    }
  }, [jobDescription, jobTitle, company, getUserSkillNames, skills, workExperience, education, certifications]);

  // Get work history as searchable text
  const getWorkHistoryText = useCallback(() => {
    if (!workExperience || workExperience.length === 0) return '';
    
    return workExperience.map(exp => {
      let text = `${exp.position || ''} ${exp.company || ''}`;
      if (exp.description) {
        text += ' ' + exp.description;
      }
      return text;
    }).join(' ').toLowerCase();
  }, [workExperience]);
  
  // Find direct matches between job keywords and work history
  const findDirectMatches = useCallback((keywords: string[], workText: string) => {
    return keywords.filter(keyword => {
      const keywordLower = keyword.toLowerCase();
      return workText.includes(keywordLower);
    });
  }, []);
  
  // AI fallback analysis when no keywords match
  const performAIFallbackAnalysis = useCallback(async (jobDesc: string, workText: string) => {
    if (!workText.trim()) return 10; // Minimum score if no work history
    
    try {
      // Call Claude API for comparison
      const response = await fetch('https://hwonitvnvhcepwjqeodj.supabase.co/functions/v1/claude-ats-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobDescription: jobDesc,
          resumeContent: workText,
          mode: 'fallback_comparison'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return Math.min(data.overallScore || 25, 50); // Cap fallback score at 50%
      }
    } catch (error) {
      console.error('AI fallback analysis failed:', error);
    }
    
    // Default fallback score based on data completeness
    return workText.length > 200 ? 25 : 15;
  }, []);
  
  // Extract keywords from job description
  const extractJobKeywords = (description: string) => {
    const commonSkills = [
      'python', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes',
      'agile', 'scrum', 'product management', 'data analysis', 'machine learning',
      'project management', 'leadership', 'communication', 'teamwork', 'problem solving',
      'strategic planning', 'user experience', 'ux', 'ui', 'design', 'figma', 'help desk',
      'technical support', 'customer service', 'troubleshooting', 'social work', 'case management',
      'counseling', 'community outreach', 'crisis intervention', 'mental health'
    ];

    const lowerText = description.toLowerCase();
    
    // Extract both common skills and important terms from job description
    const foundSkills = commonSkills.filter(skill => lowerText.includes(skill.toLowerCase()));
    
    // Also extract key terms that appear multiple times
    const words = description.toLowerCase().match(/\b\w{3,}\b/g) || [];
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    const frequentTerms = Object.entries(wordFreq)
      .filter(([word, freq]) => freq >= 2 && word.length >= 4)
      .map(([word]) => word)
      .slice(0, 10);
    
    return [...new Set([...foundSkills, ...frequentTerms])];
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

  // Check if user has sufficient data (memoized to prevent excessive re-calculations)
  const hasSufficientData = useCallback(() => {
    const hasWorkExperience = workExperience && workExperience.length > 0;
    const hasEducation = education && education.length > 0;
    const hasSkills = skills && skills.length > 0;
    
    return (hasWorkExperience && hasSkills) || (hasEducation && hasSkills);
  }, [workExperience, education, skills]);

  // Auto-analyze when job description changes
  useEffect(() => {
    // Reset the last analyzed description when job description actually changes
    if (lastAnalyzedJobDescription.current !== jobDescription.trim()) {
      lastAnalyzedJobDescription.current = '';
    }
    
    if (jobDescription.trim() && hasSufficientData()) {
      const timer = setTimeout(() => {
        performJobMatch();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [jobDescription]); // Remove performJobMatch from dependencies to prevent infinite loop


  // Helper function to update profile data hash for change detection
  const updateProfileDataHash = () => {
    const currentData = JSON.stringify({ workExperience, education, certifications, skills, personalInfo });
    const toBase64 = (str: string) => {
      try {
        // UTF-8 safe base64 encoding to avoid InvalidCharacterError
        return btoa(unescape(encodeURIComponent(str)));
      } catch (e) {
        console.warn('Hash encoding fallback due to invalid chars', e);
        // Fallback: simple numeric hash
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
        }
        return String(hash);
      }
    };
    const hash = toBase64(currentData).slice(0, 10); // Simple hash
    setProfileDataHash(hash);
  };

  // Helper function to format timestamp display
  const getTimestampDisplay = () => {
    if (!analysisTimestamp) return '';
    const date = new Date(analysisTimestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Update the handleGenerateResume function to show the editor
  const handleGenerateResume = async () => {
    if (!analysis) {
      toast.error('Please analyze a job first before generating a resume');
      return;
    }
    
    const newResume = await generateResumeFromAnalysis(analysis);
    if (newResume) {
      setCurrentResumeId(newResume.id);
      setShowResumeEditor(true);
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



      {/* Analysis Results */}
      {analysis && (
        <div className="space-y-4">
          {/* Analysis Header with Refresh Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Analysis Results</h2>
              {analysisTimestamp && (
                <Badge variant="secondary" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  Updated {getTimestampDisplay()}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {showComparison && previousAnalysis && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                >
                  <History className="w-4 h-4 mr-2" />
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </Button>
              )}
            </div>
          </div>

          {/* Comparison View */}
          {showComparison && previousAnalysis && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <TrendingUp className="w-5 h-5" />
                  Score Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-2">Previous Score</p>
                    <div className="text-3xl font-bold text-slate-700">
                      {previousAnalysis.match_score}%
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-600 mb-2">Current Score</p>
                    <div className="text-3xl font-bold text-green-600">
                      {analysis.match_score}%
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  {analysis.match_score > previousAnalysis.match_score ? (
                    <div className="flex items-center justify-center gap-2 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <span className="font-medium">
                        +{analysis.match_score - previousAnalysis.match_score} point improvement!
                      </span>
                    </div>
                  ) : analysis.match_score < previousAnalysis.match_score ? (
                    <div className="text-orange-600">
                      <span className="font-medium">
                        {analysis.match_score - previousAnalysis.match_score} point change
                      </span>
                    </div>
                  ) : (
                    <div className="text-slate-600">
                      <span className="font-medium">No score change</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="analysis">
              <AnalysisResults 
                analysis={analysis} 
                onGenerateResume={handleGenerateResume}
                onNavigateToVault={handleNavigateToVault}
                recentlyCreatedResumeId={recentlyCreatedResumeId}
                onCopyAnalysis={copyAnalysisToClipboard}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Resume Editor Modal */}
      {showResumeEditor && currentResumeId && (
        <ResumeEditor 
          resumeId={currentResumeId} 
          onClose={() => setShowResumeEditor(false)}
        />
      )}
    </div>
  );
};

export default JobMatchAnalyzer;