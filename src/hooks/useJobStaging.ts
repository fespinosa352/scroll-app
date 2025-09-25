import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface StagedJob {
  id: string;
  user_id: string;
  job_title: string;
  company: string;
  job_description: string;
  extracted_keywords?: any;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useJobStaging = () => {
  const [stagedJobs, setStagedJobs] = useState<StagedJob[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchStagedJobs = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('job_staging')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStagedJobs(data || []);
    } catch (error) {
      console.error('Error fetching staged jobs:', error);
      toast.error('Failed to load staged jobs');
    } finally {
      setLoading(false);
    }
  };

  const stageJob = async (jobData: {
    job_title: string;
    company: string;
    job_description: string;
    extracted_keywords?: any;
  }): Promise<StagedJob | null> => {
    if (!user?.id) {
      toast.error('Please log in to stage jobs');
      return null;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('job_staging')
        .insert({
          user_id: user.id,
          ...jobData
        })
        .select()
        .single();

      if (error) throw error;

      setStagedJobs(prev => [data, ...prev]);
      toast.success('Job staged successfully!');
      return data;
    } catch (error) {
      console.error('Error staging job:', error);
      toast.error('Failed to stage job');
      return null;
    }
  };

  const deleteStagedJob = async (jobId: string): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { error } = await (supabase as any)
        .from('job_staging')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id);

      if (error) throw error;

      setStagedJobs(prev => prev.filter(job => job.id !== jobId));
      toast.success('Staged job deleted');
      return true;
    } catch (error) {
      console.error('Error deleting staged job:', error);
      toast.error('Failed to delete staged job');
      return false;
    }
  };

  return {
    stagedJobs,
    loading,
    fetchStagedJobs,
    stageJob,
    deleteStagedJob
  };
};