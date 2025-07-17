import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Project = Tables<'projects'>;

interface ProjectWithWorkExperience extends Project {
  work_experiences?: {
    id: string;
    company_name: string | null;
    title: string;
    companies?: {
      name: string;
    } | null;
  } | null;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectWithWorkExperience[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          work_experiences (
            id,
            company_name,
            title,
            companies (
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load achievements');
    } finally {
      setLoading(false);
    }
  };

  const refreshProjects = () => {
    fetchProjects();
  };

  useEffect(() => {
    fetchProjects();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    projects,
    loading,
    refreshProjects
  };
};