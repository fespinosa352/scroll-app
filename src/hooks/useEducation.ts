import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Education = Tables<'education'>;
type EducationInsert = Omit<Education, 'id' | 'created_at' | 'updated_at'>;
type EducationUpdate = Partial<EducationInsert>;

export const useEducation = () => {
  const [education, setEducation] = useState<Education[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const fetchEducation = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setEducation(data || []);
    } catch (error) {
      console.error('Error fetching education:', error);
      toast.error('Failed to load education');
    } finally {
      setLoading(false);
    }
  };

  const saveEducation = async (educationData: EducationInsert): Promise<Education | null> => {
    if (!user) {
      toast.error('You must be logged in to save education');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('education')
        .insert({
          ...educationData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setEducation(prev => [data, ...prev]);
      toast.success('Education saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving education:', error);
      toast.error('Failed to save education');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateEducation = async (id: string, updates: EducationUpdate): Promise<Education | null> => {
    if (!user) {
      toast.error('You must be logged in to update education');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('education')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setEducation(prev => 
        prev.map(edu => edu.id === id ? data : edu)
      );
      toast.success('Education updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating education:', error);
      toast.error('Failed to update education');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteEducation = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to delete education');
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('education')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setEducation(prev => prev.filter(edu => edu.id !== id));
      toast.success('Education deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error('Failed to delete education');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchEducation();
  }, [user]);

  return {
    education,
    loading,
    saving,
    fetchEducation,
    saveEducation,
    updateEducation,
    deleteEducation
  };
};