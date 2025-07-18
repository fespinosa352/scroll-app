import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface QuickSuggestionsProps {
  onInsert: (suggestion: string) => void;
}

export const QuickSuggestions: React.FC<QuickSuggestionsProps> = ({ onInsert }) => {
  const suggestions = [
    'Increased team productivity by 40% through process optimization',
    'Led cross-functional project resulting in $500K cost savings',
    'Implemented data analytics solution improving decision speed by 60%',
    'Mentored 5 junior developers in modern web technologies',
    'Reduced customer churn by 25% through strategic product improvements',
    'Launched new feature adopted by 80% of active users within 3 months'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Quick Suggestions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((suggestion, idx) => (
          <Button 
            key={idx}
            variant="outline" 
            size="sm" 
            className="w-full text-left justify-start h-auto p-2 text-xs whitespace-normal break-words"
            onClick={() => onInsert(suggestion)}
          >
            <span className="truncate">+ {suggestion}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};