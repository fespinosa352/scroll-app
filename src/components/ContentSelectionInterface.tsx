import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Briefcase,
  GraduationCap,
  Award,
  Code,
  Target,
  TrendingUp,
  Lightbulb,
  Star,
  CheckCircle2,
  Circle,
  Eye,
  Filter,
  Search,
  Sparkles
} from 'lucide-react';
import { useResumeData } from '@/contexts/ResumeDataContext';
import { JobAnalysis } from '@/hooks/useJobAnalysis';
import { useProjects } from '@/hooks/useProjects';

interface ContentItem {
  id: string;
  type: 'work-experience' | 'education' | 'certification' | 'skill' | 'achievement';
  title: string;
  subtitle?: string;
  content: string;
  bullets?: string[];
  relevanceScore?: number;
  isRecommended?: boolean;
  isSelected: boolean;
  metadata?: any;
}

interface SelectedBullet {
  experienceId: string;
  bulletId: string;
  content: string;
}

interface ContentSelectionInterfaceProps {
  jobAnalysis?: JobAnalysis;
  onSelectionChange?: (selectedContent: ContentItem[]) => void;
  onATSScoreUpdate?: (score: number) => void;
}

export const ContentSelectionInterface: React.FC<ContentSelectionInterfaceProps> = ({
  jobAnalysis,
  onSelectionChange,
  onATSScoreUpdate
}) => {
  const {
    workExperienceBlocks,
    education,
    certifications,
    skills
  } = useResumeData();

  const { projects } = useProjects();

  const [selectedContent, setSelectedContent] = useState<ContentItem[]>([]);
  const [selectedBullets, setSelectedBullets] = useState<SelectedBullet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRecommended, setFilterRecommended] = useState(false);
  const [currentATSScore, setCurrentATSScore] = useState(0);
  const [activeTab, setActiveTab] = useState('experience');

  // Convert data to ContentItem format
  const convertToContentItems = (): ContentItem[] => {
    const items: ContentItem[] = [];

    // Work Experience
    workExperienceBlocks.forEach(exp => {
      const allBullets = exp.sections.flatMap(section => section.blocks.map(block => block.content));
      const relevanceScore = calculateRelevanceScore(exp.position, allBullets.join('\n'), jobAnalysis);

      items.push({
        id: exp.id,
        type: 'work-experience',
        title: exp.position,
        subtitle: exp.company,
        content: allBullets.join('\n'),
        bullets: allBullets,
        relevanceScore,
        isRecommended: relevanceScore > 70,
        isSelected: false,
        metadata: exp
      });
    });

    // Education
    education.forEach(edu => {
      const title = `${edu.degree} in ${edu.fieldOfStudy}`;
      const content = `${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution}`;
      const relevanceScore = calculateRelevanceScore(title, content, jobAnalysis);
      items.push({
        id: edu.id,
        type: 'education',
        title: title,
        subtitle: edu.institution,
        content: content,
        relevanceScore,
        isRecommended: relevanceScore > 60,
        isSelected: false,
        metadata: edu
      });
    });

    // Certifications
    certifications.forEach(cert => {
      const content = `${cert.name} from ${cert.issuer}`;
      const relevanceScore = calculateRelevanceScore(cert.name, content, jobAnalysis);
      items.push({
        id: cert.id,
        type: 'certification',
        title: cert.name,
        subtitle: cert.issuer,
        content: content,
        relevanceScore,
        isRecommended: relevanceScore > 60,
        isSelected: false,
        metadata: cert
      });
    });

    // Skills
    skills.forEach((skill, index) => {
      const relevanceScore = calculateRelevanceScore(skill, skill, jobAnalysis);
      items.push({
        id: `skill-${index}`,
        type: 'skill',
        title: skill,
        content: skill,
        relevanceScore,
        isRecommended: relevanceScore > 50,
        isSelected: false
      });
    });

    // Achievements
    projects.forEach(project => {
      const relevanceScore = calculateRelevanceScore(project.title, project.description, jobAnalysis);
      items.push({
        id: project.id,
        type: 'achievement',
        title: project.title,
        subtitle: project.work_experiences?.company_name || 'Personal Project',
        content: project.description,
        relevanceScore,
        isRecommended: relevanceScore > 60,
        isSelected: false,
        metadata: project
      });
    });

    return items.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  };

  const [allContentItems, setAllContentItems] = useState<ContentItem[]>([]);

  useEffect(() => {
    setAllContentItems(convertToContentItems());
  }, [workExperienceBlocks, education, certifications, skills, projects, jobAnalysis]);

  // Calculate relevance score based on job analysis
  const calculateRelevanceScore = (title: string, content: string, analysis?: JobAnalysis): number => {
    if (!analysis) return 0;

    const titleLower = title.toLowerCase();
    const contentLower = content.toLowerCase();
    let score = 0;

    // Helper to check for whole word matches to avoid false positives
    const hasMatch = (text: string, keyword: string) => {
      const regex = new RegExp(`\\b${keyword.toLowerCase()}\\b`, 'i');
      return regex.test(text);
    };

    // Check matched skills
    analysis.matched_skills.forEach(skill => {
      if (hasMatch(titleLower, skill)) {
        score += 30; // Higher weight for title match
      } else if (hasMatch(contentLower, skill)) {
        score += 15;
      }
    });

    // Check key requirements
    analysis.key_requirements.forEach(req => {
      if (hasMatch(titleLower, req)) {
        score += 25; // Higher weight for title match
      } else if (hasMatch(contentLower, req)) {
        score += 10;
      }
    });

    // Bonus for critical areas
    if (analysis.critical_areas) {
      analysis.critical_areas.forEach(area => {
        if (hasMatch(titleLower, area)) {
          score += 20;
        } else if (hasMatch(contentLower, area)) {
          score += 10;
        }
      });
    }

    return Math.min(score, 100);
  };

  // Calculate real-time ATS score
  const calculateATSScore = (items: ContentItem[]): number => {
    if (!jobAnalysis) return 0;

    let score = 0;
    let maxPossibleScore = 0;

    // Score based on matched skills
    jobAnalysis.matched_skills.forEach(skill => {
      maxPossibleScore += 10;
      if (items.some(item => item.content.toLowerCase().includes(skill.toLowerCase()))) {
        score += 10;
      }
    });

    // Score based on key requirements
    jobAnalysis.key_requirements.forEach(req => {
      maxPossibleScore += 15;
      if (items.some(item => item.content.toLowerCase().includes(req.toLowerCase()))) {
        score += 15;
      }
    });

    return maxPossibleScore > 0 ? Math.round((score / maxPossibleScore) * 100) : 0;
  };

  // Handle content selection
  const toggleContentSelection = (itemId: string) => {
    const updatedItems = allContentItems.map(item =>
      item.id === itemId ? { ...item, isSelected: !item.isSelected } : item
    );
    setAllContentItems(updatedItems);

    const selected = updatedItems.filter(item => item.isSelected);
    setSelectedContent(selected);

    const newScore = calculateATSScore(selected);
    setCurrentATSScore(newScore);

    onSelectionChange?.(selected);
    onATSScoreUpdate?.(newScore);
  };

  // Handle bullet selection for work experience
  const toggleBulletSelection = (experienceId: string, bulletIndex: number, bulletContent: string) => {
    const bulletId = `${experienceId}-${bulletIndex}`;
    const existing = selectedBullets.find(b => b.bulletId === bulletId);

    if (existing) {
      setSelectedBullets(prev => prev.filter(b => b.bulletId !== bulletId));
    } else {
      setSelectedBullets(prev => [...prev, {
        experienceId,
        bulletId,
        content: bulletContent
      }]);
    }
  };

  // Filter content based on search and recommendations
  const filteredContent = allContentItems.filter(item => {
    const matchesSearch = !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = !filterRecommended || item.isRecommended;

    return matchesSearch && matchesFilter;
  });

  // Group content by type
  const groupedContent = {
    'work-experience': filteredContent.filter(item => item.type === 'work-experience'),
    'education': filteredContent.filter(item => item.type === 'education'),
    'certification': filteredContent.filter(item => item.type === 'certification'),
    'skill': filteredContent.filter(item => item.type === 'skill'),
    'achievement': filteredContent.filter(item => item.type === 'achievement'),
  };

  const getRelevanceColor = (score?: number) => {
    if (!score) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'work-experience': return <Briefcase className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      case 'certification': return <Award className="w-4 h-4" />;
      case 'skill': return <Code className="w-4 h-4" />;
      case 'achievement': return <Target className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with ATS Score */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Smart Content Selection
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Choose the most relevant content for your target role
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">{currentATSScore}%</div>
              <div className="text-xs text-muted-foreground">ATS Match Score</div>
              <Progress value={currentATSScore} className="w-20 mt-1" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={filterRecommended}
                onCheckedChange={(checked) => setFilterRecommended(checked as boolean)}
                id="filter-recommended"
              />
              <label htmlFor="filter-recommended" className="text-sm cursor-pointer">
                Show only recommended
              </label>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Content Selection Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Briefcase className="w-4 h-4" />
            Experience ({groupedContent['work-experience'].length})
          </TabsTrigger>
          <TabsTrigger value="education" className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4" />
            Education ({groupedContent.education.length})
          </TabsTrigger>
          <TabsTrigger value="certifications" className="flex items-center gap-2">
            <Award className="w-4 h-4" />
            Certs ({groupedContent.certification.length})
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Code className="w-4 h-4" />
            Skills ({groupedContent.skill.length})
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Achievements ({groupedContent.achievement.length})
          </TabsTrigger>
        </TabsList>

        {/* Work Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          {groupedContent['work-experience'].map(item => (
            <Card key={item.id} className={`transition-all ${item.isSelected ? 'ring-2 ring-primary' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Checkbox
                      checked={item.isSelected}
                      onCheckedChange={() => toggleContentSelection(item.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Briefcase className="w-4 h-4" />
                        <h4 className="font-medium">{item.title}</h4>
                        <span className="text-sm text-muted-foreground">at {item.subtitle}</span>
                        {item.isRecommended && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        )}
                      </div>

                      {/* Individual bullets selection */}
                      {item.bullets && (
                        <div className="space-y-2 ml-6">
                          {item.bullets.map((bullet, index) => {
                            const bulletId = `${item.id}-${index}`;
                            const isSelected = selectedBullets.some(b => b.bulletId === bulletId);

                            return (
                              <div key={index} className="flex items-start gap-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleBulletSelection(item.id, index, bullet)}
                                  className="mt-1"
                                />
                                <p className="text-sm text-muted-foreground">{bullet}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Relevance Score */}
                  <div className="text-right">
                    <div className={`w-3 h-3 rounded-full ${getRelevanceColor(item.relevanceScore)}`} />
                    <div className="text-xs text-muted-foreground mt-1">
                      {item.relevanceScore}% match
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Other tabs with similar structure */}
        {['education', 'certifications', 'skills', 'achievements'].map(tabKey => (
          <TabsContent key={tabKey} value={tabKey} className="space-y-4">
            {groupedContent[tabKey as keyof typeof groupedContent].map(item => (
              <Card key={item.id} className={`transition-all ${item.isSelected ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        checked={item.isSelected}
                        onCheckedChange={() => toggleContentSelection(item.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.type)}
                          <h4 className="font-medium">{item.title}</h4>
                          {item.subtitle && (
                            <span className="text-sm text-muted-foreground">• {item.subtitle}</span>
                          )}
                          {item.isRecommended && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Star className="w-3 h-3 mr-1" />
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.content}</p>
                      </div>
                    </div>

                    {/* Relevance Score */}
                    <div className="text-right">
                      <div className={`w-3 h-3 rounded-full ${getRelevanceColor(item.relevanceScore)}`} />
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.relevanceScore}% match
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Selected Content Summary */}
      {selectedContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Selected Content ({selectedContent.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {selectedContent.map(item => (
                <Badge key={item.id} variant="outline" className="flex items-center gap-1">
                  {getTypeIcon(item.type)}
                  {item.title}
                  <button
                    onClick={() => toggleContentSelection(item.id)}
                    className="ml-1 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
