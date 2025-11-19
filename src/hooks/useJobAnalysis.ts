import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface JobAnalysis {
  id?: string;
  job_title: string;
  company?: string;
  job_description: string;
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  key_requirements: string[];
  recommendations: string[];
  critical_areas?: string[];
  created_at?: string;
}

export interface UserSkill {
  id?: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  years_experience: number;
}

export const useJobAnalysis = () => {
  const { user } = useAuth();
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [jobAnalyses, setJobAnalyses] = useState<JobAnalysis[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user skills
  const fetchUserSkills = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .select('*')
        .eq('user_id', user.id)
        .order('skill_name');

      if (error) throw error;
      setUserSkills((data || []) as UserSkill[]);
    } catch (error) {
      console.error('Error fetching user skills:', error);
    }
  };

  // Fetch job analyses
  const fetchJobAnalyses = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_analyses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobAnalyses(data || []);
    } catch (error) {
      console.error('Error fetching job analyses:', error);
    }
  };

  // Save job analysis
  const saveJobAnalysis = async (analysis: Omit<JobAnalysis, 'id' | 'created_at'>) => {
    if (!user) return null;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_analyses')
        .insert({
          user_id: user.id,
          ...analysis
        })
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setJobAnalyses(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error saving job analysis:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Add user skill
  const addUserSkill = async (skill: Omit<UserSkill, 'id'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_skills')
        .insert({
          user_id: user.id,
          ...skill
        })
        .select()
        .single();

      if (error) throw error;

      setUserSkills(prev => [...prev, data as UserSkill]);
      return data;
    } catch (error) {
      console.error('Error adding user skill:', error);
      return null;
    }
  };

  // Get user skills as simple array for matching
  const getUserSkillNames = (): string[] => {
    return userSkills.map(skill => skill.skill_name.toLowerCase());
  };

  useEffect(() => {
    if (user) {
      fetchUserSkills();
      fetchJobAnalyses();
    }
  }, [user]);

  return {
    userSkills,
    jobAnalyses,
    loading,
    saveJobAnalysis,
    addUserSkill,
    getUserSkillNames,
    refetchSkills: fetchUserSkills,
    refetchAnalyses: fetchJobAnalyses
  };
};