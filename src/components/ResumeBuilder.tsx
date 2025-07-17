import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Tag
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
    saveCurrentResume 
  } = useResumeData();
  const [resumeName, setResumeName] = useState(currentEditingResume?.name || "My Resume");
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
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

  // Convert work experience blocks to draggable blocks
  const availableBlocks: DraggableBlock[] = workExperienceBlocks.flatMap(experience =>
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

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (source.droppableId === 'available-blocks') {
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

  const handlePreview = () => {
    setIsPreviewMode(!isPreviewMode);
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
      <div className={`grid gap-6 h-full ${isPreviewMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Block Library - Hidden in preview mode */}
        {!isPreviewMode && (
          <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Block Library</CardTitle>
              <CardDescription className="text-xs">
                Drag blocks from your experiences to build your resume
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <Droppable droppableId="available-blocks" isDropDisabled={true}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 max-h-96 overflow-y-auto"
                  >
                    {availableBlocks.map((block, index) => {
                      const experience = workExperienceBlocks.find(exp => exp.id === block.sourceExperienceId);
                      const section = experience?.sections.find(sec => sec.id === block.sourceSectionId);
                      
                      return (
                        <Draggable key={`${block.sourceExperienceId}-${block.id}`} draggableId={`${block.sourceExperienceId}-${block.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`
                                p-2 bg-white border rounded text-xs cursor-grab active:cursor-grabbing
                                ${snapshot.isDragging ? 'shadow-lg bg-blue-50' : 'hover:bg-gray-50'}
                              `}
                            >
                              <div className="flex items-start space-x-2">
                                <div className="flex-shrink-0 mt-0.5">
                                  {getBlockIcon(block.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-gray-500 mb-1">
                                    {experience?.company} • {section?.title}
                                  </div>
                                  <div className="truncate">
                                    {block.content || 'Empty block'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Resume Builder */}
        <div className={`space-y-4 ${isPreviewMode ? '' : 'lg:col-span-2'}`}>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePreview}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    {isPreviewMode ? 'Edit Mode' : 'Preview'}
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
                              ${isPreviewMode 
                                ? 'min-h-0 p-0' 
                                : 'min-h-[100px] p-4 border-2 border-dashed rounded-lg'
                              }
                              ${!isPreviewMode && snapshot.isDraggingOver 
                                ? 'border-blue-300 bg-blue-50' 
                                : !isPreviewMode ? 'border-gray-200 bg-gray-50' : ''
                              }
                            `}
                          >
                            {section.blocks.length === 0 ? (
                              !isPreviewMode && (
                                <div className="text-center text-gray-400 py-8">
                                  <Plus className="w-8 h-8 mx-auto mb-2" />
                                  <p className="text-sm">Drop blocks here to build this section</p>
                                </div>
                              )
                            ) : (
                              <div className="space-y-2">
                                {section.blocks.map((block, index) => (
                                  <Draggable key={block.id} draggableId={block.id} index={index}>
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`
                                          ${isPreviewMode 
                                            ? 'p-2 mb-1' 
                                            : 'bg-white p-3 rounded border'
                                          }
                                          ${!isPreviewMode && snapshot.isDragging ? 'shadow-lg' : ''}
                                        `}
                                      >
                                        <div className="flex items-start space-x-2">
                                          {!isPreviewMode && (
                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing mt-1">
                                              <GripVertical className="w-4 h-4 text-gray-400" />
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            {(() => {
                                              const sourceExperience = workExperienceBlocks.find(exp => exp.id === block.sourceExperienceId);
                                              const sourceSection = sourceExperience?.sections.find(sec => sec.id === block.sourceSectionId);
                                              return (
                                                <div>
                                                  {!isPreviewMode && (
                                                    <div className="flex items-center space-x-2 mb-1">
                                                      {getBlockIcon(block.type)}
                                                      <Badge variant="secondary" className="text-xs">
                                                        {block.type}
                                                      </Badge>
                                                      {sourceExperience && (
                                                        <div className="text-xs text-gray-500">
                                                          {sourceExperience.company} • {sourceExperience.position}
                                                        </div>
                                                      )}
                                                    </div>
                                                  )}
                                                  <div className={`${isPreviewMode ? 'text-base leading-relaxed' : 'text-sm'}`}>
                                                    {isPreviewMode && sourceExperience && section.type === 'experience' && index === 0 && (
                                                      <div className="mb-2">
                                                        <h4 className="font-semibold text-lg">{sourceExperience.position}</h4>
                                                        <p className="text-gray-600">{sourceExperience.company} • {sourceExperience.startDate} - {sourceExperience.isCurrentRole ? 'Present' : sourceExperience.endDate}</p>
                                                      </div>
                                                    )}
                                                    • {block.content}
                                                  </div>
                                                </div>
                                              );
                                            })()}
                                          </div>
                                          {!isPreviewMode && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => removeBlockFromResume(section.id, block.id)}
                                              className="text-red-500 hover:text-red-700 h-6 w-6 p-0"
                                            >
                                              ×
                                            </Button>
                                          )}
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