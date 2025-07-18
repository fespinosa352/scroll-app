import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from 'react-beautiful-dnd';
import { 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Award, 
  User, 
  Calendar, 
  MapPin, 
  Building, 
  ArrowRight,
  CheckCircle,
  GripVertical
} from "lucide-react";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { ParsedResume } from "@/lib/resumeParser";
import { format } from "date-fns";

interface DraggableResumeBlock {
  id: string;
  type: 'personal' | 'experience' | 'education' | 'certification' | 'skill';
  title: string;
  content: string;
  metadata?: any;
  section: string; // Which section it belongs to
}

interface ResumeReviewSplitScreenProps {
  parsedData: ParsedResume;
  onComplete: () => void;
}

const ResumeReviewSplitScreen: React.FC<ResumeReviewSplitScreenProps> = ({ 
  parsedData, 
  onComplete 
}) => {
  const { 
    workExperience, 
    education, 
    certifications, 
    skills, 
    personalInfo,
    setWorkExperience,
    setEducation,
    setCertifications,
    setSkills,
    setPersonalInfo
  } = useResumeData();

  // Selection state for multi-select
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  
  // Convert parsed data to draggable blocks
  const [availableBlocks, setAvailableBlocks] = useState<DraggableResumeBlock[]>(() => {
    console.log('=== RESUME REVIEW SPLIT SCREEN DEBUG ===');
    console.log('Parsed data received:', parsedData);
    console.log('Experience count:', parsedData.experience?.length || 0);
    console.log('Skills count:', parsedData.skills?.length || 0);
    console.log('Education count:', parsedData.education?.length || 0);
    console.log('Certifications count:', parsedData.certifications?.length || 0);
    
    const blocks: DraggableResumeBlock[] = [];

    // Experience blocks - Create separate blocks for each achievement
    parsedData.experience?.forEach((exp, expIndex) => {
      console.log(`Adding experience blocks for ${exp.company}:`, exp);
      
      // Create individual blocks for each achievement
      exp.achievements.forEach((achievement, achIndex) => {
        // Clean up the achievement text and split if it was consolidated
        const cleanAchievement = achievement.trim();
        
        // Check if this achievement was consolidated (contains multiple sentences)
        // Handle the ".." pattern and proper sentence splitting
        let sentences = cleanAchievement
          .split(/\.\.\s*/) // Split on ".." first
          .flatMap(part => part.split(/\.\s+(?=[A-Z])/)) // Then split on ". " followed by capital letter
          .map(sentence => sentence.trim())
          .filter(sentence => sentence.length > 15);
        
        if (sentences.length > 1) {
          // This achievement contains multiple consolidated achievements, split them
          sentences.forEach((sentence, sentIndex) => {
            const finalSentence = sentence.trim();
            if (finalSentence.length > 15) {
              blocks.push({
                id: `exp-${expIndex}-${achIndex}-${sentIndex}-${Date.now()}`,
                type: 'experience',
                title: `${exp.title} at ${exp.company}`,
                content: finalSentence + (finalSentence.endsWith('.') ? '' : '.'),
                section: 'experience',
                metadata: { 
                  originalData: exp,
                  company: exp.company,
                  title: exp.title,
                  duration: exp.duration,
                  achievement: finalSentence,
                  isIndividualAchievement: true
                }
              });
            }
          });
        } else {
          // Single achievement, create one block
          blocks.push({
            id: `exp-${expIndex}-${achIndex}-${Date.now()}`,
            type: 'experience',
            title: `${exp.title} at ${exp.company}`,
            content: cleanAchievement,
            section: 'experience',
            metadata: { 
              originalData: exp,
              company: exp.company,
              title: exp.title,
              duration: exp.duration,
              achievement: cleanAchievement,
              isIndividualAchievement: true
            }
          });
        }
      });
    });

    // Education blocks
    parsedData.education?.forEach((edu, index) => {
      blocks.push({
        id: `edu-${index}-${Date.now()}`,
        type: 'education',
        title: `${edu.degree} from ${edu.institution}`,
        content: `${edu.year}${edu.fieldOfStudy ? ' • ' + edu.fieldOfStudy : ''}${edu.gpa ? ' • GPA: ' + edu.gpa : ''}`,
        section: 'education',
        metadata: { originalData: edu }
      });
    });

    // Certification blocks
    parsedData.certifications?.forEach((cert, index) => {
      blocks.push({
        id: `cert-${index}-${Date.now()}`,
        type: 'certification',
        title: cert.name,
        content: `${cert.issuer}${cert.year ? ' • ' + cert.year : ''}`,
        section: 'certifications',
        metadata: { originalData: cert }
      });
    });

    // Skill blocks
    parsedData.skills?.forEach((skill, index) => {
      blocks.push({
        id: `skill-${index}-${Date.now()}`,
        type: 'skill',
        title: skill,
        content: skill,
        section: 'skills',
        metadata: { skill }
      });
    });

    // Affiliations blocks (new)
    parsedData.affiliations?.forEach((affiliation, index) => {
      blocks.push({
        id: `affiliation-${index}-${Date.now()}`,
        type: 'certification', // Treat as certification type for now
        title: affiliation.organization,
        content: `${affiliation.role || 'Member'}${affiliation.year ? ' • ' + affiliation.year : ''}`,
        section: 'certifications',
        metadata: { originalData: affiliation }
      });
    });

    // Sort blocks to match the My Resume section order: Personal, Experience, Education, Certifications, Skills
    const sectionOrder = ['personal', 'experience', 'education', 'certifications', 'skills'];
    const sortedBlocks = blocks.sort((a, b) => {
      const aIndex = sectionOrder.indexOf(a.section);
      const bIndex = sectionOrder.indexOf(b.section);
      return aIndex - bIndex;
    });

    console.log('Final sorted blocks:', sortedBlocks);
    console.log('Total blocks created:', sortedBlocks.length);
    console.log('=== END RESUME REVIEW SPLIT SCREEN DEBUG ===');
    
    return sortedBlocks;
  });

  const [acceptedBlocks, setAcceptedBlocks] = useState<{
    experience: DraggableResumeBlock[];
    education: DraggableResumeBlock[];
    certifications: DraggableResumeBlock[];
    skills: DraggableResumeBlock[];
  }>({
    experience: [],
    education: [],
    certifications: [],
    skills: []
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr + '-01');
      return format(date, 'MMM yyyy');
    } catch {
      return dateStr;
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Only allow drops to the My Resume sections (right side), excluding personal
    if (!destination.droppableId.startsWith('my-resume-') || 
        destination.droppableId === 'my-resume-personal') return;

    const sourceBlockIndex = parseInt(source.index.toString());
    const draggedBlock = availableBlocks[sourceBlockIndex];
    
    if (!draggedBlock) return;

    const targetSection = destination.droppableId.replace('my-resume-', '') as keyof typeof acceptedBlocks;

    // Determine which blocks to move
    let blocksToMove: DraggableResumeBlock[] = [];
    let indicesToRemove: number[] = [];

    if (selectedBlocks.has(draggedBlock.id)) {
      // If dragged block is selected, move all selected blocks
      blocksToMove = availableBlocks.filter(block => selectedBlocks.has(block.id));
      indicesToRemove = availableBlocks
        .map((block, index) => selectedBlocks.has(block.id) ? index : -1)
        .filter(index => index !== -1)
        .sort((a, b) => b - a); // Sort descending to remove from end first
    } else {
      // If dragged block is not selected, move only the dragged block
      blocksToMove = [draggedBlock];
      indicesToRemove = [sourceBlockIndex];
    }

    // Remove blocks from available blocks (in reverse order to maintain indices)
    setAvailableBlocks(prev => {
      const newBlocks = [...prev];
      indicesToRemove.forEach(index => {
        newBlocks.splice(index, 1);
      });
      return newBlocks;
    });

    // Add blocks to accepted blocks
    setAcceptedBlocks(prev => ({
      ...prev,
      [targetSection]: [...prev[targetSection], ...blocksToMove]
    }));

    // Update the actual resume data context for all moved blocks
    blocksToMove.forEach(block => {
      updateResumeData(block, targetSection);
    });

    // Clear selection after successful drag
    setSelectedBlocks(new Set());
    setLastSelectedIndex(null);
  };

  const updateResumeData = (block: DraggableResumeBlock, targetSection: string) => {
    switch (targetSection) {
      
      case 'experience':
        if (block.metadata?.isIndividualAchievement) {
          // Handle individual achievement blocks
          const achievement = block.metadata.achievement;
          const company = block.metadata.company;
          const title = block.metadata.title;
          const duration = block.metadata.duration;
          
          // Check if we already have an entry for this company/title combination
          const existingIndex = workExperience.findIndex(exp => 
            exp.company === company && exp.position === title
          );
          
          if (existingIndex >= 0) {
            // Add to existing entry
            const updatedExperience = [...workExperience];
            const currentDesc = updatedExperience[existingIndex].description;
            updatedExperience[existingIndex].description = currentDesc 
              ? `${currentDesc}\n• ${achievement}`
              : `• ${achievement}`;
            setWorkExperience(sortExperienceByDate(updatedExperience));
          } else {
            // Create new entry
            const newExp = {
              id: `parsed-${Date.now()}`,
              company,
              position: title,
              startDate: convertDateFormat(duration?.split(' - ')[0] || ''),
              endDate: convertDateFormat(duration?.split(' - ')[1] || ''),
              description: `• ${achievement}`,
              isCurrentRole: duration?.includes('Present') || false,
              skills: []
            };
            setWorkExperience(sortExperienceByDate([...workExperience, newExp]));
          }
        } else if (block.metadata?.originalData) {
          // Handle legacy format
          const exp = block.metadata.originalData;
          const newExp = {
            id: `parsed-${Date.now()}`,
            company: exp.company,
            position: exp.title,
            startDate: convertDateFormat(exp.duration?.split(' - ')[0] || ''),
            endDate: convertDateFormat(exp.duration?.split(' - ')[1] || ''),
            description: exp.achievements?.join('. ') || '',
            isCurrentRole: exp.duration?.includes('Present') || false,
            skills: []
          };
          setWorkExperience(sortExperienceByDate([...workExperience, newExp]));
        }
        break;
      
      case 'education':
        if (block.metadata?.originalData) {
          const edu = block.metadata.originalData;
          const newEdu = {
            id: `parsed-edu-${Date.now()}`,
            institution: edu.institution,
            degree: edu.degree,
            fieldOfStudy: edu.fieldOfStudy || '',
            startDate: convertDateFormat(edu.year || ''),
            endDate: convertDateFormat(edu.year || ''),
            gpa: edu.gpa || '',
            isCurrentlyEnrolled: false
          };
          setEducation([...education, newEdu]);
        }
        break;
      
      case 'certifications':
        if (block.metadata?.originalData) {
          const cert = block.metadata.originalData;
          const newCert = {
            id: `parsed-cert-${Date.now()}`,
            name: cert.name,
            issuer: cert.issuer,
            issueDate: convertDateFormat(cert.issueDate || cert.year || ''),
            expiryDate: cert.expiryDate ? convertDateFormat(cert.expiryDate) : undefined,
            credentialId: cert.credentialId || '',
            credentialUrl: cert.credentialUrl || '',
            doesNotExpire: !cert.expiryDate
          };
          setCertifications([...certifications, newCert]);
        }
        break;
      
      case 'skills':
        if (block.metadata?.skill) {
          setSkills([...skills, block.metadata.skill]);
        }
        break;
    }
  };

  const convertDateFormat = (dateStr: string) => {
    if (!dateStr || dateStr === 'Present' || dateStr === 'Current') return '';
    
    const monthYearMatch = dateStr.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(19|20)\d{2}\b/i);
    if (monthYearMatch) {
      const monthMap: { [key: string]: string } = {
        'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
        'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
        'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
      };
      const month = monthMap[monthYearMatch[1].toLowerCase().substring(0, 3)] || '01';
      const year = monthYearMatch[2];
      return `${year}-${month}`;
    }
    
    const yearMatch = dateStr.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      return `${yearMatch[0]}-01`;
    }
    
    return dateStr;
  };

  const sortExperienceByDate = (experiences: typeof workExperience) => {
    return experiences.sort((a, b) => {
      // Current roles first
      if (a.isCurrentRole && !b.isCurrentRole) return -1;
      if (!a.isCurrentRole && b.isCurrentRole) return 1;
      
      // Then sort by start date (most recent first)
      const aStartDate = new Date(a.startDate || '2000-01-01');
      const bStartDate = new Date(b.startDate || '2000-01-01');
      
      return bStartDate.getTime() - aStartDate.getTime();
    });
  };

  const handleBlockSelection = (blockId: string, index: number, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + Click: Toggle selection
      setSelectedBlocks(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(blockId)) {
          newSelection.delete(blockId);
        } else {
          newSelection.add(blockId);
        }
        return newSelection;
      });
      setLastSelectedIndex(index);
    } else if (event.shiftKey && lastSelectedIndex !== null) {
      // Shift + Click: Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = availableBlocks.slice(start, end + 1).map(block => block.id);
      setSelectedBlocks(prev => new Set([...prev, ...rangeIds]));
    } else {
      // Regular click: Single selection
      setSelectedBlocks(new Set([blockId]));
      setLastSelectedIndex(index);
    }
  };

  const selectAllBlocks = () => {
    setSelectedBlocks(new Set(availableBlocks.map(block => block.id)));
  };

  const clearSelection = () => {
    setSelectedBlocks(new Set());
    setLastSelectedIndex(null);
  };

  const moveAllToMyResume = () => {
    // Move all available blocks to their respective sections
    const newAcceptedBlocks = { ...acceptedBlocks };
    
    availableBlocks.forEach(block => {
      const targetSection = block.section as keyof typeof acceptedBlocks;
      if (newAcceptedBlocks[targetSection]) {
        newAcceptedBlocks[targetSection].push(block);
      }
      
      // Update the resume data context
      updateResumeData(block, block.section);
    });
    
    // Update state
    setAcceptedBlocks(newAcceptedBlocks);
    setAvailableBlocks([]);
    setSelectedBlocks(new Set());
    setLastSelectedIndex(null);
  };

  const getBlockIcon = (type: string) => {
    switch (type) {
      case 'personal': return <User className="w-4 h-4" />;
      case 'experience': return <Briefcase className="w-4 h-4" />;
      case 'education': return <GraduationCap className="w-4 h-4" />;
      case 'certification': return <Award className="w-4 h-4" />;
      case 'skill': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'personal': return <User className="w-5 h-5" />;
      case 'experience': return <Briefcase className="w-5 h-5" />;
      case 'education': return <GraduationCap className="w-5 h-5" />;
      case 'certifications': return <Award className="w-5 h-5" />;
      case 'skills': return <FileText className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const totalBlocks = availableBlocks.length + Object.values(acceptedBlocks).flat().length;
  const acceptedCount = Object.values(acceptedBlocks).flat().length;
  const progress = totalBlocks > 0 ? (acceptedCount / totalBlocks) * 100 : 0;

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-slate-900">Review & Organize Your Resume Data</h2>
          <p className="text-lg text-slate-600">
            Drag information from your parsed resume (left) to the appropriate sections (right)
          </p>
          
          {/* Progress */}
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
              <span>Progress</span>
              <span>{acceptedCount} of {totalBlocks} items organized</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          {/* Left Side - Parsed Resume Data */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Parsed Resume Data
              </CardTitle>
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  Drag these items to organize them in your profile
                </p>
                {availableBlocks.length > 0 && (
                  <div className="flex items-center gap-2">
                    {selectedBlocks.size > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedBlocks.size} selected
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={moveAllToMyResume}
                      className="text-xs"
                    >
                      Move All to My Resume
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectedBlocks.size === availableBlocks.length ? clearSelection : selectAllBlocks}
                      className="text-xs"
                    >
                      {selectedBlocks.size === availableBlocks.length ? 'Clear' : 'Select All'}
                    </Button>
                  </div>
                )}
              </div>
              {selectedBlocks.size > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  💡 Ctrl+Click to toggle • Shift+Click for range • Drag to move selected items
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <Droppable droppableId="parsed-data" isDropDisabled={true}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 flex-1 overflow-y-auto min-h-0 relative z-0"
                  >
                    {availableBlocks.map((block, index) => (
                      <Draggable key={block.id} draggableId={block.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={(e) => handleBlockSelection(block.id, index, e)}
                            className={`
                              p-3 border rounded-lg cursor-grab active:cursor-grabbing
                              transition-all duration-200
                              ${snapshot.isDragging ? 'shadow-lg bg-blue-50 scale-105' : ''}
                              ${selectedBlocks.has(block.id) 
                                ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' 
                                : 'bg-white hover:bg-slate-50'}
                            `}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 mt-0.5">
                                {getBlockIcon(block.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    {block.section}
                                  </Badge>
                                  <GripVertical className="w-3 h-3 text-slate-400" />
                                  {selectedBlocks.has(block.id) && (
                                    <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                  )}
                                </div>
                                <h4 className="font-medium text-slate-900 mb-1">{block.title}</h4>
                                <p className="text-sm text-slate-600 truncate">{block.content}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    
                    {availableBlocks.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
                        <p className="text-slate-500">All items have been organized!</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>

          {/* Right Side - My Resume Sections */}
          <Card className="flex flex-col h-full">
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                My Resume
              </CardTitle>
              <p className="text-sm text-slate-600">
                Drop items here to build your organized resume
              </p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4 overflow-y-auto">

              {/* Work Experience */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  {getSectionIcon('experience')}
                  Work Experience
                </h4>
                <Droppable droppableId="my-resume-experience">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        min-h-[80px] p-3 border-2 border-dashed rounded-lg
                        ${snapshot.isDraggingOver 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-slate-200 bg-slate-50'
                        }
                      `}
                    >
                      {acceptedBlocks.experience.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">Drop work experiences here</p>
                      ) : (
                        <div className="space-y-2">
                          {acceptedBlocks.experience.map((block, index) => (
                            <div key={block.id} className="p-3 bg-white rounded border">
                              <h5 className="font-medium text-slate-900">{block.title}</h5>
                              <p className="text-sm text-slate-600">{block.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <Separator />

              {/* Education */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  {getSectionIcon('education')}
                  Education
                </h4>
                <Droppable droppableId="my-resume-education">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        min-h-[80px] p-3 border-2 border-dashed rounded-lg
                        ${snapshot.isDraggingOver 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-slate-200 bg-slate-50'
                        }
                      `}
                    >
                      {acceptedBlocks.education.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">Drop education here</p>
                      ) : (
                        <div className="space-y-2">
                          {acceptedBlocks.education.map((block, index) => (
                            <div key={block.id} className="p-3 bg-white rounded border">
                              <h5 className="font-medium text-slate-900">{block.title}</h5>
                              <p className="text-sm text-slate-600">{block.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <Separator />

              {/* Certifications */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  {getSectionIcon('certifications')}
                  Certifications
                </h4>
                <Droppable droppableId="my-resume-certifications">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        min-h-[80px] p-3 border-2 border-dashed rounded-lg
                        ${snapshot.isDraggingOver 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-slate-200 bg-slate-50'
                        }
                      `}
                    >
                      {acceptedBlocks.certifications.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">Drop certifications here</p>
                      ) : (
                        <div className="space-y-2">
                          {acceptedBlocks.certifications.map((block, index) => (
                            <div key={block.id} className="p-3 bg-white rounded border">
                              <h5 className="font-medium text-slate-900">{block.title}</h5>
                              <p className="text-sm text-slate-600">{block.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>

              <Separator />

              {/* Skills */}
              <div>
                <h4 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                  {getSectionIcon('skills')}
                  Skills
                </h4>
                <Droppable droppableId="my-resume-skills">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`
                        min-h-[80px] p-3 border-2 border-dashed rounded-lg
                        ${snapshot.isDraggingOver 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-slate-200 bg-slate-50'
                        }
                      `}
                    >
                      {acceptedBlocks.skills.length === 0 ? (
                        <p className="text-center text-slate-400 py-4">Drop skills here</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {acceptedBlocks.skills.map((block, index) => (
                            <Badge key={block.id} variant="secondary">
                              {block.title}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 pt-6 relative z-10 bg-white">
          <Button 
            variant="outline"
            onClick={() => {
              // Reset and go back to parsing step
              window.location.reload();
            }}
          >
            Upload Different Resume
          </Button>
          <Button 
            onClick={onComplete}
            size="lg"
            className="px-8"
            disabled={acceptedCount === 0}
          >
            Complete Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </DragDropContext>
  );
};

export default ResumeReviewSplitScreen;