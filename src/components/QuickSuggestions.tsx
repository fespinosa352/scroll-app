import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-resume-suggestions', {
        body: {
          targetRole: targetRole || 'Software Engineer',
          jobDescription: jobDescription || ''
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to generate suggestions');
      }

      if (data?.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        toast.success('Generated personalized suggestions based on your profile!');
      } else {
        throw new Error('No suggestions returned');
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setError(error.message);
      // Fall back to static suggestions
      setSuggestions(fallbackSuggestions);
      toast.error('Using default suggestions. Try again for personalized ones.');
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