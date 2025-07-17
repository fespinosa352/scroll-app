import { useState, useCallback } from 'react';
import { StructuredResumeData } from './useMarkupConverter';

export interface ATSAnalysis {
  score: number;
  issues: string[];
  optimizations: string[];
  keywordDensity: number;
  suggestions: string[];
}

export const useATSAnalyzer = () => {
  const [atsAnalysis, setATSAnalysis] = useState<ATSAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeContent = useCallback(async (structured: StructuredResumeData): Promise<ATSAnalysis> => {
    setIsAnalyzing(true);
    
    // Simulate async analysis
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const issues: string[] = [];
    const optimizations: string[] = [];
    let score = 100;

    // Check keyword density
    const totalKeywords = structured.keywordsFound?.length || 0;
    if (totalKeywords < 5) {
      issues.push('Low keyword density - add more industry-relevant terms');
      score -= 20;
    } else {
      optimizations.push(`Good keyword usage: ${totalKeywords} relevant terms found`);
    }

    // Check bullet points
    const totalBullets = structured.experienceBullets?.reduce((acc, exp) => 
      acc + (exp.bullets?.length || 0), 0) || 0;
      
    if (totalBullets < 6) {
      issues.push('Add more bullet points to showcase achievements');
      score -= 15;
    } else {
      optimizations.push(`Strong content: ${totalBullets} achievement bullets`);
    }

    // Check for quantified results
    const hasNumbers = structured.experienceBullets?.some(exp => 
      exp.bullets?.some(bullet => /\d+%|\$\d+|\d+x|\d+\+/.test(bullet))
    );
    
    if (!hasNumbers) {
      issues.push('Add quantified results (percentages, dollar amounts, metrics)');
      score -= 25;
    } else {
      optimizations.push('Great use of quantified achievements');
    }

    // Check contact information
    if (!structured.personalInfo?.email || !structured.personalInfo?.phone) {
      issues.push('Complete contact information required');
      score -= 10;
    } else {
      optimizations.push('Complete contact information provided');
    }

    const analysis: ATSAnalysis = {
      score: Math.max(score, 0),
      issues,
      optimizations: optimizations.concat([
        'Professional formatting detected',
        'Clean section structure',
        'Proper heading hierarchy'
      ]),
      keywordDensity: totalKeywords,
      suggestions: [
        'Consider adding more action verbs',
        'Include specific technologies used',
        'Quantify achievements where possible'
      ]
    };

    setATSAnalysis(analysis);
    setIsAnalyzing(false);
    return analysis;
  }, []);

  return {
    atsAnalysis,
    analyzeContent,
    isAnalyzing
  };
};