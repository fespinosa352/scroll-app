import React, { useState, useRef, useEffect } from 'react';
import { Block as BlockType, BlockType as BlockTypeEnum } from '@/types/blocks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Plus, 
  Trash2, 
  Type, 
  List, 
  Target, 
  Hash, 
  BarChart, 
  Tag,
  MoreHorizontal,
  Bold,
  Italic,
  Underline
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Draggable } from 'react-beautiful-dnd';

interface BlockProps {
  block: BlockType;
  index: number;
  onUpdate: (block: BlockType) => void;
  onDelete: (blockId: string) => void;
  onAddBelow: (blockType: BlockTypeEnum) => void;
  isEditing?: boolean;
  onStartEdit?: () => void;
  onEndEdit?: () => void;
  isDraggable?: boolean;
  showHandles?: boolean;
}

const blockIcons = {
  text: Type,
  bullet: List,
  achievement: Target,
  heading: Hash,
  metric: BarChart,
  skill_tag: Tag,
};

const blockLabels = {
  text: 'Text',
  bullet: 'Bullet Point',
  achievement: 'Achievement',
  heading: 'Heading',
  metric: 'Metric',
  skill_tag: 'Skill',
};

export const Block: React.FC<BlockProps> = ({
  block,
  index,
  onUpdate,
  onDelete,
  onAddBelow,
  isEditing = false,
  onStartEdit,
  onEndEdit,
  isDraggable = true,
  showHandles = true,
}) => {
  const [localContent, setLocalContent] = useState(block.content);
  const [isHovered, setIsHovered] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  
  const IconComponent = blockIcons[block.type];

  useEffect(() => {
    setLocalContent(block.content);
  }, [block.content]);

  useEffect(() => {
    if (isEditing && contentRef.current) {
      contentRef.current.focus();
      // Place cursor at end
      const length = localContent.length;
      contentRef.current.setSelectionRange(length, length);
    }
  }, [isEditing, localContent]);

  const handleContentChange = (value: string) => {
    setLocalContent(value);
    onUpdate({
      ...block,
      content: value,
      updated_at: new Date().toISOString(),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEndEdit?.();
      onAddBelow('text');
    } else if (e.key === 'Escape') {
      onEndEdit?.();
    }
  };

  const handleTypeChange = (newType: BlockTypeEnum) => {
    onUpdate({
      ...block,
      type: newType,
      updated_at: new Date().toISOString(),
    });
    setShowTypeMenu(false);
  };

  const renderContent = () => {
    if (isEditing) {
      if (block.type === 'heading') {
        return (
          <Input
            ref={contentRef as React.RefObject<HTMLInputElement>}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onEndEdit}
            placeholder="Enter heading..."
            className="text-lg font-semibold border-none p-0 h-auto focus:ring-0"
          />
        );
      } else {
        return (
          <Textarea
            ref={contentRef as React.RefObject<HTMLTextAreaElement>}
            value={localContent}
            onChange={(e) => handleContentChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={onEndEdit}
            placeholder={getPlaceholder()}
            className="border-none p-0 resize-none focus:ring-0 min-h-[3rem] w-full"
            rows={Math.max(3, Math.ceil(localContent.length / 80))}
          />
        );
      }
    }

    switch (block.type) {
      case 'heading':
        return (
          <h3 
            className="text-lg font-semibold cursor-text"
            onClick={onStartEdit}
          >
            {block.content || 'Untitled Section'}
          </h3>
        );
      case 'bullet':
        return (
          <div className="flex items-start space-x-2 cursor-text" onClick={onStartEdit}>
            <span className="text-slate-400 mt-1">•</span>
            <span>{block.content || 'Add bullet point...'}</span>
          </div>
        );
      case 'achievement':
        return (
          <div className="flex items-start space-x-2 cursor-text" onClick={onStartEdit}>
            <Target className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
            <span className="font-medium">{block.content || 'Add achievement...'}</span>
          </div>
        );
      case 'metric':
        return (
          <div className="flex items-center space-x-2 cursor-text" onClick={onStartEdit}>
            <BarChart className="w-4 h-4 text-blue-600" />
            <Badge variant="secondary" className="font-mono">
              {block.content || 'Add metric...'}
            </Badge>
          </div>
        );
      case 'skill_tag':
        return (
          <Badge 
            variant="outline" 
            className="cursor-text"
            onClick={onStartEdit}
          >
            {block.content || 'Add skill...'}
          </Badge>
        );
      default:
        return (
          <span 
            className="cursor-text"
            onClick={onStartEdit}
          >
            {block.content || 'Type something...'}
          </span>
        );
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'bullet':
        return 'Add bullet point...';
      case 'achievement':
        return 'Describe your achievement with impact and results...';
      case 'metric':
        return 'e.g., "40% increase" or "$1M revenue"';
      case 'skill_tag':
        return 'Skill name...';
      default:
        return 'Type something...';
    }
  };

  const blockContent = (
    <div
      className={cn(
        "group relative",
        isDraggable && "cursor-move",
        isHovered && "bg-slate-50",
        isEditing && "bg-blue-50 border border-blue-200 shadow-sm",
        "rounded p-2 transition-colors"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start space-x-2">
        {/* Drag Handle */}
        {showHandles && isDraggable && (
          <div className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "flex flex-col items-center justify-center h-6 w-4 cursor-grab active:cursor-grabbing"
          )}>
            <GripVertical className="w-3 h-3 text-slate-400" />
          </div>
        )}

        {/* Block Type Icon */}
        <div className="flex items-center justify-center w-5 h-5 mt-0.5">
          <IconComponent className="w-4 h-4 text-slate-500" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {renderContent()}
        </div>

        {/* Actions */}
        {isHovered && !isEditing && (
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTypeMenu(!showTypeMenu)}
              className="h-6 w-6 p-0"
            >
              <MoreHorizontal className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddBelow('text')}
              className="h-6 w-6 p-0 text-slate-500 hover:text-green-600"
            >
              <Plus className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(block.id)}
              className="h-6 w-6 p-0 text-slate-500 hover:text-red-600"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Type Selection Menu */}
      {showTypeMenu && (
        <div className="absolute top-8 right-0 z-10 bg-white border rounded-lg shadow-lg p-1 min-w-32">
          {Object.entries(blockLabels).map(([type, label]) => {
            const Icon = blockIcons[type as BlockTypeEnum];
            return (
              <button
                key={type}
                onClick={() => handleTypeChange(type as BlockTypeEnum)}
                className={cn(
                  "w-full flex items-center space-x-2 px-2 py-1 text-left text-sm rounded hover:bg-slate-100",
                  block.type === type && "bg-blue-50 text-blue-700"
                )}
              >
                <Icon className="w-3 h-3" />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (isDraggable) {
    return (
      <Draggable draggableId={block.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={cn(
              snapshot.isDragging && "shadow-lg bg-white border"
            )}
          >
            {blockContent}
          </div>
        )}
      </Draggable>
    );
  }

  return blockContent;
};