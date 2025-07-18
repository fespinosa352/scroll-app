import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

interface BackupData {
  timestamp: string;
  user_id: string;
  work_experiences: any[];
  education: any[];
  certifications: any[];
  user_skills: any[];
  achievements: any[];
  projects: any[];
  job_analyses: any[];
  resumes: any[];
}

export const useDataBackup = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const exportUserData = async (): Promise<string | null> => {
    if (!user?.id) {
      toast.error('Please log in to export your data');
      return null;
    }

    setIsExporting(true);
    
    try {
      // Fetch all user data
      const [
        workExp,
        education,
        certifications,
        skills,
        achievements,
        projects,
        jobAnalyses,
        resumes
      ] = await Promise.all([
        supabase.from('work_experiences').select('*').eq('user_id', user.id),
        supabase.from('education').select('*').eq('user_id', user.id),
        supabase.from('certifications').select('*').eq('user_id', user.id),
        supabase.from('user_skills').select('*').eq('user_id', user.id),
        supabase.from('achievements').select('*').eq('user_id', user.id),
        supabase.from('projects').select('*').eq('user_id', user.id),
        supabase.from('job_analyses').select('*').eq('user_id', user.id),
        supabase.from('resumes').select('*').eq('user_id', user.id)
      ]);

      const backupData: BackupData = {
        timestamp: new Date().toISOString(),
        user_id: user.id,
        work_experiences: workExp.data || [],
        education: education.data || [],
        certifications: certifications.data || [],
        user_skills: skills.data || [],
        achievements: achievements.data || [],
        projects: projects.data || [],
        job_analyses: jobAnalyses.data || [],
        resumes: resumes.data || []
      };

      // Create downloadable file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `chameleon-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const totalItems = Object.values(backupData).reduce((sum, arr) => 
        Array.isArray(arr) ? sum + arr.length : sum, 0
      );

      toast.success(`Data exported successfully! ${totalItems} items backed up.`, {
        description: 'Your backup file has been downloaded'
      });

      return dataStr;
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const importUserData = async (backupFile: File): Promise<boolean> => {
    if (!user?.id) {
      toast.error('Please log in to import data');
      return false;
    }

    setIsImporting(true);

    try {
      // Verify current session is valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session || !session.user) {
        toast.error('Authentication required. Please log in again.');
        return false;
      }

      const fileContent = await backupFile.text();
      const backupData: BackupData = JSON.parse(fileContent);

      // Validate backup data
      if (!backupData.user_id || !backupData.timestamp) {
        throw new Error('Invalid backup file format');
      }

      // Import data table by table
      const importResults = [];

      for (const [tableName, data] of Object.entries(backupData)) {
        if (tableName === 'timestamp' || tableName === 'user_id' || !Array.isArray(data)) {
          continue;
        }

        if (data.length > 0) {
          // Update user_id to current authenticated user and remove auto-generated fields
          const preparedData = data.map(item => {
            const { id, created_at, updated_at, ...cleanItem } = item;
            return {
              ...cleanItem,
              user_id: session.user.id // Use session user ID to ensure consistency
            };
          });

          console.log(`Importing ${data.length} items to ${tableName}:`, preparedData);

          // Use explicit error handling for each table
          try {
            const { data: insertedData, error } = await supabase
              .from(tableName as any)
              .insert(preparedData)
              .select();

            if (error) {
              console.error(`Failed to import ${tableName}:`, error);
              console.error('Prepared data for table:', preparedData);
              importResults.push({ table: tableName, success: false, error: error.message });
            } else {
              console.log(`Successfully imported ${insertedData?.length || data.length} items to ${tableName}`);
              importResults.push({ table: tableName, success: true, count: insertedData?.length || data.length });
            }
          } catch (tableError: any) {
            console.error(`Exception importing ${tableName}:`, tableError);
            importResults.push({ table: tableName, success: false, error: tableError.message });
          }
        }
      }

      const successCount = importResults.filter(r => r.success).length;
      const totalItems = importResults.reduce((sum, r) => sum + (r.success ? r.count || 0 : 0), 0);

      // Show detailed results
      console.log('Import results:', importResults);
      
      if (successCount > 0) {
        // Invalidate cache to refresh UI
        queryClient.invalidateQueries({ queryKey: ['userProfileData', user.id] });
        
        toast.success(`Data imported successfully! ${totalItems} items restored from ${successCount} tables.`, {
          description: 'Your professional data has been restored. The page will refresh to show the data.'
        });
        
        // Force page refresh to ensure data shows
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const failedTables = importResults.filter(r => !r.success);
        const errorMessages = failedTables.map(r => `${r.table}: ${r.error}`).join('; ');
        
        toast.error('Import failed. Please check if you are properly logged in.', {
          description: 'All table inserts were rejected. Try logging out and back in.'
        });
        console.error('Import failed for all tables:', importResults);
        console.error('Error summary:', errorMessages);
      }

      return successCount > 0;
    } catch (error) {
      console.error('Import failed:', error);
      toast.error('Failed to import backup data');
      return false;
    } finally {
      setIsImporting(false);
    }
  };

  const createAutoBackup = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const backupData = await exportUserData();
      if (backupData) {
        // Store in localStorage as emergency backup
        localStorage.setItem(`chameleon-auto-backup-${user.id}`, backupData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auto backup failed:', error);
      return false;
    }
  };

  return {
    exportUserData,
    importUserData,
    createAutoBackup,
    isExporting,
    isImporting
  };
};