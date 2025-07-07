import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Resume = Database['public']['Tables']['resumes']['Row'];
type ResumeInsert = Database['public']['Tables']['resumes']['Insert'];
type ResumeUpdate = Database['public']['Tables']['resumes']['Update'];

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

  // Fetch user resumes
  const fetchUserResumes = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error fetching resumes:', error);
      toast.error('Failed to load resumes');
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

  // Save resume with file upload
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

      // Save resume record
      const resumeRecord: ResumeInsert = {
        user_id: user.id,
        name: resumeData.name,
        content: resumeData.content,
        file_url,
        ats_score: resumeData.ats_score,
        ats_issues: resumeData.ats_issues,
        ats_suggestions: resumeData.ats_suggestions,
        source_file: file?.name || resumeData.source_file,
        imported_from: resumeData.imported_from || 'File Upload',
        version: resumeData.version || 'v1.0'
      };

      const { data, error } = await supabase
        .from('resumes')
        .insert(resumeRecord)
        .select()
        .single();

      if (error) throw error;

      setResumes(prev => [data, ...prev]);
      toast.success('Resume saved successfully!');
      return data;
    } catch (error: any) {
      console.error('Error saving resume:', error);
      toast.error(error.message || 'Failed to save resume');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Update existing resume
  const updateResume = async (id: string, updates: ResumeUpdate): Promise<Resume | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('resumes')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setResumes(prev => prev.map(resume => 
        resume.id === id ? data : resume
      ));
      
      toast.success('Resume updated successfully!');
      return data;
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
      // Get resume to find file path
      const resume = resumes.find(r => r.id === id);
      
      // Delete file from storage if exists
      if (resume?.file_url) {
        await supabase.storage
          .from('resume-files')
          .remove([resume.file_url]);
      }

      // Delete database record
      const { error } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setResumes(prev => prev.filter(resume => resume.id !== id));
      toast.success('Resume deleted successfully!');
      return true;
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast.error('Failed to delete resume');
      return false;
    }
  };

  // Set active resume (make others inactive)
  const setActiveResume = async (id: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      // First, make all resumes inactive
      await supabase
        .from('resumes')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Then make the selected resume active
      const { error } = await supabase
        .from('resumes')
        .update({ is_active: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setResumes(prev => prev.map(resume => ({
        ...resume,
        is_active: resume.id === id
      })));

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

      const duplicateData: ResumeInsert = {
        user_id: user.id,
        name: `${original.name} (Copy)`,
        content: original.content,
        ats_score: original.ats_score,
        ats_issues: original.ats_issues,
        ats_suggestions: original.ats_suggestions,
        source_file: original.source_file,
        imported_from: original.imported_from,
        version: original.version,
        is_active: false
      };

      const { data, error } = await supabase
        .from('resumes')
        .insert(duplicateData)
        .select()
        .single();

      if (error) throw error;

      setResumes(prev => [data, ...prev]);
      toast.success('Resume duplicated successfully!');
      return data;
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