
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Target, TrendingUp, Calendar, ExternalLink } from "lucide-react";

interface Skill {
  name: string;
  level: number;
  category: string;
  trending: boolean;
}

interface Certification {
  name: string;
  provider: string;
  estimatedTime: string;
  cost: string;
  priority: "high" | "medium" | "low";
  description: string;
}

const SkillsAssessment = () => {
  const [currentSkills] = useState<Skill[]>([
    { name: "Product Management", level: 85, category: "Core", trending: false },
    { name: "Cross-functional Leadership", level: 80, category: "Leadership", trending: true },
    { name: "Agile/Scrum", level: 75, category: "Methodology", trending: false },
    { name: "Data Analysis", level: 70, category: "Technical", trending: true },
    { name: "Strategic Planning", level: 78, category: "Strategy", trending: false },
    { name: "User Experience", level: 65, category: "Design", trending: true },
    { name: "SQL", level: 45, category: "Technical", trending: true },
    { name: "Machine Learning", level: 25, category: "Technical", trending: true }
  ]);

  const [recommendedCertifications] = useState<Certification[]>([
    {
      name: "Certified Scrum Product Owner (CSPO)",
      provider: "Scrum Alliance",
      estimatedTime: "16 hours",
      cost: "$1,295",
      priority: "high",
      description: "Essential for product managers working in agile environments. Validates your understanding of product ownership and backlog management."
    },
    {
      name: "Google Analytics Individual Qualification",
      provider: "Google",
      estimatedTime: "4-6 hours",
      cost: "Free",
      priority: "high",
      description: "Demonstrate proficiency in Google Analytics and data-driven decision making."
    },
    {
      name: "SQL for Data Science",
      provider: "Coursera",
      estimatedTime: "4 weeks",
      cost: "$49/month",
      priority: "medium",
      description: "Build essential SQL skills for data analysis and reporting."
    },
    {
      name: "Machine Learning for Everyone",
      provider: "Coursera",
      estimatedTime: "6 weeks",
      cost: "$49/month",
      priority: "low",
      description: "Understanding ML fundamentals to better communicate with technical teams."
    }
  ]);

  const getSkillColor = (level: number) => {
    if (level >= 80) return "text-green-600";
    if (level >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Your Skill Profile
          </CardTitle>
          <CardDescription>
            Based on your logged achievements and industry benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentSkills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{skill.name}</span>
                    {skill.trending && (
                      <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${getSkillColor(skill.level)}`}>
                    {skill.level}%
                  </span>
                </div>
                <Progress value={skill.level} className="h-2" />
                <div className="text-xs text-slate-500">{skill.category}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skill Development Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Recommended Certifications
          </CardTitle>
          <CardDescription>
            Curated learning paths to boost your career prospects
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendedCertifications.map((cert, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 mb-1">{cert.name}</h3>
                  <p className="text-sm text-slate-600 mb-2">by {cert.provider}</p>
                  <p className="text-sm text-slate-700">{cert.description}</p>
                </div>
                <Badge className={getPriorityColor(cert.priority)}>
                  {cert.priority} priority
                </Badge>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-slate-600 mb-3">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {cert.estimatedTime}
                </div>
                <div className="font-medium">
                  {cert.cost}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button size="touch" variant="outline" className="flex-1 md:flex-none">
                  Learn More
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
                <Button size="touch" variant="primary" className="flex-1 md:flex-none">
                  Start Learning
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Industry Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market Trends</CardTitle>
            <CardDescription>Skills in demand for your role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">AI/Machine Learning</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">+45%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Data Analysis</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">+32%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cross-functional Leadership</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">+28%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Experience</span>
                <Badge variant="outline" className="text-xs text-green-600 border-green-200">+25%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Progress</CardTitle>
            <CardDescription>Skills development this quarter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">3</div>
                <div className="text-sm text-slate-600">Skills Improved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600 mb-1">1</div>
                <div className="text-sm text-slate-600">Certification Started</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">15hrs</div>
                <div className="text-sm text-slate-600">Learning Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SkillsAssessment;
