import React, { useState } from 'react';
import { BlockSection as BlockSectionType, Block as BlockType, BlockType as BlockTypeEnum } from '@/types/blocks';
import { Block } from './Block';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  GripVertical,
  Type,
  List,
  Target,
  Hash,
  BarChart,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface BlockSectionProps {
  section: BlockSectionType;
  sectionIndex: number;
  onUpdateSection: (section: BlockSectionType) => void;
  onDeleteSection: (sectionId: string) => void;
  editingBlockId?: string;
  onStartEditBlock: (blockId: string) => void;
  onEndEditBlock: () => void;
  isDraggable?: boolean;
  showSectionHandles?: boolean;
}

const blockTypeIcons = {
  text: Type,
  bullet: List,
  achievement: Target,
  heading: Hash,
  metric: BarChart,
  skill_tag: Tag,
};

export const BlockSection: React.FC<BlockSectionProps> = ({
  section,
  sectionIndex,
  onUpdateSection,
  onDeleteSection,
  editingBlockId,
  onStartEditBlock,
  onEndEditBlock,
  isDraggable = true,
  showSectionHandles = true,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(section.title);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleTitleChange = (title: string) => {
    setLocalTitle(title);
    onUpdateSection({
      ...section,
      title,
    });
  };

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    onEndEditBlock();
  };

  const handleToggleCollapse = () => {
    onUpdateSection({
      ...section,
      collapsed: !section.collapsed,
    });
  };

  const handleUpdateBlock = (updatedBlock: BlockType) => {
    const updatedBlocks = section.blocks.map(block =>
      block.id === updatedBlock.id ? updatedBlock : block
    );
    onUpdateSection({
      ...section,
      blocks: updatedBlocks,
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    const updatedBlocks = section.blocks.filter(block => block.id !== blockId);
    onUpdateSection({
      ...section,
      blocks: updatedBlocks,
    });
  };

  const handleAddBlock = (type: BlockTypeEnum, afterBlockIndex?: number) => {
    const newBlock: BlockType = {
      id: `block-${Date.now()}-${Math.random()}`,
      type,
      content: '',
      order: afterBlockIndex !== undefined ? afterBlockIndex + 1 : section.blocks.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let updatedBlocks;
    if (afterBlockIndex !== undefined) {
      // Insert after specific block
      updatedBlocks = [
        ...section.blocks.slice(0, afterBlockIndex + 1),
        newBlock,
        ...section.blocks.slice(afterBlockIndex + 1),
      ];
    } else {
      // Add to end
      updatedBlocks = [...section.blocks, newBlock];
    }

    // Reorder all blocks
    updatedBlocks = updatedBlocks.map((block, index) => ({
      ...block,
      order: index,
    }));

    onUpdateSection({
      ...section,
      blocks: updatedBlocks,
    });

    // Start editing the new block
    setTimeout(() => {
      onStartEditBlock(newBlock.id);
    }, 0);
  };

  const handleAddBlockBelow = (currentBlockIndex: number, type: BlockTypeEnum) => {
    handleAddBlock(type, currentBlockIndex);
  };

  const QuickAddMenu = () => (
    <div className="flex items-center space-x-1 p-2 bg-slate-50 rounded-lg">
      <span className="text-xs text-slate-500 mr-2">Add:</span>
      {Object.entries(blockTypeIcons).map(([type, Icon]) => (
        <Button
          key={type}
          variant="ghost"
          size="sm"
          onClick={() => {
            handleAddBlock(type as BlockTypeEnum);
            setShowQuickAdd(false);
          }}
          className="h-7 w-7 p-0"
          title={`Add ${type}`}
        >
          <Icon className="w-3 h-3" />
        </Button>
      ))}
    </div>
  );

  const sectionContent = (
    <div className="space-y-2">
      {/* Section Header */}
      <div className="flex items-center space-x-2 group">
        {/* Drag Handle for Section */}
        {showSectionHandles && isDraggable && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-slate-400" />
          </div>
        )}

        {/* Collapse Toggle */}
        {section.collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleCollapse}
            className="h-6 w-6 p-0"
          >
            {section.collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        )}

        {/* Section Title */}
        {isEditingTitle ? (
          <Input
            value={localTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setLocalTitle(section.title);
                setIsEditingTitle(false);
              }
            }}
            className="h-8 font-medium"
            autoFocus
          />
        ) : (
          <h4 
            className="font-medium text-slate-900 cursor-text flex-1"
            onClick={() => setIsEditingTitle(true)}
          >
            {section.title}
          </h4>
        )}

        {/* Section Actions */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="h-6 w-6 p-0 text-slate-500 hover:text-green-600"
          >
            <Plus className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDeleteSection(section.id)}
            className="h-6 w-6 p-0 text-slate-500 hover:text-red-600"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Quick Add Menu */}
      {showQuickAdd && <QuickAddMenu />}

      {/* Section Content */}
      {!section.collapsed && (
        <div className="ml-6 space-y-1">
          <Droppable droppableId={`section-${section.id}`} type="block">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "min-h-[2rem] space-y-1",
                  snapshot.isDraggingOver && "bg-blue-50 border-2 border-dashed border-blue-300 rounded"
                )}
              >
                {section.blocks.map((block, index) => (
                  <Block
                    key={block.id}
                    block={block}
                    index={index}
                    onUpdate={handleUpdateBlock}
                    onDelete={handleDeleteBlock}
                    onAddBelow={(type) => handleAddBlockBelow(index, type)}
                    isEditing={editingBlockId === block.id}
                    onStartEdit={() => onStartEditBlock(block.id)}
                    onEndEdit={onEndEditBlock}
                    isDraggable={true}
                    showHandles={true}
                  />
                ))}
                {provided.placeholder}

                {/* Empty State */}
                {section.blocks.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Plus className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-sm">No content yet</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddBlock('text')}
                      className="mt-2"
                    >
                      Add your first block
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </div>
  );

  if (isDraggable && showSectionHandles) {
    return (
      <Draggable draggableId={`section-${section.id}`} index={sectionIndex}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              "bg-white border rounded-lg p-4",
              snapshot.isDragging && "shadow-lg"
            )}
          >
            {sectionContent}
          </div>
        )}
      </Draggable>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4">
      {sectionContent}
    </div>
  );
};