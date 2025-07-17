// Block-based content system types

export type BlockType = 
  | 'text' 
  | 'bullet' 
  | 'achievement' 
  | 'heading' 
  | 'metric'
  | 'skill_tag';

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: {
    level?: number; // for headings (h1, h2, h3)
    style?: 'bold' | 'italic' | 'underline';
    color?: string;
    metric?: {
      value: string;
      unit: string;
      context: string;
    };
    skill?: {
      name: string;
      proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    };
    education?: {
      institution: string;
      degree: string;
      fieldOfStudy: string;
      dates: string;
      gpa?: string;
    };
    certification?: {
      name: string;
      issuer: string;
      issueDate: string;
      expiryDate?: string;
      credentialId?: string;
      credentialUrl?: string;
    };
  };
  order: number;
  created_at: string;
  updated_at: string;
}

export interface BlockSection {
  id: string;
  title: string;
  blocks: Block[];
  order: number;
  collapsible?: boolean;
  collapsed?: boolean;
}

export interface WorkExperienceWithBlocks {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  isCurrentRole: boolean;
  location?: string;
  sections: BlockSection[];
  skills: string[];
  created_at: string;
  updated_at: string;
}

// Block templates for common use cases
export interface BlockTemplate {
  id: string;
  name: string;
  description: string;
  blocks: Omit<Block, 'id' | 'created_at' | 'updated_at'>[];
  category: 'achievement' | 'responsibility' | 'project' | 'skill';
}

// For resume building - blocks that can be dragged
export interface DraggableBlock extends Block {
  sourceExperienceId: string;
  sourceSectionId: string;
  isDraggable: boolean;
  tags: string[]; // for filtering/searching
  contentType?: 'experience' | 'education' | 'certifications' | 'skills';
}

// Resume structure with blocks
export interface ResumeSection {
  id: string;
  title: string;
  type: 'experience' | 'education' | 'skills' | 'certifications' | 'custom';
  blocks: DraggableBlock[];
  order: number;
  visible: boolean;
}

export interface Resume {
  id: string;
  name: string;
  sections: ResumeSection[];
  template: string;
  created_at: string;
  updated_at: string;
}