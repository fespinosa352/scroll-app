import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type WorkExperience = Tables<'work_experiences'>;
type WorkExperienceInsert = Omit<WorkExperience, 'id' | 'created_at' | 'updated_at'>;
type WorkExperienceUpdate = Partial<WorkExperienceInsert>;

export const useWorkExperience = () => {
  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const fetchWorkExperiences = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('work_experiences')
        .select(`
          *,
          companies (
            id,
            name,
            industry,
            size_category
          )
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setWorkExperiences(data || []);
    } catch (error) {
      console.error('Error fetching work experiences:', error);
      toast.error('Failed to load work experiences');
    } finally {
      setLoading(false);
    }
  };

  const saveWorkExperience = async (workExperience: WorkExperienceInsert): Promise<WorkExperience | null> => {
    if (!user) {
      toast.error('You must be logged in to save work experience');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('work_experiences')
        .insert({
          ...workExperience,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setWorkExperiences(prev => [data, ...prev]);
      toast.success('Work experience saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving work experience:', error);
      toast.error('Failed to save work experience');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateWorkExperience = async (id: string, updates: WorkExperienceUpdate): Promise<WorkExperience | null> => {
    if (!user) {
      toast.error('You must be logged in to update work experience');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('work_experiences')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setWorkExperiences(prev => 
        prev.map(exp => exp.id === id ? data : exp)
      );
      toast.success('Work experience updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating work experience:', error);
      toast.error('Failed to update work experience');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkExperience = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to delete work experience');
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('work_experiences')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setWorkExperiences(prev => prev.filter(exp => exp.id !== id));
      toast.success('Work experience deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting work experience:', error);
      toast.error('Failed to delete work experience');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchWorkExperiences();
  }, [user]);

  return {
    workExperiences,
    loading,
    saving,
    fetchWorkExperiences,
    saveWorkExperience,
    updateWorkExperience,
    deleteWorkExperience
  };
};