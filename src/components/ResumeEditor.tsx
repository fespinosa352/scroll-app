import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Copy, Download, Minimize, Maximize } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ResumeEditorProps {
  resumeId: string;
  onClose?: () => void;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resumeId, onClose }) => {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [availableExperiences, setAvailableExperiences] = useState([]);
  const [availableEducation, setAvailableEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    loadResumeAndAvailableData();
  }, [resumeId]);

  const loadResumeAndAvailableData = async () => {
    if (!user?.id) return;

    try {
      // Load current resume
      const { data: resumeData, error: resumeError } = await supabase
        .from('generated_resumes')
        .select('*')
        .eq('id', resumeId)
        .single();

      if (resumeError) throw resumeError;
      setResume(resumeData);

      // Load all user's work experiences
      const { data: workExp, error: workError } = await supabase
        .from('work_experiences')
        .select(`
          *,
          companies (name, industry)
        `)
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

      if (workError) throw workError;

      // Load all user's education
      const { data: education, error: eduError } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', user.id)
        .order('end_date', { ascending: false });

      if (eduError) throw eduError;

      // Filter out experiences already in resume
      const currentExpIds = resumeData.content?.workExperience?.map(exp => exp.id) || [];
      const availableExp = workExp.filter(exp => !currentExpIds.includes(exp.id));
      
      setAvailableExperiences(availableExp);
      setAvailableEducation(education);

    } catch (error) {
      console.error('Error loading resume data:', error);
      toast.error('Failed to load resume data');
    } finally {
      setLoading(false);
    }
  };

  const addExperienceToResume = async (experienceId) => {
    const exp = availableExperiences.find(e => e.id === experienceId);
    if (!exp || !resume) return;

    const updatedContent = {
      ...resume.content,
      workExperience: [
        ...(resume.content.workExperience || []),
        {
          id: exp.id,
          title: exp.title,
          company: exp.companies?.name || exp.company_name,
          duration: `${exp.start_date} - ${exp.end_date || 'Present'}`,
          location: exp.location,
          description: exp.description,
          bullets: exp.description ? exp.description.split('\n').filter(b => b.trim()) : []
        }
      ]
    };

    try {
      const { error } = await supabase
        .from('generated_resumes')
        .update({ content: updatedContent })
        .eq('id', resumeId);

      if (error) throw error;

      setResume(prev => ({ ...prev, content: updatedContent }));
      setAvailableExperiences(prev => prev.filter(e => e.id !== experienceId));
      toast.success('Experience added to resume!');
    } catch (error) {
      console.error('Error updating resume:', error);
      toast.error('Failed to add experience');
    }
  };

  const removeExperienceFromResume = async (experienceId) => {
    if (!resume) return;

    const expToRemove = resume.content.workExperience.find(exp => exp.id === experienceId);
    const updatedContent = {
      ...resume.content,
      workExperience: resume.content.workExperience.filter(exp => exp.id !== experienceId)
    };

    try {
      const { error } = await supabase
        .from('generated_resumes')
        .update({ content: updatedContent })
        .eq('id', resumeId);

      if (error) throw error;

      setResume(prev => ({ ...prev, content: updatedContent }));
      
      // Add back to available experiences (need to fetch full data)
      const { data: fullExp } = await supabase
        .from('work_experiences')
        .select(`*, companies (name, industry)`)
        .eq('id', experienceId)
        .single();
      
      if (fullExp) {
        setAvailableExperiences(prev => [...prev, fullExp]);
      }
      
      toast.success('Experience removed from resume');
    } catch (error) {
      console.error('Error updating resume:', error);
      toast.error('Failed to remove experience');
    }
  };

  const copyResumeToClipboard = () => {
    if (!resume) return;

    const content = resume.content;
    const text = `${content.personalInfo?.name || 'Your Name'}
${content.personalInfo?.email || 'your.email@example.com'} | ${content.personalInfo?.phone || '(555) 123-4567'}
${content.personalInfo?.location || 'Your City, State'}

PROFESSIONAL SUMMARY
${content.professionalSummary || 'Professional summary goes here...'}

CORE COMPETENCIES
${content.coreCompetencies?.join(', ') || 'Skills and competencies...'}

WORK EXPERIENCE
${content.workExperience?.map(exp => `
${exp.title} - ${exp.company}
${exp.duration}
${exp.location ? exp.location : ''}

${exp.bullets?.map(bullet => `• ${bullet}`).join('\n') || exp.description}
`).join('\n') || 'Work experience will appear here...'}

EDUCATION
${content.education?.map(edu => `${edu.degree} - ${edu.institution} (${edu.year})`).join('\n') || 'Education details...'}
`;

    navigator.clipboard.writeText(text);
    toast.success('Resume copied! Paste into Word, Canva, or any editor.');
  };

  const handleExport = (format: 'copy' | 'txt') => {
    if (format === 'copy') {
      copyResumeToClipboard();
      toast.success('🎉 Resume copied to clipboard! Paste into Word, Canva, or any editor.', {
        duration: 4000,
        description: 'Your optimized resume is ready to use!'
      });
    } else {
      // For txt download, we'll use the existing copyResumeToClipboard content but trigger download
      if (!resume) return;
      
      const content = resume.content;
      const text = `${content.personalInfo?.name || 'Your Name'}
${content.personalInfo?.email || 'your.email@example.com'} | ${content.personalInfo?.phone || '(555) 123-4567'}
${content.personalInfo?.location || 'Your City, State'}

PROFESSIONAL SUMMARY
${content.professionalSummary || 'Professional summary goes here...'}

CORE COMPETENCIES
${content.coreCompetencies?.join(', ') || 'Skills and competencies...'}

WORK EXPERIENCE
${content.workExperience?.map(exp => `
${exp.title} - ${exp.company}
${exp.duration}
${exp.location ? exp.location : ''}

${exp.bullets?.map(bullet => `• ${bullet}`).join('\n') || exp.description}
`).join('\n') || 'Work experience will appear here...'}

EDUCATION
${content.education?.map(edu => `${edu.degree} - ${edu.institution} (${edu.year})`).join('\n') || 'Education details...'}
`;

      // Create and trigger download
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resume.name || 'resume'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success('Resume downloaded successfully! 📄');
    }
  };

  if (loading) {
    return <div className='flex justify-center p-8'>Loading resume editor...</div>;
  }

  if (!resume) {
    return <div className='text-center p-8'>Resume not found</div>;
  }

  return (
    <div className='max-w-7xl mx-auto p-6'>
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-slate-900'>Resume Editor</h1>
          <p className='text-slate-600'>Write naturally with markup, get AI-powered ATS optimization</p>
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className='flex items-center space-x-3'>
          <Button
            onClick={() => handleExport('copy')}
            className='bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium px-6 py-3'
            size='lg'
          >
            <Copy className='w-5 h-5 mr-2' />
            Copy Final Resume
          </Button>
          <Button
            onClick={() => handleExport('txt')}
            variant='outline'
            className='px-4 py-3'
          >
            <Download className='w-4 h-4 mr-2' />
            Download
          </Button>
          <Button
            onClick={() => setIsFullscreen(!isFullscreen)}
            variant='outline'
            size='icon'
          >
            {isFullscreen ? <Minimize className='w-4 h-4' /> : <Maximize className='w-4 h-4' />}
          </Button>
          {onClose && (
            <Button onClick={onClose} variant='outline'>
              Close
            </Button>
          )}
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Current Resume Content */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Current Resume</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Professional Summary */}
              <div>
                <h3 className='font-semibold mb-2'>Professional Summary</h3>
                <p className='text-sm text-gray-700 bg-gray-50 p-3 rounded'>
                  {resume.content.professionalSummary}
                </p>
              </div>

              {/* Work Experience */}
              <div>
                <h3 className='font-semibold mb-2'>Work Experience</h3>
                <div className='space-y-4'>
                  {resume.content.workExperience?.map(exp => (
                    <div key={exp.id} className='border border-gray-200 rounded-lg p-4'>
                      <div className='flex justify-between items-start mb-2'>
                        <div>
                          <h4 className='font-medium'>{exp.title}</h4>
                          <p className='text-sm text-gray-600'>{exp.company} | {exp.duration}</p>
                        </div>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() => removeExperienceFromResume(exp.id)}
                          className='text-red-600 hover:text-red-700'
                        >
                          <X className='w-4 h-4' />
                        </Button>
                      </div>
                      <div className='text-sm text-gray-700'>
                        {exp.bullets?.map((bullet, idx) => (
                          <p key={idx} className='mb-1'>• {bullet}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Available Items to Add */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle>Available to Add</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Available Work Experience */}
              <div>
                <h4 className='font-medium mb-2'>Work Experience</h4>
                <div className='space-y-2'>
                  {availableExperiences.map(exp => (
                    <div key={exp.id} className='border border-gray-200 rounded p-3'>
                      <div className='flex justify-between items-start mb-2'>
                        <div className='flex-1'>
                          <p className='font-medium text-sm'>{exp.title}</p>
                          <p className='text-xs text-gray-600'>{exp.companies?.name || exp.company_name}</p>
                          <p className='text-xs text-gray-500'>{exp.start_date} - {exp.end_date || 'Present'}</p>
                        </div>
                        <Button
                          size='sm'
                          onClick={() => addExperienceToResume(exp.id)}
                          className='bg-green-600 hover:bg-green-700'
                        >
                          <Plus className='w-4 h-4' />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {availableExperiences.length === 0 && (
                    <p className='text-sm text-gray-500'>All experiences are already in the resume</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export { ResumeEditor };
export default ResumeEditor;