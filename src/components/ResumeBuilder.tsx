import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Settings2,
  GripVertical,
  Target,
  List,
  Type,
  BarChart,
  Tag,
  ChevronDown,
  ChevronRight,
  Building,
  GraduationCap,
  Award,
  User
} from "lucide-react";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";
import { DraggableBlock, ResumeSection, Block } from "@/types/blocks";
import { Block as BlockComponent } from "@/components/blocks/Block";

const ResumeBuilder = () => {
  const { 
    workExperienceBlocks, 
    personalInfo, 
    currentEditingResume, 
    resumeSections, 
    setResumeSections,
    saveCurrentResume,
    education,
    certifications,
    skills
  } = useResumeData();
  const [resumeName, setResumeName] = useState(currentEditingResume?.name || "My Resume");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBlocks, setSelectedBlocks] = useState<Set<string>>(new Set());
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  // Update resume name when editing resume changes
  useEffect(() => {
    if (currentEditingResume) {
      setResumeName(currentEditingResume.name);
    }
  }, [currentEditingResume]);

  // Use context resume sections if available, otherwise fall back to default
  const activeResumeSections = resumeSections.length > 0 ? resumeSections : [
    {
      id: 'section-experience',
      title: 'Work Experience',
      type: 'experience',
      blocks: [],
      order: 0,
      visible: true,
    },
    {
      id: 'section-skills',
      title: 'Key Skills',
      type: 'skills',
      blocks: [],
      order: 1,
      visible: true,
    }
  ];

  // Helper functions for creating draggable blocks from different data sources
  const createEducationBlocks = (): DraggableBlock[] => {
    return education.map((edu, index) => ({
      id: `education-${edu.id}`,
      type: 'text' as const,
      content: `${edu.degree} in ${edu.fieldOfStudy || 'General Studies'} from ${edu.institution}${edu.gpa ? ` (GPA: ${edu.gpa})` : ''}`,
      metadata: {},
      order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sourceExperienceId: 'education',
      sourceSectionId: 'education-items',
      isDraggable: true,
      tags: ['education', edu.institution.toLowerCase(), edu.degree.toLowerCase()]
    }));
  };

  const createCertificationBlocks = (): DraggableBlock[] => {
    return certifications.map((cert, index) => ({
      id: `certification-${cert.id}`,
      type: 'achievement' as const,
      content: `${cert.name} - ${cert.issuer}${cert.issueDate ? ` (${cert.issueDate})` : ''}`,
      metadata: {},
      order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sourceExperienceId: 'certifications',
      sourceSectionId: 'certification-items',
      isDraggable: true,
      tags: ['certification', cert.issuer.toLowerCase(), cert.name.toLowerCase()]
    }));
  };

  const createSkillBlocks = (): DraggableBlock[] => {
    return skills.map((skill, index) => ({
      id: `skill-${skill}-${index}`,
      type: 'skill_tag' as const,
      content: skill,
      metadata: {},
      order: index,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sourceExperienceId: 'skills',
      sourceSectionId: 'skill-items',
      isDraggable: true,
      tags: ['skill', skill.toLowerCase()]
    }));
  };

  // Convert work experience blocks to draggable blocks
  const workExperienceBlocks_draggable: DraggableBlock[] = workExperienceBlocks.flatMap(experience =>
    experience.sections.flatMap(section =>
      section.blocks.map(block => ({
        ...block,
        sourceExperienceId: experience.id,
        sourceSectionId: section.id,
        isDraggable: true,
        tags: [
          experience.company.toLowerCase(),
          experience.position.toLowerCase(),
          section.title.toLowerCase(),
          block.type
        ]
      }))
    )
  );

  // Combine all available blocks
  const availableBlocks: DraggableBlock[] = [
    ...workExperienceBlocks_draggable,
    ...createEducationBlocks(),
    ...createCertificationBlocks(),
    ...createSkillBlocks()
  ];

  // Group blocks by company/source
  const groupedBlocks = () => {
    const groups: { [key: string]: { name: string; icon: any; items: any[] } } = {};
    
    // Work Experience groups (by company)
    workExperienceBlocks.forEach(experience => {
      if (!groups[experience.company]) {
        groups[experience.company] = {
          name: experience.company,
          icon: Building,
          items: []
        };
      }
      groups[experience.company].items.push({
        type: 'experience',
        experience,
        sections: experience.sections
      });
    });

    // Education group
    if (education.length > 0) {
      groups['education'] = {
        name: 'Education',
        icon: GraduationCap,
        items: education.map(edu => ({ type: 'education', data: edu }))
      };
    }

    // Certifications group
    if (certifications.length > 0) {
      groups['certifications'] = {
        name: 'Certifications',
        icon: Award,
        items: certifications.map(cert => ({ type: 'certification', data: cert }))
      };
    }

    // Skills group
    if (skills.length > 0) {
      groups['skills'] = {
        name: 'Skills',
        icon: Tag,
        items: skills.map(skill => ({ type: 'skill', data: skill }))
      };
    }

    return groups;
  };

  // Selection handlers
  const handleBlockSelection = (blockId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedBlocks);
    if (isSelected) {
      newSelection.add(blockId);
    } else {
      newSelection.delete(blockId);
    }
    setSelectedBlocks(newSelection);
  };

  const handleSelectAll = (blocks: DraggableBlock[], select: boolean) => {
    const newSelection = new Set(selectedBlocks);
    blocks.forEach(block => {
      if (select) {
        newSelection.add(block.id);
      } else {
        newSelection.delete(block.id);
      }
    });
    setSelectedBlocks(newSelection);
  };

  const addSelectedBlocksToSection = (targetSectionId: string) => {
    const selectedBlocksArray = availableBlocks.filter(block => selectedBlocks.has(block.id));
    if (selectedBlocksArray.length === 0) return;

    const updatedSections = activeResumeSections.map(section => {
      if (section.id === targetSectionId) {
        const resumeBlocks = selectedBlocksArray.map(block => ({
          ...block,
          id: `resume-${block.id}-${Date.now()}`
        }));
        return {
          ...section,
          blocks: [...section.blocks, ...resumeBlocks]
        };
      }
      return section;
    });

    setResumeSections(updatedSections);
    setSelectedBlocks(new Set()); // Clear selection
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    // Handle dragging from any block library source to resume
    const isFromBlockLibrary = source.droppableId === 'available-blocks' || 
                              source.droppableId.startsWith('section-') ||
                              source.droppableId === 'education-blocks' ||
                              source.droppableId === 'certification-blocks' ||
                              source.droppableId === 'skill-blocks';

    if (isFromBlockLibrary && destination.droppableId.startsWith('resume-section-')) {
      // Dragging from available blocks to resume
      const blockIndex = parseInt(source.index.toString());
      const block = availableBlocks[blockIndex];
      
      if (!block) return;

      const targetSectionId = destination.droppableId.replace('resume-section-', '');
      const targetSection = activeResumeSections.find(s => s.id === targetSectionId);
      
      if (!targetSection) return;

      // Create a copy of the block for the resume
      const resumeBlock: DraggableBlock = {
        ...block,
        id: `resume-${block.id}-${Date.now()}`, // New ID for the resume copy
      };

      const updatedSections = activeResumeSections.map(section => {
        if (section.id === targetSectionId) {
          const newBlocks = [...section.blocks];
          newBlocks.splice(destination.index, 0, resumeBlock);
          return { ...section, blocks: newBlocks };
        }
        return section;
      });

      setResumeSections(updatedSections);
    } else if (source.droppableId.startsWith('resume-section-')) {
      // Reordering within resume sections
      const sourceSectionId = source.droppableId.replace('resume-section-', '');
      const destSectionId = destination.droppableId.replace('resume-section-', '');

      if (sourceSectionId === destSectionId) {
        // Same section reorder
        const section = activeResumeSections.find(s => s.id === sourceSectionId);
        if (!section) return;

        const newBlocks = [...section.blocks];
        const [removed] = newBlocks.splice(source.index, 1);
        newBlocks.splice(destination.index, 0, removed);

        const updatedSections = activeResumeSections.map(s =>
          s.id === sourceSectionId ? { ...s, blocks: newBlocks } : s
        );

        setResumeSections(updatedSections);
      } else {
        // Move between sections
        const sourceSection = activeResumeSections.find(s => s.id === sourceSectionId);
        const destSection = activeResumeSections.find(s => s.id === destSectionId);

        if (!sourceSection || !destSection) return;

        const sourceBlocks = [...sourceSection.blocks];
        const destBlocks = [...destSection.blocks];
        const [removed] = sourceBlocks.splice(source.index, 1);
        destBlocks.splice(destination.index, 0, removed);

        const updatedSections = activeResumeSections.map(section => {
          if (section.id === sourceSectionId) {
            return { ...section, blocks: sourceBlocks };
          }
          if (section.id === destSectionId) {
            return { ...section, blocks: destBlocks };
          }
          return section;
        });

        setResumeSections(updatedSections);
      }
    }
  };

  const removeBlockFromResume = (sectionId: string, blockId: string) => {
    const updatedSections = activeResumeSections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          blocks: section.blocks.filter(block => block.id !== blockId)
        };
      }
      return section;
    });
    setResumeSections(updatedSections);
  };

  const handleSaveResume = async () => {
    setIsSaving(true);
    try {
      const success = await saveCurrentResume();
      if (success) {
        // Could show success message or navigate back to resume list
      }
    } catch (error) {
      console.error('Error saving resume:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const blockTypeIcons = {
    text: Type,
    bullet: List,
    achievement: Target,
    heading: Type,
    metric: BarChart,
    skill_tag: Tag,
  };

  const getBlockIcon = (type: string) => {
    const Icon = blockTypeIcons[type as keyof typeof blockTypeIcons] || Type;
    return <Icon className="w-3 h-3" />;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Enhanced Block Library */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <List className="w-4 h-4" />
                My Resume Elements
              </CardTitle>
              <CardDescription className="text-xs">
                Select and drag elements from your profile data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {/* Selection Actions */}
                {selectedBlocks.size > 0 && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="text-xs font-medium text-blue-800 mb-2">
                      {selectedBlocks.size} items selected
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {activeResumeSections.map(section => (
                        <Button
                          key={section.id}
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() => addSelectedBlocksToSection(section.id)}
                        >
                          Add to {section.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grouped Content */}
                {Object.entries(groupedBlocks()).map(([groupKey, group]) => (
                  <Collapsible
                    key={groupKey}
                    open={expandedCompanies.has(groupKey)}
                    onOpenChange={(isOpen) => {
                      const newExpanded = new Set(expandedCompanies);
                      if (isOpen) {
                        newExpanded.add(groupKey);
                      } else {
                        newExpanded.delete(groupKey);
                      }
                      setExpandedCompanies(newExpanded);
                    }}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-between p-2 h-auto"
                      >
                        <div className="flex items-center gap-2">
                          <group.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{group.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {group.items.length}
                          </Badge>
                        </div>
                        {expandedCompanies.has(groupKey) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-2 pl-2">
                      {/* Work Experience Items */}
                      {group.items.map((item, itemIndex) => {
                        if (item.type === 'experience') {
                          return (
                            <div key={`exp-${item.experience.id}`} className="space-y-1">
                              <div className="text-xs font-medium text-gray-600 px-2">
                                {item.experience.position}
                              </div>
                              {item.sections.map((section: any) => {
                                const sectionBlocks = availableBlocks.filter(
                                  block => block.sourceExperienceId === item.experience.id && 
                                          block.sourceSectionId === section.id
                                );
                                
                                return (
                                  <Collapsible
                                    key={section.id}
                                    open={expandedSections.has(section.id)}
                                    onOpenChange={(isOpen) => {
                                      const newExpanded = new Set(expandedSections);
                                      if (isOpen) {
                                        newExpanded.add(section.id);
                                      } else {
                                        newExpanded.delete(section.id);
                                      }
                                      setExpandedSections(newExpanded);
                                    }}
                                  >
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" className="w-full justify-between p-1 h-auto text-xs">
                                        <span>{section.title}</span>
                                        <div className="flex items-center gap-1">
                                          <Badge variant="outline" className="text-xs h-4">
                                            {sectionBlocks.length}
                                          </Badge>
                                          {expandedSections.has(section.id) ? (
                                            <ChevronDown className="w-3 h-3" />
                                          ) : (
                                            <ChevronRight className="w-3 h-3" />
                                          )}
                                        </div>
                                      </Button>
                                    </CollapsibleTrigger>
                                    
                                    <CollapsibleContent className="space-y-1 pl-2">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Checkbox
                                          checked={sectionBlocks.every(block => selectedBlocks.has(block.id))}
                                          onCheckedChange={(checked) => 
                                            handleSelectAll(sectionBlocks, checked as boolean)
                                          }
                                        />
                                        <span className="text-xs text-gray-500">Select All</span>
                                      </div>
                                      
                                      <Droppable droppableId={`section-${section.id}`} isDropDisabled={true}>
                                        {(provided) => (
                                          <div ref={provided.innerRef} {...provided.droppableProps}>
                                            {sectionBlocks.map((block, blockIndex) => (
                                              <Draggable 
                                                key={block.id} 
                                                draggableId={block.id} 
                                                index={availableBlocks.indexOf(block)}
                                              >
                                                {(provided, snapshot) => (
                                                  <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className={`
                                                      p-2 border rounded text-xs cursor-grab active:cursor-grabbing mb-1 bg-white
                                                      ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'hover:bg-gray-50'}
                                                      ${selectedBlocks.has(block.id) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                                                    `}
                                                  >
                                                    <div className="flex items-start gap-2">
                                                      <Checkbox
                                                        checked={selectedBlocks.has(block.id)}
                                                        onCheckedChange={(checked) => 
                                                          handleBlockSelection(block.id, checked as boolean)
                                                        }
                                                        onClick={(e) => e.stopPropagation()}
                                                      />
                                                      <div {...provided.dragHandleProps} className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1 mb-1">
                                                          {getBlockIcon(block.type)}
                                                          <Badge variant="outline" className="text-xs h-4">
                                                            {block.type}
                                                          </Badge>
                                                        </div>
                                                        <div className="text-xs leading-relaxed">
                                                          {block.content}
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                )}
                                              </Draggable>
                                            ))}
                                            {provided.placeholder}
                                          </div>
                                        )}
                                      </Droppable>
                                    </CollapsibleContent>
                                  </Collapsible>
                                );
                              })}
                            </div>
                          );
                        }
                        
                        // Education items
                        if (item.type === 'education') {
                          const educationBlocks = availableBlocks.filter(
                            block => block.sourceExperienceId === 'education'
                          );
                          
                          return (
                            <div key="education-items" className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Checkbox
                                  checked={educationBlocks.every(block => selectedBlocks.has(block.id))}
                                  onCheckedChange={(checked) => 
                                    handleSelectAll(educationBlocks, checked as boolean)
                                  }
                                />
                                <span className="text-xs text-gray-500">Select All</span>
                              </div>
                              
                              <Droppable droppableId="education-blocks" isDropDisabled={true}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {educationBlocks.map((block) => (
                                      <Draggable 
                                        key={block.id} 
                                        draggableId={block.id} 
                                        index={availableBlocks.indexOf(block)}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`
                                              p-2 border rounded text-xs cursor-grab active:cursor-grabbing mb-1 bg-white
                                              ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'hover:bg-gray-50'}
                                              ${selectedBlocks.has(block.id) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                                            `}
                                          >
                                            <div className="flex items-start gap-2">
                                              <Checkbox
                                                checked={selectedBlocks.has(block.id)}
                                                onCheckedChange={(checked) => 
                                                  handleBlockSelection(block.id, checked as boolean)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <div {...provided.dragHandleProps} className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 mb-1">
                                                  {getBlockIcon(block.type)}
                                                  <Badge variant="outline" className="text-xs h-4">
                                                    {block.type}
                                                  </Badge>
                                                </div>
                                                <div className="text-xs leading-relaxed">
                                                  {block.content}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        }
                        
                        // Certification items
                        if (item.type === 'certification') {
                          const certificationBlocks = availableBlocks.filter(
                            block => block.sourceExperienceId === 'certifications'
                          );
                          
                          return (
                            <div key="certification-items" className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Checkbox
                                  checked={certificationBlocks.every(block => selectedBlocks.has(block.id))}
                                  onCheckedChange={(checked) => 
                                    handleSelectAll(certificationBlocks, checked as boolean)
                                  }
                                />
                                <span className="text-xs text-gray-500">Select All</span>
                              </div>
                              
                              <Droppable droppableId="certification-blocks" isDropDisabled={true}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {certificationBlocks.map((block) => (
                                      <Draggable 
                                        key={block.id} 
                                        draggableId={block.id} 
                                        index={availableBlocks.indexOf(block)}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`
                                              p-2 border rounded text-xs cursor-grab active:cursor-grabbing mb-1 bg-white
                                              ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'hover:bg-gray-50'}
                                              ${selectedBlocks.has(block.id) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                                            `}
                                          >
                                            <div className="flex items-start gap-2">
                                              <Checkbox
                                                checked={selectedBlocks.has(block.id)}
                                                onCheckedChange={(checked) => 
                                                  handleBlockSelection(block.id, checked as boolean)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <div {...provided.dragHandleProps} className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 mb-1">
                                                  {getBlockIcon(block.type)}
                                                  <Badge variant="outline" className="text-xs h-4">
                                                    {block.type}
                                                  </Badge>
                                                </div>
                                                <div className="text-xs leading-relaxed">
                                                  {block.content}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        }
                        
                        // Skills items
                        if (item.type === 'skill') {
                          const skillBlocks = availableBlocks.filter(
                            block => block.sourceExperienceId === 'skills'
                          );
                          
                          return (
                            <div key="skill-items" className="space-y-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Checkbox
                                  checked={skillBlocks.every(block => selectedBlocks.has(block.id))}
                                  onCheckedChange={(checked) => 
                                    handleSelectAll(skillBlocks, checked as boolean)
                                  }
                                />
                                <span className="text-xs text-gray-500">Select All</span>
                              </div>
                              
                              <Droppable droppableId="skill-blocks" isDropDisabled={true}>
                                {(provided) => (
                                  <div ref={provided.innerRef} {...provided.droppableProps}>
                                    {skillBlocks.map((block) => (
                                      <Draggable 
                                        key={block.id} 
                                        draggableId={block.id} 
                                        index={availableBlocks.indexOf(block)}
                                      >
                                        {(provided, snapshot) => (
                                          <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`
                                              p-2 border rounded text-xs cursor-grab active:cursor-grabbing mb-1 bg-white
                                              ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'hover:bg-gray-50'}
                                              ${selectedBlocks.has(block.id) ? 'ring-2 ring-blue-300 bg-blue-50' : ''}
                                            `}
                                          >
                                            <div className="flex items-start gap-2">
                                              <Checkbox
                                                checked={selectedBlocks.has(block.id)}
                                                onCheckedChange={(checked) => 
                                                  handleBlockSelection(block.id, checked as boolean)
                                                }
                                                onClick={(e) => e.stopPropagation()}
                                              />
                                              <div {...provided.dragHandleProps} className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1 mb-1">
                                                  {getBlockIcon(block.type)}
                                                  <Badge variant="outline" className="text-xs h-4">
                                                    {block.type}
                                                  </Badge>
                                                </div>
                                                <div className="text-xs leading-relaxed">
                                                  {block.content}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Resume Builder */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Resume Builder
                  </CardTitle>
                  <CardDescription>
                    Drag and drop blocks to build your customized resume
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleSaveResume}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Resume Header */}
                <div className="border-b pb-4">
                  <Input
                    value={resumeName}
                    onChange={(e) => setResumeName(e.target.value)}
                    className="text-xl font-bold border-none p-0 h-auto focus:ring-0"
                    placeholder="Resume Title"
                  />
                  {personalInfo && (
                    <div className="mt-2 text-sm text-gray-600">
                      <div className="font-medium">{personalInfo.name}</div>
                      <div>{personalInfo.email} • {personalInfo.phone}</div>
                      <div>{personalInfo.location}</div>
                    </div>
                  )}
                </div>

                {/* Resume Sections */}
                <div className="space-y-6">
                  {activeResumeSections.map((section) => (
                    <div key={section.id} className="space-y-3">
                      <h3 className="text-lg font-semibold border-b pb-1">
                        {section.title}
                      </h3>
                      
                      <Droppable droppableId={`resume-section-${section.id}`}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`
                              min-h-[100px] p-4 border-2 border-dashed rounded-lg
                              ${snapshot.isDraggingOver 
                                ? 'border-blue-300 bg-blue-50' 
                                : 'border-gray-200 bg-gray-50'
                              }
                            `}
                          >
                            {section.blocks.length === 0 ? (
                              <div className="text-center text-gray-400 py-8">
                                <Plus className="w-8 h-8 mx-auto mb-2" />
                                <p className="text-sm">Drop blocks here to build this section</p>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {section.blocks.map((block, index) => (
                                  <Draggable key={block.id} draggableId={block.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`
                                          bg-white p-3 rounded border
                                          ${snapshot.isDragging ? 'shadow-lg' : ''}
                                        `}
                                      >
                                        <div className="flex items-start space-x-2">
                                          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1">
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                          </div>
                                          <div className="flex-1">
                                            <div className="flex items-center space-x-2 mb-1">
                                              {getBlockIcon(block.type)}
                                              <Badge variant="secondary" className="text-xs">
                                                {block.type}
                                              </Badge>
                                            </div>
                                            <div className="text-sm">
                                              {block.content}
                                            </div>
                                          </div>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeBlockFromResume(section.id, block.id)}
                                            className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </div>
                            )}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DragDropContext>
  );
};

export default ResumeBuilder;