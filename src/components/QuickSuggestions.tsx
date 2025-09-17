import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useResumeData } from '@/contexts/ResumeDataContext';

interface QuickSuggestionsProps {
  onInsert: (suggestion: string) => void;
  targetRole?: string;
  jobDescription?: string;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({ 
  onInsert, 
  targetRole,
  jobDescription 
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { workExperience, education, skills, certifications } = useResumeData();

  // Fallback static suggestions
  const fallbackSuggestions = [
    'Increased team productivity by 40% through process optimization',
    'Led cross-functional project resulting in $500K cost savings',
    'Implemented data analytics solution improving decision speed by 60%',
    'Mentored 5 junior developers in modern web technologies',
    'Reduced customer churn by 25% through strategic product improvements',
    'Launched new feature adopted by 80% of active users within 3 months'
  ];

  const generatePersonalizedSuggestions = async () => {
    if (!user) {
      setSuggestions(fallbackSuggestions);
      setError('Please sign in to get personalized suggestions');
      return;
    }

    // Check if we have sufficient resume data
    if (!workExperience?.length && !skills?.length) {
      setSuggestions(fallbackSuggestions);
      setError('Add your work experience and skills to get personalized suggestions');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare user's resume data for AI analysis
      const resumeData = {
        workExperience: workExperience?.map(exp => ({
          position: exp.position,
          company: exp.company,
          description: exp.description,
          startDate: exp.startDate,
          endDate: exp.endDate,
          isCurrentRole: exp.isCurrentRole
        })) || [],
        skills: skills || [],
        education: education?.map(edu => ({
          degree: edu.degree,
          institution: edu.institution,
          fieldOfStudy: edu.fieldOfStudy
        })) || [],
        certifications: certifications?.map(cert => ({
          name: cert.name,
          issuer: cert.issuer
        })) || []
      };

      const { data, error } = await supabase.functions.invoke('generate-resume-suggestions', {
        body: {
          targetRole: targetRole || 'Software Engineer',
          jobDescription: jobDescription || '',
          resumeData: resumeData,
          userId: user.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate suggestions');
      }

      if (data?.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setError(null);
        toast.success(`Generated ${data.suggestions.length} personalized suggestions based on your ${targetRole || 'role'} profile!`);
      } else {
        throw new Error('No suggestions returned from AI');
      }
    } catch (error) {
      console.error('Error generating personalized suggestions:', error);
      setError('Using default suggestions - AI optimization temporarily unavailable');
      // Fall back to static suggestions
      setSuggestions(fallbackSuggestions);
      toast.error('Using default suggestions. Your resume data is available but AI optimization failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load initial suggestions
  useEffect(() => {
    // Start with fallback suggestions, then try to generate personalized ones
    setSuggestions(fallbackSuggestions);
    generatePersonalizedSuggestions();
  }, [targetRole, jobDescription]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">AI Suggestions</CardTitle>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generatePersonalizedSuggestions}
            disabled={isLoading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        {targetRole && (
          <Badge variant="secondary" className="text-xs w-fit">
            Tailored for: {targetRole}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {error && (
          <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            <AlertCircle className="w-3 h-3" />
            <span>Using default suggestions</span>
          </div>
        )}
        {suggestions.map((suggestion, idx) => (
          <Button 
            key={idx}
            variant="outline" 
            size="sm" 
            className="w-full text-left justify-start h-auto p-2 text-xs whitespace-normal break-words hover:bg-primary/5"
            onClick={() => onInsert(suggestion)}
            disabled={isLoading}
          >
            <span className="truncate">+ {suggestion}</span>
          </Button>
        ))}
        {isLoading && (
          <div className="flex items-center justify-center p-4 text-xs text-slate-600">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Generating personalized suggestions...
          </div>
        )}
      </CardContent>
    </Card>
  );
};