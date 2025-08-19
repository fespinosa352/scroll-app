import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const { user, isGuest } = useAuth();

  // Fetch user profile
  const fetchProfile = async () => {
    if (!user?.id || isGuest) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (updates: ProfileUpdate): Promise<Profile | null> => {
    if (!user?.id || isGuest) {
      toast.error('Profile updates are not available in demo mode');
      return null;
    }

    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast.success('Profile updated successfully!');
      return data;
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  // Create profile if it doesn't exist
  const createProfile = async (profileData: Omit<ProfileUpdate, 'id' | 'created_at' | 'updated_at'>): Promise<Profile | null> => {
    if (!user?.id || isGuest) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          ...profileData
        })
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      toast.success('Profile created successfully!');
      return data;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast.error(error.message || 'Failed to create profile');
      return null;
    }
  };

  // Get user's first name
  const getFirstName = (): string => {
    if (profile?.display_name) {
      return profile.display_name.split(' ')[0];
    }
    
    if (user?.email) {
      const emailUsername = user.email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }
    
    return 'there';
  };

  // Load profile on mount and user change
  useEffect(() => {
    if (user?.id && !isGuest) {
      fetchProfile();
    }
  }, [user?.id, isGuest]);

  return {
    profile,
    loading,
    updating,
    fetchProfile,
    updateProfile,
    createProfile,
    getFirstName
  };
};