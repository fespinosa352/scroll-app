import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { ATSAnalysis } from '@/hooks/useATSAnalyzer';

interface ATSInsightsProps {
  analysis: ATSAnalysis | null;
}

export const ATSInsights: React.FC<ATSInsightsProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="text-center text-slate-500 py-8">
        Start typing to see ATS analysis
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Optimizations Applied</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {analysis.optimizations.map((opt, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-700">{opt}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span>Improvement Suggestions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysis.issues.length > 0 ? (
              analysis.issues.map((issue, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="text-sm text-slate-700">{issue}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="mt-1 ml-0 h-6 text-xs"
                      onClick={() => {/* Auto-fix logic would go here */}}
                    >
                      Auto-fix
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-green-600 text-sm">
                🎉 No issues found! Your resume is well optimized.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};