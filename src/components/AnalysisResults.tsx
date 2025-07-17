import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileText, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { type JobAnalysis, useJobAnalysis } from "@/hooks/useJobAnalysis";
import { toast } from "sonner";

interface AnalysisResultsProps {
  analysis: JobAnalysis;
  onGenerateResume: () => void;
  onNavigateToVault?: () => void;
  recentlyCreatedResumeId?: string;
}

const AnalysisResults = ({ analysis, onGenerateResume, onNavigateToVault, recentlyCreatedResumeId }: AnalysisResultsProps) => {
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [addingSkills, setAddingSkills] = useState(false);
  const { addUserSkill, refetchSkills } = useJobAnalysis();

  // Generate critical issues based on analysis
  const getCriticalIssues = () => {
    const issues = [];
    
    if (analysis.match_score < 60) {
      issues.push({
        title: "Low Skills Match",
        description: "Your profile matches only a few required skills for this role",
        severity: "high"
      });
    }
    
    if (analysis.missing_skills.length > 3) {
      issues.push({
        title: "Missing Key Technologies",
        description: `You're missing ${analysis.missing_skills.length} important skills mentioned in the job`,
        severity: "medium"
      });
    }
    
    if (analysis.matched_skills.length < 3) {
      issues.push({
        title: "Weak Keyword Presence",
        description: "Your resume may not pass initial ATS screening due to few matching keywords",
        severity: "high"
      });
    }

    // Always show at least one improvement opportunity
    if (issues.length === 0) {
      issues.push({
        title: "Resume Enhancement Available",
        description: "We can optimize your resume language to better match this specific role",
        severity: "low"
      });
    }

    return issues.slice(0, 3); // Top 3 issues
  };

  const criticalIssues = getCriticalIssues();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 80) return "Excellent match! Your profile aligns well with this role.";
    if (score >= 60) return "Good foundation with room for optimization.";
    return "Significant gaps that need addressing for better chances.";
  };

  const handleAddMissingSkills = async () => {
    if (analysis.missing_skills.length === 0) {
      toast.info("No missing skills to add");
      return;
    }

    setAddingSkills(true);
    try {
      let addedCount = 0;
      
      for (const skill of analysis.missing_skills) {
        const result = await addUserSkill({
          skill_name: skill,
          proficiency_level: 'beginner',
          years_experience: 0
        });
        
        if (result) {
          addedCount++;
        }
      }
      
      if (addedCount > 0) {
        toast.success(`Added ${addedCount} skills to your profile!`, {
          description: "You can update proficiency levels and experience in the Skills section."
        });
        await refetchSkills();
      } else {
        toast.error("Failed to add skills. Some may already exist in your profile.");
      }
    } catch (error) {
      console.error('Error adding skills:', error);
      toast.error("Failed to add skills to your profile");
    } finally {
      setAddingSkills(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall ATS Score - Large and Prominent */}
      <Card className="border-2 border-primary/20">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className={`text-6xl font-bold ${getScoreColor(analysis.match_score)}`}>
              {analysis.match_score}%
            </div>
            <div className="text-xl font-medium text-slate-700">
              ATS Match Score
            </div>
            <Progress 
              value={analysis.match_score} 
              className="h-4 w-full max-w-md mx-auto"
            />
            <p className="text-slate-600 max-w-md mx-auto">
              {getScoreDescription(analysis.match_score)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top 3 Critical Issues */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Critical Areas to Address
        </h3>
        {criticalIssues.map((issue, index) => (
          <Card key={index} className={`border-l-4 ${
            issue.severity === 'high' ? 'border-red-500 bg-red-50' : 
            issue.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' : 
            'border-blue-500 bg-blue-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  issue.severity === 'high' ? 'bg-red-100' : 
                  issue.severity === 'medium' ? 'bg-yellow-100' : 
                  'bg-blue-100'
                }`}>
                  <AlertTriangle className={`w-4 h-4 ${
                    issue.severity === 'high' ? 'text-red-600' : 
                    issue.severity === 'medium' ? 'text-yellow-600' : 
                    'text-blue-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-slate-900 mb-1">{issue.title}</h4>
                  <p className="text-sm text-slate-700">{issue.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary CTA or Navigation */}
      {recentlyCreatedResumeId ? (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">
                Resume Created Successfully!
              </h3>
              <p className="text-slate-600">
                Your optimized resume has been saved to the Resume Vault
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={onNavigateToVault}
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  View in Resume Vault
                </Button>
                <Button 
                  onClick={onGenerateResume} 
                  size="lg"
                  variant="outline"
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  Generate Another
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">
                Ready to optimize your resume?
              </h3>
              <p className="text-slate-600">
                Generate a tailored version that addresses these issues and increases your ATS score
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={onGenerateResume} 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-lg px-8 py-4"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  Generate Optimized Resume
                </Button>
                <p className="text-xs text-slate-500">
                  Expected improvement: +15-25 ATS points
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis - Hidden Behind Toggle */}
      <Collapsible open={showDetailedAnalysis} onOpenChange={setShowDetailedAnalysis}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full">
            {showDetailedAnalysis ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Hide Detailed Analysis
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                View Detailed Analysis
              </>
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="space-y-6 mt-6">
          {/* Skills Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  Skills You Have
                </CardTitle>
                <CardDescription>
                  {analysis.matched_skills.length} skills that match the job requirements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {analysis.matched_skills.length > 0 ? (
                    analysis.matched_skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-slate-500 text-sm">No matching skills found. Consider adding relevant experience.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <AlertCircle className="w-5 h-5" />
                  Skills to Highlight
                </CardTitle>
                <CardDescription>
                  {analysis.missing_skills.length} areas where you could strengthen your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {analysis.missing_skills.length > 0 ? (
                      analysis.missing_skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="border-orange-200 text-orange-700 bg-orange-50">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-slate-500 text-sm">Great! You have most skills needed for this role.</p>
                    )}
                  </div>
                  
                  {analysis.missing_skills.length > 0 && (
                    <div className="pt-2 border-t">
                      <Button
                        onClick={handleAddMissingSkills}
                        disabled={addingSkills}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <Plus className="w-4 h-4" />
                        {addingSkills ? 'Adding Skills...' : `Add ${analysis.missing_skills.length} Skills to Profile`}
                      </Button>
                      <p className="text-xs text-slate-500 mt-1">
                        Skills will be added as beginner level. You can update proficiency in the Skills section.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Key Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>What This Role Requires</CardTitle>
              <CardDescription>Important requirements we found in the job description</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {analysis.key_requirements.map((requirement, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <span className="text-slate-700">{requirement}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Optimization Tips */}
          <Card>
            <CardHeader>
              <CardTitle>How to Improve Your Application</CardTitle>
              <CardDescription>Specific recommendations to increase your chances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                    <p className="text-slate-700">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AnalysisResults;