import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Certification = Tables<'certifications'>;
type CertificationInsert = Omit<Certification, 'id' | 'created_at' | 'updated_at'>;
type CertificationUpdate = Partial<CertificationInsert>;

export const useCertifications = () => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const fetchCertifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('certifications')
        .select('*')
        .eq('user_id', user.id)
        .order('issue_date', { ascending: false });

      if (error) throw error;

      setCertifications(data || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const saveCertification = async (certificationData: CertificationInsert): Promise<Certification | null> => {
    if (!user) {
      toast.error('You must be logged in to save certification');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('certifications')
        .insert({
          ...certificationData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      setCertifications(prev => [data, ...prev]);
      toast.success('Certification saved successfully');
      return data;
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error('Failed to save certification');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const updateCertification = async (id: string, updates: CertificationUpdate): Promise<Certification | null> => {
    if (!user) {
      toast.error('You must be logged in to update certification');
      return null;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('certifications')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setCertifications(prev => 
        prev.map(cert => cert.id === id ? data : cert)
      );
      toast.success('Certification updated successfully');
      return data;
    } catch (error) {
      console.error('Error updating certification:', error);
      toast.error('Failed to update certification');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const deleteCertification = async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('You must be logged in to delete certification');
      return false;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('certifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setCertifications(prev => prev.filter(cert => cert.id !== id));
      toast.success('Certification deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast.error('Failed to delete certification');
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchCertifications();
  }, [user]);

  return {
    certifications,
    loading,
    saving,
    fetchCertifications,
    saveCertification,
    updateCertification,
    deleteCertification
  };
};