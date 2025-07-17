import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useDatabaseReset = () => {
  const [isResetting, setIsResetting] = useState(false);

  const resetDatabase = async () => {
    setIsResetting(true);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        throw new Error(`Authentication error: ${userError.message}`);
      }
      
      if (!user) {
        throw new Error('No user found. Please log in first.');
      }

      // Tables to clean in order (respecting foreign key constraints)
      const tablesToClean = [
        'skills_experience',
        'projects', 
        'generated_resumes',
        'source_resumes',
        'resumes',
        'job_analyses',
        'achievements',
        'certifications',
        'education',
        'work_experiences',
        'user_skills'
      ];

      let totalDeleted = 0;
      const results = [];

      // Delete data from each table
      for (const table of tablesToClean) {
        try {
          const { error } = await supabase
            .from(table)
            .delete()
            .eq('user_id', user.id);
            
          if (error) {
            console.warn(`Could not clean ${table}:`, error.message);
            results.push({ table, success: false, error: error.message });
          } else {
            results.push({ table, success: true });
            totalDeleted++;
          }
        } catch (err) {
          console.warn(`Error cleaning ${table}:`, err);
          results.push({ table, success: false, error: err instanceof Error ? err.message : 'Unknown error' });
        }
      }

      // Log results for debugging
      console.log('Database reset results:', results);

      // Show success message
      toast.success(
        `Database reset complete! Cleaned ${totalDeleted} tables.`,
        {
          description: "Your professional data has been cleared. You can now start fresh.",
          duration: 5000,
        }
      );

      return {
        success: true,
        totalDeleted,
        results
      };

    } catch (error) {
      console.error('Database reset failed:', error);
      
      toast.error(
        'Database reset failed',
        {
          description: error instanceof Error ? error.message : 'An unexpected error occurred',
          duration: 5000,
        }
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    } finally {
      setIsResetting(false);
    }
  };

  return {
    resetDatabase,
    isResetting
  };
};