import { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Briefcase, Calendar, Building, Edit2, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { useWorkExperience } from "@/hooks/useWorkExperience";
import { WorkExperienceWithBlocks, BlockSection, Block, BlockType } from "@/types/blocks";
import { BlockSection as BlockSectionComponent } from "@/components/blocks/BlockSection";
import { DragDropContext, DropResult, Droppable, Draggable } from "react-beautiful-dnd";

const WorkExperienceBlocks = () => {
  const { workExperienceBlocks, setWorkExperienceBlocks, convertToBlockFormat, workExperience } = useResumeData();
  const { saveWorkExperience, updateWorkExperience, deleteWorkExperience, saving } = useWorkExperience();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    startDate: "",
    endDate: "",
    location: "",
    isCurrentRole: false
  });

  // Debounced save functionality
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const debouncedSave = useCallback((experienceId: string, experience: WorkExperienceWithBlocks) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(async () => {
      if (!experienceId.startsWith('exp-')) {
        try {
          const description = experience.sections
            .flatMap(section => section.blocks.map(block => block.content))
            .join('\n• ');

          const workExperienceData = {
            title: experience.position,
            company_name: experience.company,
            start_date: experience.startDate,
            end_date: experience.isCurrentRole ? null : experience.endDate,
            is_current: experience.isCurrentRole,
            location: experience.location,
            description: description,
          };

          await updateWorkExperience(experienceId, workExperienceData);
          console.log('Auto-saved work experience:', experienceId);
        } catch (error) {
          console.error('Error auto-saving work experience:', error);
        }
      }
    }, 2000); // 2 second delay
  }, [updateWorkExperience]);

  // Initialize block experiences from traditional format if needed
  const experiences = workExperienceBlocks.length > 0 
    ? workExperienceBlocks 
    : (workExperience.length > 0 ? convertToBlockFormat(workExperience) : []);

  const updateExperiences = (newExperiences: WorkExperienceWithBlocks[]) => {
    setWorkExperienceBlocks(newExperiences);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company || !formData.position) {
      toast.error("Please fill in company and position");
      return;
    }

    // Prepare database format
    const workExperienceData = {
      title: formData.position,
      company_name: formData.company, // Store company name directly for now
      start_date: formData.startDate,
      end_date: formData.isCurrentRole ? null : formData.endDate,
      is_current: formData.isCurrentRole,
      location: formData.location,
      description: "", // Will be populated from blocks later
    };

    try {
      if (editingId && !editingId.startsWith('exp-')) {
        // Update existing database record
        const result = await updateWorkExperience(editingId, workExperienceData);
        if (result) {
          // Update local state with new data
          const updatedExperiences = experiences.map(exp => 
            exp.id === editingId ? { 
              ...exp, 
              company: formData.company,
              position: formData.position,
              startDate: formData.startDate,
              endDate: formData.isCurrentRole ? "" : formData.endDate,
              isCurrentRole: formData.isCurrentRole,
              location: formData.location,
              updated_at: new Date().toISOString()
            } : exp
          );
          updateExperiences(updatedExperiences);
        }
      } else {
        // Create new database record
        const result = await saveWorkExperience({
          ...workExperienceData,
          company_id: null,
          user_id: '', // Will be set by the hook
          employment_type: null,
        });
        if (result) {
          // Create block format for UI
          const newExperience: WorkExperienceWithBlocks = {
            id: result.id,
            company: formData.company,
            position: formData.position,
            startDate: formData.startDate,
            endDate: formData.isCurrentRole ? "" : formData.endDate,
            isCurrentRole: formData.isCurrentRole,
            location: formData.location,
            sections: [], // Start with empty sections, user can add their own
            skills: [],
            created_at: result.created_at,
            updated_at: result.updated_at,
          };
          
          const updatedExperiences = [newExperience, ...experiences];
          updateExperiences(updatedExperiences);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving work experience:', error);
      toast.error('Failed to save work experience');
    }
  };

  const resetForm = () => {
    setFormData({
      company: "",
      position: "",
      startDate: "",
      endDate: "",
      location: "",
      isCurrentRole: false
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (experience: WorkExperienceWithBlocks) => {
    setFormData({
      company: experience.company,
      position: experience.position,
      startDate: experience.startDate,
      endDate: experience.endDate,
      location: experience.location || "",
      isCurrentRole: experience.isCurrentRole
    });
    setEditingId(experience.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Only delete from database if it's not a local-only record
      if (!id.startsWith('exp-')) {
        const success = await deleteWorkExperience(id);
        if (!success) {
          return; // Don't update local state if database deletion failed
        }
      }
      
      // Update local state
      const updatedExperiences = experiences.filter(exp => exp.id !== id);
      updateExperiences(updatedExperiences);
    } catch (error) {
      console.error('Error deleting work experience:', error);
      toast.error('Failed to delete work experience');
    }
  };

  const handleUpdateExperience = (updatedExperience: WorkExperienceWithBlocks) => {
    // Update local state immediately for responsive UI
    const updatedExperiences = experiences.map(exp =>
      exp.id === updatedExperience.id ? updatedExperience : exp
    );
    updateExperiences(updatedExperiences);

    // Trigger debounced auto-save
    debouncedSave(updatedExperience.id, updatedExperience);
  };

  const handleUpdateSection = (experienceId: string, updatedSection: BlockSection) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    const updatedSections = experience.sections.map(section =>
      section.id === updatedSection.id ? updatedSection : section
    );

    handleUpdateExperience({
      ...experience,
      sections: updatedSections,
      updated_at: new Date().toISOString(),
    });
  };

  const handleDeleteSection = (experienceId: string, sectionId: string) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    const updatedSections = experience.sections.filter(section => section.id !== sectionId);
    
    handleUpdateExperience({
      ...experience,
      sections: updatedSections,
      updated_at: new Date().toISOString(),
    });

    toast.success("Section deleted");
  };

  const handleAddSection = (experienceId: string) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (!experience) return;

    const newSection: BlockSection = {
      id: `section-${Date.now()}`,
      title: 'New Section',
      blocks: [],
      order: experience.sections.length,
      collapsible: true,
      collapsed: false,
    };

    handleUpdateExperience({
      ...experience,
      sections: [...experience.sections, newSection],
      updated_at: new Date().toISOString(),
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, type } = result;

    if (type === 'experience') {
      // Reorder experiences
      const reorderedExperiences = Array.from(experiences);
      const [removed] = reorderedExperiences.splice(source.index, 1);
      reorderedExperiences.splice(destination.index, 0, removed);
      updateExperiences(reorderedExperiences);
    } else if (type === 'section') {
      // Reorder sections within an experience
      const experienceId = source.droppableId.replace('experience-sections-', '');
      const experience = experiences.find(exp => exp.id === experienceId);
      if (!experience) return;

      const reorderedSections = Array.from(experience.sections);
      const [removed] = reorderedSections.splice(source.index, 1);
      reorderedSections.splice(destination.index, 0, removed);

      handleUpdateExperience({
        ...experience,
        sections: reorderedSections.map((section, index) => ({ ...section, order: index })),
        updated_at: new Date().toISOString(),
      });
    } else if (type === 'block') {
      // Handle block reordering
      const sourceSectionId = source.droppableId.replace('section-', '');
      const destSectionId = destination.droppableId.replace('section-', '');

      // Find the experiences and sections
      let sourceExperience: WorkExperienceWithBlocks | undefined;
      let destExperience: WorkExperienceWithBlocks | undefined;
      let sourceSection: BlockSection | undefined;
      let destSection: BlockSection | undefined;

      for (const exp of experiences) {
        for (const section of exp.sections) {
          if (section.id === sourceSectionId) {
            sourceExperience = exp;
            sourceSection = section;
          }
          if (section.id === destSectionId) {
            destExperience = exp;
            destSection = section;
          }
        }
      }

      if (!sourceExperience || !destExperience || !sourceSection || !destSection) return;

      if (sourceSectionId === destSectionId) {
        // Same section - reorder blocks
        const reorderedBlocks = Array.from(sourceSection.blocks);
        const [removed] = reorderedBlocks.splice(source.index, 1);
        reorderedBlocks.splice(destination.index, 0, removed);

        const updatedSection = {
          ...sourceSection,
          blocks: reorderedBlocks.map((block, index) => ({ ...block, order: index })),
        };

        handleUpdateSection(sourceExperience.id, updatedSection);
      } else {
        // Different sections - move block
        const sourceBlocks = Array.from(sourceSection.blocks);
        const destBlocks = Array.from(destSection.blocks);
        const [removed] = sourceBlocks.splice(source.index, 1);
        destBlocks.splice(destination.index, 0, removed);

        // Update both sections
        const updatedSourceSection = {
          ...sourceSection,
          blocks: sourceBlocks.map((block, index) => ({ ...block, order: index })),
        };

        const updatedDestSection = {
          ...destSection,
          blocks: destBlocks.map((block, index) => ({ ...block, order: index })),
        };

        handleUpdateSection(sourceExperience.id, updatedSourceSection);
        handleUpdateSection(destExperience.id, updatedDestSection);
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience (Block Editor)
            </CardTitle>
            <CardDescription>
              Create detailed, block-based work experience that can be easily reorganized and reused in resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowForm(true)}
              variant="primary"
              size="touch"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Work Experience
            </Button>
          </CardContent>
        </Card>

        {/* Add/Edit Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingId ? "Edit" : "Add"} Work Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Company *</label>
                    <Input
                      placeholder="e.g., Microsoft, Google, Airbnb"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Position *</label>
                    <Input
                      placeholder="e.g., Senior Product Manager"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date</label>
                    <Input
                      type="month"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date</label>
                    <Input
                      type="month"
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      disabled={formData.isCurrentRole}
                      placeholder={formData.isCurrentRole ? "Present" : ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input
                      placeholder="e.g., San Francisco, CA"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="currentRole"
                    checked={formData.isCurrentRole}
                    onChange={(e) => setFormData({...formData, isCurrentRole: e.target.checked, endDate: e.target.checked ? "" : formData.endDate})}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="currentRole" className="text-sm font-medium">
                    This is my current role
                  </label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" variant="primary" size="touch" className="flex-1 md:flex-none" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      `${editingId ? "Update" : "Add"} Experience`
                    )}
                  </Button>
                  <Button type="button" variant="outline" size="touch" onClick={resetForm} className="flex-1 md:flex-none" disabled={saving}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Experience List */}
        <div className="space-y-6">
          {experiences.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No work experience added yet</h3>
                  <p className="text-slate-600 mb-4">
                    Upload a resume in Getting Started or manually add your work experience here.
                  </p>
                  <Button 
                    onClick={() => setShowForm(true)}
                    variant="primary"
                    size="touch"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Experience
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Droppable droppableId="experiences" type="experience">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-6"
                >
                  {experiences.map((experience, index) => (
                    <Draggable key={experience.id} draggableId={experience.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={snapshot.isDragging ? "shadow-lg" : ""}
                        >
                          <Card className="overflow-hidden">
                            <CardHeader className="pb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing pt-1">
                                    <GripVertical className="w-4 h-4 text-slate-400" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Building className="w-4 h-4 text-slate-500" />
                                      <h3 className="font-semibold text-lg">{experience.position}</h3>
                                      {experience.isCurrentRole && (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                          Current
                                        </Badge>
                                      )}
                                    </div>
                                    <p className="text-slate-600 font-medium mb-1">{experience.company}</p>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        <span>{formatDate(experience.startDate)} - {formatDate(experience.endDate)}</span>
                                      </div>
                                      {experience.location && (
                                        <span>{experience.location}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(experience)}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(experience.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>

                            <CardContent className="space-y-4">
                              <Droppable droppableId={`experience-sections-${experience.id}`} type="section">
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="space-y-4"
                                  >
                                    {experience.sections.map((section, sectionIndex) => (
                                      <BlockSectionComponent
                                        key={section.id}
                                        section={section}
                                        sectionIndex={sectionIndex}
                                        onUpdateSection={(updatedSection) => handleUpdateSection(experience.id, updatedSection)}
                                        onDeleteSection={(sectionId) => handleDeleteSection(experience.id, sectionId)}
                                        editingBlockId={editingBlockId}
                                        onStartEditBlock={setEditingBlockId}
                                        onEndEditBlock={() => setEditingBlockId(null)}
                                        isDraggable={true}
                                        showSectionHandles={true}
                                      />
                                    ))}
                                    {provided.placeholder}
                                  </div>
                                )}
                              </Droppable>

                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddSection(experience.id)}
                                className="w-full"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Section
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )}
        </div>
      </div>
    </DragDropContext>
  );
};

export default WorkExperienceBlocks;