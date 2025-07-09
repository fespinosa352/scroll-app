import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserProfileData {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  phone?: string;
  location?: string;
  work_experiences: Array<{
    id: string;
    title: string;
    company_name: string;
    start_date: string;
    end_date?: string;
    is_current: boolean;
    location?: string;
    description?: string;
    companies?: {
      id: string;
      name: string;
      industry?: string;
      size_category?: string;
    };
    projects?: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field_of_study?: string;
    start_date?: string;
    end_date?: string;
    gpa?: number;
    is_current?: boolean;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuing_organization: string;
    issue_date?: string;
    expiration_date?: string;
    credential_id?: string;
    credential_url?: string;
  }>;
  user_skills: Array<{
    id: string;
    skill_name: string;
    proficiency_level?: string;
    years_of_experience?: number;
  }>;
}

export const useUserProfileData = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userProfileData', user?.id],
    queryFn: async (): Promise<UserProfileData | null> => {
      if (!user?.id) return null;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            id,
            user_id,
            display_name,
            email,
            phone,
            location,
            work_experiences (
              id,
              title,
              company_name,
              start_date,
              end_date,
              is_current,
              location,
              description,
              companies (
                id,
                name,
                industry,
                size_category
              ),
              projects (
                id,
                title,
                description
              )
            ),
            education (
              id,
              institution,
              degree,
              field_of_study,
              start_date,
              end_date,
              gpa,
              is_current
            ),
            certifications (
              id,
              name,
              issuing_organization,
              issue_date,
              expiration_date,
              credential_id,
              credential_url
            ),
            user_skills (
              id,
              skill_name,
              proficiency_level,
              years_of_experience
            )
          `)
          .eq('user_id', user.id)
          .order('start_date', { referencedTable: 'work_experiences', ascending: false })
          .order('start_date', { referencedTable: 'education', ascending: false })
          .order('issue_date', { referencedTable: 'certifications', ascending: false })
          .single();

        if (error) {
          // If profile doesn't exist, create it
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: user.id,
                display_name: user.user_metadata?.display_name || user.email?.split('@')[0],
                email: user.email,
              })
              .select(`
                id,
                user_id,
                display_name,
                email,
                phone,
                location
              `)
              .single();

            if (createError) throw createError;

            return {
              ...newProfile,
              work_experiences: [],
              education: [],
              certifications: [],
              user_skills: []
            };
          }
          throw error;
        }

        return data;
      } catch (error) {
        console.error('Error fetching user profile data:', error);
        toast.error('Failed to load profile data');
        throw error;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Invalidate cache functions for real-time updates
  const invalidateUserData = () => {
    queryClient.invalidateQueries({ queryKey: ['userProfileData', user?.id] });
  };

  const updateWorkExperience = (updatedExp: any) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        work_experiences: old.work_experiences.map(exp => 
          exp.id === updatedExp.id ? { ...exp, ...updatedExp } : exp
        )
      };
    });
  };

  const addWorkExperience = (newExp: any) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        work_experiences: [newExp, ...old.work_experiences]
      };
    });
  };

  const removeWorkExperience = (expId: string) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        work_experiences: old.work_experiences.filter(exp => exp.id !== expId)
      };
    });
  };

  const updateEducation = (updatedEdu: any) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        education: old.education.map(edu => 
          edu.id === updatedEdu.id ? { ...edu, ...updatedEdu } : edu
        )
      };
    });
  };

  const addEducation = (newEdu: any) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        education: [newEdu, ...old.education]
      };
    });
  };

  const removeEducation = (eduId: string) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        education: old.education.filter(edu => edu.id !== eduId)
      };
    });
  };

  const updateCertification = (updatedCert: any) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        certifications: old.certifications.map(cert => 
          cert.id === updatedCert.id ? { ...cert, ...updatedCert } : cert
        )
      };
    });
  };

  const addCertification = (newCert: any) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        certifications: [newCert, ...old.certifications]
      };
    });
  };

  const removeCertification = (certId: string) => {
    queryClient.setQueryData(['userProfileData', user?.id], (old: UserProfileData | null | undefined) => {
      if (!old) return old;
      
      return {
        ...old,
        certifications: old.certifications.filter(cert => cert.id !== certId)
      };
    });
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    invalidateUserData,
    // Work experience cache updates
    updateWorkExperience,
    addWorkExperience,
    removeWorkExperience,
    // Education cache updates
    updateEducation,
    addEducation,
    removeEducation,
    // Certification cache updates
    updateCertification,
    addCertification,
    removeCertification,
  };
};

export type { UserProfileData };