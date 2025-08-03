import React, { useState } from 'react';
import { ContentSelectionInterface } from '@/components/ContentSelectionInterface';
import { JobAnalysis } from '@/hooks/useJobAnalysis';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  Eye, 
  Sparkles,
  Target,
  TrendingUp
} from 'lucide-react';

// Mock job analysis data for demonstration
const mockJobAnalysis: JobAnalysis = {
  job_title: "Senior Full Stack Developer",
  company: "TechCorp Inc",
  job_description: "We are looking for a Senior Full Stack Developer with experience in React, Node.js, TypeScript, and cloud technologies...",
  match_score: 85,
  matched_skills: ["React", "TypeScript", "Node.js", "AWS", "Docker", "JavaScript", "MongoDB"],
  missing_skills: ["Kubernetes", "GraphQL", "Redis"],
  key_requirements: ["5+ years experience", "React expertise", "Cloud deployment", "Team leadership", "Agile methodology"],
  recommendations: [
    "Highlight your React and TypeScript experience",
    "Emphasize cloud deployment projects",
    "Include team leadership examples",
    "Showcase full-stack development skills"
  ]
};

export default function ContentSelectionPage() {
  const [selectedContent, setSelectedContent] = useState<any[]>([]);
  const [currentATSScore, setCurrentATSScore] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleSelectionChange = (content: any[]) => {
    setSelectedContent(content);
  };

  const handleATSScoreUpdate = (score: number) => {
    setCurrentATSScore(score);
  };

  const handleGenerateResume = () => {
    console.log('Generating resume with selected content:', selectedContent);
    // Here you would integrate with the resume generation logic
  };

  const handlePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Smart Resume Builder</h1>
          <p className="text-muted-foreground">
            Select the most relevant content for "{mockJobAnalysis.job_title}" at {mockJobAnalysis.company}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Content Selection (Main Area) */}
          <div className="lg:col-span-3">
            <ContentSelectionInterface
              jobAnalysis={mockJobAnalysis}
              onSelectionChange={handleSelectionChange}
              onATSScoreUpdate={handleATSScoreUpdate}
            />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Job Analysis Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Target Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium">{mockJobAnalysis.job_title}</h4>
                  <p className="text-sm text-muted-foreground">{mockJobAnalysis.company}</p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Match</span>
                    <span className="text-sm font-bold">{mockJobAnalysis.match_score}%</span>
                  </div>
                  <Progress value={mockJobAnalysis.match_score} className="h-2" />
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Key Skills Needed</h5>
                  <div className="flex flex-wrap gap-1">
                    {mockJobAnalysis.matched_skills.slice(0, 4).map(skill => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {mockJobAnalysis.matched_skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{mockJobAnalysis.matched_skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="text-sm font-medium mb-2">Missing Skills</h5>
                  <div className="flex flex-wrap gap-1">
                    {mockJobAnalysis.missing_skills.map(skill => (
                      <Badge key={skill} variant="destructive" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current ATS Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Live ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    {currentATSScore}%
                  </div>
                  <Progress value={currentATSScore} className="mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Score updates as you select content
                  </p>
                </div>
                
                {currentATSScore > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      {currentATSScore >= 80 && "Excellent! Your selections are highly relevant."}
                      {currentATSScore >= 60 && currentATSScore < 80 && "Good match. Consider adding more relevant content."}
                      {currentATSScore >= 40 && currentATSScore < 60 && "Fair match. Try selecting more targeted content."}
                      {currentATSScore < 40 && "Consider selecting content more aligned with the job requirements."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Content Summary */}
            {selectedContent.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Selected Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedContent.length} items selected
                    </p>
                    <div className="flex flex-col gap-1">
                      {selectedContent.map(item => (
                        <div key={item.id} className="text-xs p-2 bg-muted rounded">
                          {item.type === 'work-experience' && '💼'}
                          {item.type === 'education' && '🎓'}
                          {item.type === 'certification' && '🏆'}
                          {item.type === 'skill' && '💻'}
                          {item.type === 'achievement' && '🎯'}
                          <span className="ml-2">{item.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                onClick={handlePreview}
                variant="outline" 
                className="w-full"
                disabled={selectedContent.length === 0}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Resume
              </Button>
              
              <Button 
                onClick={handleGenerateResume}
                className="w-full"
                disabled={selectedContent.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Resume
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                disabled={selectedContent.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Selection
              </Button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {showPreview && selectedContent.length > 0 && (
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Resume Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white border rounded-lg p-6 text-gray-900">
                  <h2 className="text-xl font-bold mb-4">John Doe</h2>
                  
                  {/* Work Experience */}
                  {selectedContent.filter(item => item.type === 'work-experience').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 border-b">Work Experience</h3>
                      {selectedContent.filter(item => item.type === 'work-experience').map(item => (
                        <div key={item.id} className="mb-4">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.subtitle}</p>
                          <div className="text-sm">
                            {item.bullets?.map((bullet: string, index: number) => (
                              <p key={index} className="mb-1">• {bullet}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Education */}
                  {selectedContent.filter(item => item.type === 'education').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 border-b">Education</h3>
                      {selectedContent.filter(item => item.type === 'education').map(item => (
                        <div key={item.id} className="mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Skills */}
                  {selectedContent.filter(item => item.type === 'skill').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 border-b">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContent.filter(item => item.type === 'skill').map(item => (
                          <span key={item.id} className="bg-gray-100 px-2 py-1 rounded text-sm">
                            {item.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Certifications */}
                  {selectedContent.filter(item => item.type === 'certification').length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-3 border-b">Certifications</h3>
                      {selectedContent.filter(item => item.type === 'certification').map(item => (
                        <div key={item.id} className="mb-2">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.subtitle}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}