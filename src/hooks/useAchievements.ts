import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Achievement = Database['public']['Tables']['achievements']['Row'];
type AchievementInsert = Database['public']['Tables']['achievements']['Insert'];
type AchievementUpdate = Database['public']['Tables']['achievements']['Update'];

export const useAchievements = () => {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const fetchAchievements = async () => {
        if (!user?.id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('achievements')
                .select('*')
                .eq('user_id', user.id)
                .order('date_achieved', { ascending: false });

            if (error) throw error;
            setAchievements(data || []);
        } catch (error: any) {
            console.error('Error fetching achievements:', error);
            toast.error('Failed to load achievements');
        } finally {
            setLoading(false);
        }
    };

    const createAchievement = async (achievement: Omit<AchievementInsert, 'user_id'>): Promise<Achievement | null> => {
        if (!user?.id) {
            toast.error('You must be logged in to create achievements');
            return null;
        }

        try {
            const { data, error } = await supabase
                .from('achievements')
                .insert({
                    ...achievement,
                    user_id: user.id
                })
                .select()
                .single();

            if (error) throw error;

            setAchievements(prev => [data, ...prev]);
            toast.success('Achievement logged successfully!');
            return data;
        } catch (error: any) {
            console.error('Error creating achievement:', error);
            toast.error('Failed to log achievement');
            return null;
        }
    };

    const updateAchievement = async (id: string, updates: AchievementUpdate): Promise<Achievement | null> => {
        if (!user?.id) return null;

        try {
            const { data, error } = await supabase
                .from('achievements')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;

            setAchievements(prev => prev.map(a => a.id === id ? data : a));
            toast.success('Achievement updated successfully!');
            return data;
        } catch (error: any) {
            console.error('Error updating achievement:', error);
            toast.error('Failed to update achievement');
            return null;
        }
    };

    const deleteAchievement = async (id: string): Promise<boolean> => {
        if (!user?.id) return false;

        try {
            const { error } = await supabase
                .from('achievements')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);

            if (error) throw error;

            setAchievements(prev => prev.filter(a => a.id !== id));
            toast.success('Achievement deleted successfully!');
            return true;
        } catch (error: any) {
            console.error('Error deleting achievement:', error);
            toast.error('Failed to delete achievement');
            return false;
        }
    };

    useEffect(() => {
        if (user?.id) {
            fetchAchievements();
        }
    }, [user?.id]);

    return {
        achievements,
        loading,
        fetchAchievements,
        createAchievement,
        updateAchievement,
        deleteAchievement
    };
};
