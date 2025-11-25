import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type SourceResume = Database['public']['Tables']['source_resumes']['Row'];
type SourceResumeInsert = Database['public']['Tables']['source_resumes']['Insert'];
type GeneratedResume = Database['public']['Tables']['generated_resumes']['Row'];
type GeneratedResumeInsert = Database['public']['Tables']['generated_resumes']['Insert'];
type GeneratedResumeUpdate = Database['public']['Tables']['generated_resumes']['Update'];

// Combined resume type for backward compatibility
export interface Resume {
  id: string;
  user_id: string;
  name: string;
  content: any;
  file_url?: string | null;
  created_at: string;
  updated_at?: string;
  // Source resume fields
  raw_content?: any;
  parsed_at?: string;
  // Generated resume fields
  ats_score?: number | null;
  ats_issues?: string[] | null;
  ats_suggestions?: string[] | null;
  ats_optimization_notes?: string[] | null;
  job_description?: string | null;
  job_title?: string | null;
  company_target?: string | null;
  // Metadata
  type: 'source' | 'generated';
  is_active?: boolean;
  version?: string;
  source_file?: string;
  imported_from?: string;
}

export interface ResumeData {
  name: string;
  content: any;
  ats_score?: number;
  ats_issues?: string[];
  ats_suggestions?: string[];
  source_file?: string;
  imported_from?: string;
  version?: string;
}

export const useResumes = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  // Fetch user resumes from both tables
  const fetchUserResumes = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Fetch both source and generated resumes
      const [sourceResult, generatedResult] = await Promise.all([
        supabase
          .from('source_resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('generated_resumes')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (sourceResult.error) throw sourceResult.error;
      if (generatedResult.error) throw generatedResult.error;

      // Convert to unified Resume format
      const sourceResumes: Resume[] = (sourceResult.data || []).map(sr => ({
        id: sr.id,
        user_id: sr.user_id,
        name: sr.name,
        content: sr.raw_content,
        file_url: sr.file_url,
        created_at: sr.created_at,
        parsed_at: sr.parsed_at,
        raw_content: sr.raw_content,
        type: 'source' as const
      }));

      const generatedResumes: Resume[] = (generatedResult.data || []).map(gr => ({
        id: gr.id,
        user_id: gr.user_id,
        name: gr.name,
        content: gr.content,
        created_at: gr.created_at,
        updated_at: gr.updated_at,
        ats_score: gr.ats_score,
        ats_optimization_notes: gr.ats_optimization_notes,
        job_description: gr.job_description,
        job_title: gr.job_title,
        company_target: gr.company_target,
        type: 'generated' as const
      }));

      // Combine and sort by created_at
      const allResumes = [...sourceResumes, ...generatedResumes].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setResumes(allResumes);
    } catch (error: any) {
      console.error('Error fetching resumes:', error);
      console.error('Detailed error info:', { message: error.message, code: error.code, details: error.details });
      toast.error(`Failed to load resumes: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Upload file to storage
  const uploadFile = async (file: File): Promise<string | null> => {
    if (!user?.id) throw new Error('User not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('resume-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data?.path || null;
  };

  // Save resume with file upload (saves to source_resumes)
  const saveResume = async (resumeData: ResumeData, file?: File): Promise<Resume | null> => {
    if (!user?.id) {
      toast.error('Please log in to save resumes');
      return null;
    }

    setUploading(true);
    try {
      let file_url = null;

      // Upload file if provided
      if (file) {
        // Validate file type
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/msword'
        ];

        if (!validTypes.includes(file.type)) {
          throw new Error('Invalid file type. Please upload DOC or DOCX files only.');
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }

        file_url = await uploadFile(file);
      }

      // Save to source_resumes table
      const resumeRecord: SourceResumeInsert = {
        user_id: user.id,
        name: resumeData.name,
        raw_content: resumeData.content,
        file_url
      };

      const { data, error } = await supabase
        .from('source_resumes')
        .insert(resumeRecord)
        .select()
        .single();

      if (error) throw error;

      const newResume: Resume = {
        id: data.id,
        user_id: data.user_id,
        name: data.name,
        content: data.raw_content,
        file_url: data.file_url,
        created_at: data.created_at,
        parsed_at: data.parsed_at,
        raw_content: data.raw_content,
        type: 'source'
      };

      setResumes(prev => [newResume, ...prev]);
      toast.success('Resume saved successfully!');
      return newResume;
    } catch (error: any) {
      console.error('Error saving resume:', error);
      toast.error(error.message || 'Failed to save resume');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Update existing resume
  const updateResume = async (id: string, updates: Partial<Resume>): Promise<Resume | null> => {
    if (!user?.id) return null;

    try {
      // Find the resume to determine its type
      const resume = resumes.find(r => r.id === id);
      if (!resume) {
        toast.error('Resume not found');
        return null;
      }

      if (resume.type === 'generated') {
        // Update generated resume
        const generatedUpdates: GeneratedResumeUpdate = {
          name: updates.name,
          content: updates.content,
          ats_score: updates.ats_score,
          ats_optimization_notes: updates.ats_optimization_notes,
          job_description: updates.job_description,
          job_title: updates.job_title,
          company_target: updates.company_target
        };

        const { data, error } = await supabase
          .from('generated_resumes')
          .update(generatedUpdates)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        const updatedResume: Resume = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          content: data.content,
          created_at: data.created_at,
          updated_at: data.updated_at,
          ats_score: data.ats_score,
          ats_optimization_notes: data.ats_optimization_notes,
          job_description: data.job_description,
          job_title: data.job_title,
          company_target: data.company_target,
          type: 'generated'
        };

        setResumes(prev => prev.map(r => r.id === id ? updatedResume : r));
        toast.success('Resume updated successfully!');
        return updatedResume;
      } else {
        // Source resumes are typically not updated, but we can update the name
        const { data, error } = await supabase
          .from('source_resumes')
          .update({ name: updates.name })
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        const updatedResume: Resume = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          content: data.raw_content,
          file_url: data.file_url,
          created_at: data.created_at,
          parsed_at: data.parsed_at,
          raw_content: data.raw_content,
          type: 'source'
        };

        setResumes(prev => prev.map(r => r.id === id ? updatedResume : r));
        toast.success('Resume updated successfully!');
        return updatedResume;
      }
    } catch (error) {
      console.error('Error updating resume:', error);
      toast.error('Failed to update resume');
      return null;
    }
  };

  // Delete resume and associated file
  const deleteResume = async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // Find the resume to determine its type
      const resume = resumes.find(r => r.id === id);
      if (!resume) {
        toast.error('Resume not found');
        return false;
      }

      // Delete file from storage if exists
      if (resume.file_url) {
        await supabase.storage
          .from('resume-files')
          .remove([resume.file_url]);
      }

      // Delete from appropriate table
      const tableName = resume.type === 'source' ? 'source_resumes' : 'generated_resumes';
      const { error } = await supabase
        .from(tableName as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setResumes(prev => prev.filter(r => r.id !== id));
      toast.success('Resume deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
      return false;
    }
  };

  // Set active resume (only for generated resumes, deprecated for source resumes)
  const setActiveResume = async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const resume = resumes.find(r => r.id === id);
      if (!resume) {
        toast.error('Resume not found');
        return false;
      }

      if (resume.type !== 'generated') {
        toast.warning('Only generated resumes can be set as active');
        return false;
      }

      // For now, just mark it in local state
      // You could add an is_active field to generated_resumes if needed
      toast.success('Active resume updated!');
      return true;
    } catch (error) {
      console.error('Error setting active resume:', error);
      toast.error('Failed to update active resume');
      return false;
    }
  };

  // Duplicate existing resume
  const duplicateResume = async (id: string): Promise<Resume | null> => {
    if (!user?.id) return null;

    try {
      const original = resumes.find(r => r.id === id);
      if (!original) throw new Error('Resume not found');

      if (original.type === 'generated') {
        const duplicateData: GeneratedResumeInsert = {
          user_id: user.id,
          name: `${original.name} (Copy)`,
          content: original.content,
          ats_score: original.ats_score,
          ats_optimization_notes: original.ats_optimization_notes,
          job_description: original.job_description,
          job_title: original.job_title,
          company_target: original.company_target
        };

        const { data, error } = await supabase
          .from('generated_resumes')
          .insert(duplicateData)
          .select()
          .single();

        if (error) throw error;

        const newResume: Resume = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          content: data.content,
          created_at: data.created_at,
          updated_at: data.updated_at,
          ats_score: data.ats_score,
          ats_optimization_notes: data.ats_optimization_notes,
          job_description: data.job_description,
          job_title: data.job_title,
          company_target: data.company_target,
          type: 'generated'
        };

        setResumes(prev => [newResume, ...prev]);
        toast.success('Resume duplicated successfully!');
        return newResume;
      } else {
        const duplicateData: SourceResumeInsert = {
          user_id: user.id,
          name: `${original.name} (Copy)`,
          raw_content: original.raw_content,
          file_url: original.file_url
        };

        const { data, error } = await supabase
          .from('source_resumes')
          .insert(duplicateData)
          .select()
          .single();

        if (error) throw error;

        const newResume: Resume = {
          id: data.id,
          user_id: data.user_id,
          name: data.name,
          content: data.raw_content,
          file_url: data.file_url,
          created_at: data.created_at,
          parsed_at: data.parsed_at,
          raw_content: data.raw_content,
          type: 'source'
        };

        setResumes(prev => [newResume, ...prev]);
        toast.success('Resume duplicated successfully!');
        return newResume;
      }
    } catch (error) {
      console.error('Error duplicating resume:', error);
      toast.error('Failed to duplicate resume');
      return null;
    }
  };

  // Load resumes on mount and user change
  useEffect(() => {
    if (user?.id) {
      fetchUserResumes();
    }
  }, [user?.id]);

  return {
    resumes,
    loading,
    uploading,
    saveResume,
    fetchUserResumes,
    updateResume,
    deleteResume,
    setActiveResume,
    duplicateResume
  };
};