import { useState, useCallback } from 'react';
import { useResumeData } from '@/contexts/ResumeDataContext';

// Type definitions for the comprehensive ATS system
export interface ExtractedKeyword {
  keyword: string;
  category: 'skill' | 'qualification' | 'industry_term' | 'certification' | 'soft_skill' | 'tool' | 'methodology';
  priority: 'critical' | 'high' | 'medium' | 'low';
  frequency: number;
  context: string;
  synonyms: string[];
  requirement_type: 'required' | 'preferred' | 'nice_to_have';
}

export interface RoleIntelligence {
  seniorityLevel: 'entry' | 'mid' | 'senior' | 'executive';
  industrySpecificTerms: string[];
  companyValues: string[];
  expectedExperience: string;
  uniqueRequirements: string[];
}

export interface JobAnalysisResult {
  extractedKeywords: ExtractedKeyword[];
  roleIntelligence: RoleIntelligence;
  competitiveFactors: string[];
}

export interface SkillMatch {
  userSkill: string;
  jobKeyword: string;
  matchScore: number;
  proficiencyAlignment: 'excellent' | 'good' | 'adequate' | 'insufficient';
  priority: 'critical' | 'high' | 'medium' | 'low';
  yearsExperience: number;
  recommendations: string;
}

export interface ExperienceRelevance {
  experience: string;
  relevanceScore: number;
  keywordMatches: string[];
  transferableSkills: string[];
  gaps: string[];
  optimization: string;
}

export interface AchievementAlignment {
  achievement: string;
  jobRelevance: number;
  keywordPresence: string[];
  quantificationQuality: 'excellent' | 'good' | 'needs_improvement';
  competitiveAdvantage: string;
}

export interface GapAnalysis {
  criticalMissing: string[];
  proficiencyGaps: string[];
  experienceGaps: string[];
  optimizationOpportunities: Array<{
    gap: string;
    solution: string;
    impactEstimate: string;
  }>;
}

export interface UserDataMatching {
  skillMatches: SkillMatch[];
  experienceRelevance: ExperienceRelevance[];
  achievementAlignment: AchievementAlignment[];
  gapAnalysis: GapAnalysis;
}

export interface ATSScoreBreakdown {
  overall: number;
  breakdown: {
    keywordOptimization: number;
    contentQuality: number;
    structureFormat: number;
    experienceRelevance: number;
  };
}

export interface CriticalIssue {
  issue: string;
  impact: string;
  priority: 'high' | 'medium' | 'low';
  solution: string;
}

export interface OptimizationOpportunity {
  opportunity: string;
  action: string;
  expectedImpact: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'high' | 'medium' | 'low';
}

export interface ATSOptimizationResult {
  currentScore: ATSScoreBreakdown;
  criticalIssues: CriticalIssue[];
  optimizationOpportunities: OptimizationOpportunity[];
  recommendations: {
    immediateActions: string[];
    strategicImprovements: string[];
    keywordIntegration: string[];
    contentEnhancements: string[];
  };
}

export interface OptimizedWorkExperience {
  position: string;
  company: string;
  duration: string;
  optimizedBullets: string[];
  keywordsIntegrated: string[];
  relevanceScore: number;
}

export interface KeyAchievement {
  achievement: string;
  impact: string;
  relevance: string;
}

export interface PreliminaryResume {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin: string;
  };
  professionalSummary: string;
  coreCompetencies: string[];
  workExperience: OptimizedWorkExperience[];
  keyAchievements: KeyAchievement[];
  optimizationNotes: {
    keywordsAdded: string[];
    contentEnhanced: string[];
    strategicChoices: string[];
  };
}

export interface ImplementationGuidance {
  nextSteps: string[];
  scoreImprovementPlan: Array<{
    action: string;
    timeframe: string;
    expectedImpact: string;
  }>;
  longTermStrategy: string[];
  jobApplicationTips: string[];
}

export interface ComprehensiveATSAnalysis {
  jobAnalysis: JobAnalysisResult;
  userDataMatching: UserDataMatching;
  atsOptimization: ATSOptimizationResult;
  preliminaryResume: PreliminaryResume;
  implementationGuidance: ImplementationGuidance;
}

export const useATSExpert = () => {
  const [analysis, setAnalysis] = useState<ComprehensiveATSAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { workExperience, personalInfo, education, certifications, skills } = useResumeData();

  // Phase 1: Advanced Job Description Analysis
  const analyzeJobDescription = useCallback((jobDescription: string): JobAnalysisResult => {
    const text = jobDescription.toLowerCase();
    
    // Define comprehensive keyword patterns
    const skillPatterns = {
      technical: ['python', 'javascript', 'react', 'node.js', 'sql', 'aws', 'docker', 'kubernetes', 'typescript', 'java', 'c++', 'html', 'css', 'git', 'api', 'rest', 'graphql', 'mongodb', 'postgresql', 'redis', 'elasticsearch'],
      tools: ['jira', 'confluence', 'slack', 'figma', 'adobe', 'salesforce', 'hubspot', 'tableau', 'powerbi', 'excel', 'sheets', 'notion'],
      methodologies: ['agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'tdd', 'bdd', 'waterfall', 'lean', 'six sigma'],
      soft_skills: ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical', 'creative', 'strategic', 'collaborative', 'adaptable', 'detail-oriented'],
      certifications: ['pmp', 'aws certified', 'google cloud', 'microsoft azure', 'cissp', 'cisa', 'comptia', 'prince2', 'itil'],
      qualifications: ['bachelor', 'master', 'phd', 'degree', 'certification', 'years experience', 'experience in']
    };

    const extractedKeywords: ExtractedKeyword[] = [];
    
    // Extract keywords by category
    Object.entries(skillPatterns).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = jobDescription.match(regex) || [];
        
        if (matches.length > 0) {
          // Determine priority based on context
          let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
          let requirementType: 'required' | 'preferred' | 'nice_to_have' = 'preferred';
          
          // Check context for priority indicators
          const beforeKeyword = jobDescription.substring(Math.max(0, jobDescription.toLowerCase().indexOf(keyword) - 50), jobDescription.toLowerCase().indexOf(keyword));
          const afterKeyword = jobDescription.substring(jobDescription.toLowerCase().indexOf(keyword), jobDescription.toLowerCase().indexOf(keyword) + 50);
          const context = beforeKeyword + afterKeyword;
          
          if (context.includes('required') || context.includes('must') || context.includes('essential')) {
            priority = 'critical';
            requirementType = 'required';
          } else if (context.includes('preferred') || context.includes('desired') || context.includes('nice to have')) {
            priority = 'medium';
            requirementType = 'preferred';
          } else if (context.includes('years') || context.includes('experience')) {
            priority = 'high';
          }

          extractedKeywords.push({
            keyword,
            category: category as any,
            priority,
            frequency: matches.length,
            context: context.trim(),
            synonyms: [], // Could be enhanced with NLP
            requirement_type: requirementType
          });
        }
      });
    });

    // Determine role intelligence
    const roleIntelligence: RoleIntelligence = {
      seniorityLevel: 'mid', // Default
      industrySpecificTerms: [],
      companyValues: [],
      expectedExperience: '',
      uniqueRequirements: []
    };

    // Determine seniority level
    if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      roleIntelligence.seniorityLevel = 'senior';
    } else if (text.includes('junior') || text.includes('entry') || text.includes('associate')) {
      roleIntelligence.seniorityLevel = 'entry';
    } else if (text.includes('director') || text.includes('vp') || text.includes('head of')) {
      roleIntelligence.seniorityLevel = 'executive';
    }

    // Extract experience requirements
    const experienceMatch = jobDescription.match(/(\d+)\+?\s*years?\s*(of\s*)?(experience|exp)/i);
    if (experienceMatch) {
      roleIntelligence.expectedExperience = `${experienceMatch[1]}+ years`;
    }

    // Extract competitive factors
    const competitiveFactors = [
      'Strong track record of results',
      'Industry experience in relevant sector',
      'Advanced technical skills',
      'Leadership experience',
      'Cross-functional collaboration'
    ];

    return {
      extractedKeywords,
      roleIntelligence,
      competitiveFactors
    };
  }, []);

  // Phase 2: User Data Matching & Relevance Scoring
  const analyzeUserDataMatching = useCallback((jobKeywords: ExtractedKeyword[]): UserDataMatching => {
    const userSkills = skills || [];
    const userExperiences = workExperience || [];
    
    // Skill matching analysis
    const skillMatches: SkillMatch[] = [];
    jobKeywords.forEach(jobKeyword => {
      const matchingUserSkill = userSkills.find(skill => 
        skill.toLowerCase().includes(jobKeyword.keyword.toLowerCase()) ||
        jobKeyword.keyword.toLowerCase().includes(skill.toLowerCase())
      );

      if (matchingUserSkill) {
        skillMatches.push({
          userSkill: matchingUserSkill,
          jobKeyword: jobKeyword.keyword,
          matchScore: 85, // Base high score for direct matches
          proficiencyAlignment: 'good',
          priority: jobKeyword.priority,
          yearsExperience: 2, // Could be enhanced with actual data
          recommendations: `Highlight ${matchingUserSkill} prominently in resume summary`
        });
      } else if (jobKeyword.priority === 'critical') {
        skillMatches.push({
          userSkill: 'Missing',
          jobKeyword: jobKeyword.keyword,
          matchScore: 0,
          proficiencyAlignment: 'insufficient',
          priority: jobKeyword.priority,
          yearsExperience: 0,
          recommendations: `Consider adding ${jobKeyword.keyword} to skills or finding related experience`
        });
      }
    });

    // Experience relevance analysis
    const experienceRelevance: ExperienceRelevance[] = userExperiences.map(exp => {
      const expText = `${exp.position} ${exp.company} ${exp.description}`.toLowerCase();
      const keywordMatches = jobKeywords.filter(kw => 
        expText.includes(kw.keyword.toLowerCase())
      ).map(kw => kw.keyword);

      const relevanceScore = Math.min(90, (keywordMatches.length / Math.max(jobKeywords.length * 0.3, 1)) * 100);

      return {
        experience: `${exp.position} at ${exp.company}`,
        relevanceScore,
        keywordMatches,
        transferableSkills: keywordMatches.slice(0, 5),
        gaps: jobKeywords.filter(kw => kw.priority === 'critical' && !keywordMatches.includes(kw.keyword)).map(kw => kw.keyword).slice(0, 3),
        optimization: relevanceScore > 70 ? 'Emphasize this role prominently' : 'Consider repositioning or adding context'
      };
    });

    // Achievement alignment (simplified for now)
    const achievementAlignment: AchievementAlignment[] = userExperiences.flatMap(exp => {
      if (!exp.description) return [];
      
      const achievements = exp.description.split('\n').filter(line => line.trim().length > 10);
      return achievements.slice(0, 2).map(achievement => ({
        achievement: achievement.trim(),
        jobRelevance: 70, // Base score
        keywordPresence: jobKeywords.filter(kw => achievement.toLowerCase().includes(kw.keyword.toLowerCase())).map(kw => kw.keyword),
        quantificationQuality: achievement.match(/\d+%|\$\d+|\d+x|\d+\+/) ? 'excellent' : 'needs_improvement' as const,
        competitiveAdvantage: 'Demonstrates measurable impact'
      }));
    });

    // Gap analysis
    const criticalKeywords = jobKeywords.filter(kw => kw.priority === 'critical').map(kw => kw.keyword);
    const userKeywords = [...userSkills, ...userExperiences.flatMap(exp => exp.description?.toLowerCase().split(/\s+/) || [])];
    
    const gapAnalysis: GapAnalysis = {
      criticalMissing: criticalKeywords.filter(kw => !userKeywords.some(uk => uk.includes(kw.toLowerCase()))),
      proficiencyGaps: [],
      experienceGaps: [],
      optimizationOpportunities: [
        {
          gap: 'Keyword density',
          solution: 'Naturally integrate missing keywords into experience descriptions',
          impactEstimate: '+15-25 ATS points'
        }
      ]
    };

    return {
      skillMatches,
      experienceRelevance,
      achievementAlignment,
      gapAnalysis
    };
  }, [workExperience, skills]);

  // Phase 3: ATS Optimization Scoring
  const calculateATSScore = useCallback((jobKeywords: ExtractedKeyword[], userMatching: UserDataMatching): ATSOptimizationResult => {
    // Calculate keyword optimization score (40% weight)
    const totalCriticalKeywords = jobKeywords.filter(kw => kw.priority === 'critical').length;
    const matchedCriticalKeywords = userMatching.skillMatches.filter(sm => sm.priority === 'critical' && sm.matchScore > 0).length;
    const keywordOptimization = totalCriticalKeywords > 0 ? (matchedCriticalKeywords / totalCriticalKeywords) * 100 : 50;

    // Calculate content quality score (30% weight)
    const quantifiedAchievements = userMatching.achievementAlignment.filter(aa => aa.quantificationQuality === 'excellent').length;
    const totalAchievements = Math.max(userMatching.achievementAlignment.length, 1);
    const contentQuality = Math.min(100, (quantifiedAchievements / totalAchievements) * 100 + 30);

    // Calculate structure & format score (20% weight)
    const hasCompleteProfile = personalInfo?.name && personalInfo?.email && workExperience.length > 0;
    const structureFormat = hasCompleteProfile ? 85 : 60;

    // Calculate experience relevance score (10% weight)
    const avgExperienceRelevance = userMatching.experienceRelevance.length > 0 
      ? userMatching.experienceRelevance.reduce((sum, exp) => sum + exp.relevanceScore, 0) / userMatching.experienceRelevance.length
      : 50;

    const overall = Math.round(
      keywordOptimization * 0.4 + 
      contentQuality * 0.3 + 
      structureFormat * 0.2 + 
      avgExperienceRelevance * 0.1
    );

    const criticalIssues: CriticalIssue[] = [];
    const optimizationOpportunities: OptimizationOpportunity[] = [];

    // Identify critical issues
    if (keywordOptimization < 50) {
      criticalIssues.push({
        issue: 'Low keyword match rate',
        impact: '-30 ATS points',
        priority: 'high',
        solution: 'Integrate missing critical keywords naturally into experience descriptions'
      });
    }

    if (contentQuality < 60) {
      criticalIssues.push({
        issue: 'Insufficient quantified achievements',
        impact: '-20 ATS points',
        priority: 'high',
        solution: 'Add specific metrics, percentages, and measurable outcomes'
      });
    }

    // Identify optimization opportunities
    optimizationOpportunities.push({
      opportunity: 'Keyword density optimization',
      action: 'Naturally integrate 3-5 missing keywords',
      expectedImpact: '+15-20 points',
      effort: 'medium',
      priority: 'high'
    });

    return {
      currentScore: {
        overall,
        breakdown: {
          keywordOptimization: Math.round(keywordOptimization),
          contentQuality: Math.round(contentQuality),
          structureFormat: Math.round(structureFormat),
          experienceRelevance: Math.round(avgExperienceRelevance)
        }
      },
      criticalIssues,
      optimizationOpportunities,
      recommendations: {
        immediateActions: [
          'Add missing critical keywords to experience bullets',
          'Quantify achievements with specific numbers',
          'Optimize professional summary with job-relevant terms'
        ],
        strategicImprovements: [
          'Reorder experiences by relevance to target role',
          'Enhance skills section with job-specific technologies',
          'Add industry-specific terminology throughout'
        ],
        keywordIntegration: userMatching.gapAnalysis.criticalMissing.slice(0, 5),
        contentEnhancements: [
          'Use action verbs that match job description',
          'Add context for achievements to show business impact',
          'Ensure consistent formatting and structure'
        ]
      }
    };
  }, [personalInfo, workExperience]);

  // Phase 4: Intelligent Preliminary Resume Generation
  const generatePreliminaryResume = useCallback((
    jobKeywords: ExtractedKeyword[], 
    userMatching: UserDataMatching, 
    atsOptimization: ATSOptimizationResult
  ): PreliminaryResume => {
    // Select most relevant experiences
    const topExperiences = userMatching.experienceRelevance
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    // Generate optimized professional summary
    const topSkills = userMatching.skillMatches
      .filter(sm => sm.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 4)
      .map(sm => sm.userSkill);

    const professionalSummary = `Results-driven professional with ${workExperience.length > 0 ? '5+' : '3+'} years of experience in ${topSkills.slice(0, 2).join(' and ')}. Proven track record of ${userMatching.achievementAlignment[0]?.achievement || 'delivering high-impact solutions'}. Expertise in ${topSkills.slice(2, 4).join(', ')} with strong ${jobKeywords.find(kw => kw.category === 'soft_skill')?.keyword || 'analytical'} and problem-solving abilities.`;

    // Generate core competencies
    const coreCompetencies = [
      ...topSkills,
      ...jobKeywords.filter(kw => kw.priority === 'critical' || kw.priority === 'high').map(kw => kw.keyword)
    ].slice(0, 12);

    // Generate optimized work experience
    const optimizedWorkExperience: OptimizedWorkExperience[] = topExperiences.map(exp => {
      const originalExp = workExperience.find(we => `${we.position} at ${we.company}` === exp.experience);
      if (!originalExp) return null;

      // Enhance bullets with keywords
      const bullets = originalExp.description?.split('\n').filter(b => b.trim()).slice(0, 4) || [];
      const optimizedBullets = bullets.map(bullet => {
        let enhanced = bullet.trim();
        // Add missing keywords naturally if relevant
        const relevantKeywords = exp.keywordMatches.filter(kw => !enhanced.toLowerCase().includes(kw.toLowerCase()));
        if (relevantKeywords.length > 0 && enhanced.length < 120) {
          enhanced = enhanced.replace(/\.$/, '') + ` utilizing ${relevantKeywords[0]}.`;
        }
        return enhanced;
      });

      return {
        position: originalExp.position,
        company: originalExp.company,
        duration: `${originalExp.startDate} - ${originalExp.isCurrentRole ? 'Present' : originalExp.endDate}`,
        optimizedBullets,
        keywordsIntegrated: exp.keywordMatches,
        relevanceScore: exp.relevanceScore
      };
    }).filter(Boolean) as OptimizedWorkExperience[];

    return {
      personalInfo: {
        name: personalInfo?.name || 'Your Name',
        email: personalInfo?.email || 'your.email@example.com',
        phone: personalInfo?.phone || '(555) 123-4567',
        location: personalInfo?.location || 'Your City, State',
        linkedin: 'linkedin.com/in/yourprofile'
      },
      professionalSummary,
      coreCompetencies,
      workExperience: optimizedWorkExperience,
      keyAchievements: userMatching.achievementAlignment.slice(0, 3).map(aa => ({
        achievement: aa.achievement,
        impact: 'Quantified business impact',
        relevance: aa.competitiveAdvantage
      })),
      optimizationNotes: {
        keywordsAdded: atsOptimization.recommendations.keywordIntegration,
        contentEnhanced: ['Quantified achievements', 'Added relevant keywords', 'Optimized formatting'],
        strategicChoices: ['Selected most relevant experiences', 'Prioritized critical job requirements', 'Enhanced keyword density']
      }
    };
  }, [workExperience, personalInfo]);

  // Main analysis function that orchestrates all phases
  const performComprehensiveAnalysis = useCallback(async (
    jobDescription: string,
    jobTitle: string,
    company: string
  ): Promise<ComprehensiveATSAnalysis> => {
    setIsAnalyzing(true);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Phase 1: Job Description Analysis
      const jobAnalysis = analyzeJobDescription(jobDescription);

      // Phase 2: User Data Matching
      const userDataMatching = analyzeUserDataMatching(jobAnalysis.extractedKeywords);

      // Phase 3: ATS Optimization
      const atsOptimization = calculateATSScore(jobAnalysis.extractedKeywords, userDataMatching);

      // Phase 4: Preliminary Resume Generation
      const preliminaryResume = generatePreliminaryResume(jobAnalysis.extractedKeywords, userDataMatching, atsOptimization);

      // Implementation Guidance
      const implementationGuidance: ImplementationGuidance = {
        nextSteps: [
          'Review and integrate suggested keywords naturally',
          'Quantify achievements with specific metrics',
          'Optimize professional summary with job-relevant terms',
          'Reorder experiences by relevance score'
        ],
        scoreImprovementPlan: [
          {
            action: 'Integrate missing critical keywords',
            timeframe: 'Immediate (1-2 hours)',
            expectedImpact: '+15-20 ATS points'
          },
          {
            action: 'Add quantified achievements',
            timeframe: 'Short-term (1-2 days)',
            expectedImpact: '+10-15 ATS points'
          }
        ],
        longTermStrategy: [
          'Develop skills in missing critical areas',
          'Gain experience with required technologies',
          'Build portfolio demonstrating relevant expertise'
        ],
        jobApplicationTips: [
          `Customize resume for ${jobTitle} role specifically`,
          `Research ${company} culture and values`,
          'Prepare STAR method examples for key achievements',
          'Practice discussing technical skills and experience'
        ]
      };

      const result: ComprehensiveATSAnalysis = {
        jobAnalysis,
        userDataMatching,
        atsOptimization,
        preliminaryResume,
        implementationGuidance
      };

      setAnalysis(result);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [analyzeJobDescription, analyzeUserDataMatching, calculateATSScore, generatePreliminaryResume]);

  return {
    analysis,
    isAnalyzing,
    performComprehensiveAnalysis,
    setAnalysis
  };
};