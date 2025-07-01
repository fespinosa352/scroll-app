
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, CheckCircle, FileText, Upload } from "lucide-react";

interface ATSCheck {
  category: string;
  score: number;
  status: "pass" | "warning" | "fail";
  issues: string[];
  recommendations: string[];
}

const ATSOptimizer = () => {
  const [atsAnalysis] = useState<ATSCheck[]>([
    {
      category: "Format & Structure",
      score: 92,
      status: "pass",
      issues: [],
      recommendations: ["Great job! Your resume structure is ATS-friendly."]
    },
    {
      category: "Keyword Optimization",
      score: 78,
      status: "warning",
      issues: ["Missing 3 key industry terms", "Low keyword density in experience section"],
      recommendations: [
        "Include 'product roadmap' and 'stakeholder management' in your descriptions",
        "Add 'cross-functional collaboration' to better match common job descriptions"
      ]
    },
    {
      category: "Contact Information",
      score: 100,
      status: "pass",
      issues: [],
      recommendations: ["Perfect! All contact details are properly formatted."]
    },
    {
      category: "File Compatibility",
      score: 85,
      status: "warning",
      issues: ["Complex formatting may not parse correctly in older ATS systems"],
      recommendations: [
        "Consider using simpler bullet points",
        "Avoid text boxes and complex tables"
      ]
    },
    {
      category: "Section Organization",
      score: 95,
      status: "pass",
      issues: [],
      recommendations: ["Excellent section structure and ordering."]
    }
  ]);

  const overallScore = Math.round(atsAnalysis.reduce((sum, check) => sum + check.score, 0) / atsAnalysis.length);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pass": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "warning": return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "fail": return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pass": return "text-green-600";
      case "warning": return "text-yellow-600";
      case "fail": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall ATS Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            ATS Optimization Score
          </CardTitle>
          <CardDescription>
            How well your resume will perform with Applicant Tracking Systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <div className={`text-5xl font-bold mb-2 ${getStatusColor(overallScore >= 90 ? 'pass' : overallScore >= 70 ? 'warning' : 'fail')}`}>
              {overallScore}%
            </div>
            <div className="text-lg text-slate-600 mb-4">Overall ATS Compatibility</div>
            <Progress value={overallScore} className="h-4 mb-4" />
            <div className="text-sm text-slate-500">
              {overallScore >= 90 ? "Excellent! Your resume should parse perfectly." :
               overallScore >= 70 ? "Good, but there's room for improvement." :
               "Needs attention to ensure proper ATS parsing."}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Upload New Resume
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700">
              Download Optimized Version
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Detailed Analysis</h2>
        
        {atsAnalysis.map((check, index) => (
          <Card key={index}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  {getStatusIcon(check.status)}
                  {check.category}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${getStatusColor(check.status)}`}>
                    {check.score}%
                  </span>
                  <Badge variant={check.status === 'pass' ? 'default' : 'outline'} 
                         className={check.status === 'pass' ? 'bg-green-100 text-green-800' : 
                                   check.status === 'warning' ? 'border-yellow-200 text-yellow-800 bg-yellow-50' :
                                   'border-red-200 text-red-800 bg-red-50'}>
                    {check.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <Progress value={check.score} className="h-2" />
              
              {check.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Issues Found
                  </h4>
                  <ul className="space-y-1">
                    {check.issues.map((issue, issueIndex) => (
                      <li key={issueIndex} className="text-sm text-slate-700 pl-4 border-l-2 border-red-200">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="space-y-2">
                <h4 className="font-medium text-blue-600 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Recommendations
                </h4>
                <ul className="space-y-1">
                  {check.recommendations.map((rec, recIndex) => (
                    <li key={recIndex} className="text-sm text-slate-700 pl-4 border-l-2 border-blue-200">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ATS Tips */}
      <Card>
        <CardHeader>
          <CardTitle>ATS Best Practices</CardTitle>
          <CardDescription>Tips to maximize your resume's ATS compatibility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-green-600">✓ Do This</h4>
              <ul className="text-sm space-y-2 text-slate-700">
                <li>• Use standard section headings (Experience, Education, Skills)</li>
                <li>• Include relevant keywords from job descriptions</li>
                <li>• Use simple, clean formatting</li>
                <li>• Save in both PDF and DOCX formats</li>
                <li>• Use standard fonts (Arial, Calibri, Times New Roman)</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-red-600">✗ Avoid This</h4>
              <ul className="text-sm space-y-2 text-slate-700">
                <li>• Complex graphics, charts, or images</li>
                <li>• Text boxes or tables with merged cells</li>
                <li>• Headers and footers with important info</li>
                <li>• Fancy fonts or excessive formatting</li>
                <li>• Acronyms without spelling them out first</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ATSOptimizer;
