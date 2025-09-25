import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, FileText, Eye, HelpCircle, X } from 'lucide-react';
import { ResumeEditor } from '@/components/ResumeEditor';

const WorkflowStepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, title: 'Paste Job', icon: '📋' },
    { number: 2, title: 'Analyze', icon: '🔍' },
    { number: 3, title: 'Edit Resume', icon: '✏️' },
    { number: 4, title: 'Copy & Use', icon: '📄' }
  ];

  return (
    <div className='flex items-center justify-center mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg'>
      <div className='flex items-center space-x-4'>
        {steps.map((step, index) => (
          <React.Fragment key={step.number}>
            <div className='flex items-center space-x-2'>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                currentStep >= step.number 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : currentStep === step.number - 0.5
                  ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-600'
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step.number ? '✓' : step.number}
              </div>
              <div className={`text-sm font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                <div className='text-xs opacity-75'>{step.icon}</div>
                {step.title}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-12 h-1 rounded transition-all duration-300 ${
                currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
              }`}></div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const JobAnalyzer = () => {
  const { user } = useAuth();
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [recentlyCreatedResumeId, setRecentlyCreatedResumeId] = useState(null);
  const [showResumeEditor, setShowResumeEditor] = useState(false);
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.error('Please paste a job description to analyze');
      return;
    }

    setCurrentStep(1.5); // Show analyzing state
    setIsAnalyzing(true);
    
    try {
      // Existing analysis logic (placeholder)
      await new Promise(resolve => setTimeout(resolve, 1500));
      const analysisResult = {
        matched_skills: ['JavaScript', 'React', 'Node.js'],
        missing_skills: ['Python', 'AWS'],
        key_requirements: ['3+ years experience', 'Bachelor\'s degree']
      };

      setCurrentStep(2); // Show analysis complete
      setAnalysis(analysisResult);

      // Save to job staging table
      if (user) {
        const { data: stagedJob, error: stagingError } = await (supabase as any)
          .from('job_staging')
          .insert({
            user_id: user.id,
            job_title: jobTitle || 'Untitled Job',
            company: company || 'Unknown Company',
            job_description: jobDescription,
            extracted_keywords: {
              skills: analysisResult.matched_skills.concat(analysisResult.missing_skills),
              requirements: analysisResult.key_requirements
            },
            status: 'analyzed'
          })
          .select()
          .single();

        if (stagingError) {
          console.error('Error staging job:', stagingError);
        } else {
          console.log('Job staged successfully:', stagedJob);
        }
      }

      toast.success('Job analysis completed and saved!');
      
      // At the end of try block, add:
      setTimeout(() => setCurrentStep(2.5), 500); // Ready for next step
      
    } catch (error) {
      toast.error('Analysis failed. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateResumeFromAnalysis = async (analysis: any) => {
    if (!user?.id || !analysis) {
      toast.error('Please complete job analysis first');
      return null;
    }

    try {
      // Create a new resume based on the analysis
      const { data: newResume, error } = await supabase
        .from('generated_resumes')
        .insert({
          user_id: user.id,
          name: `Resume for ${jobTitle || 'Job'} at ${company || 'Company'}`,
          content: {
            personalInfo: {
              name: 'Your Name',
              email: 'your.email@example.com',
              phone: '(555) 123-4567',
              location: 'Your City, State'
            },
            professionalSummary: `Experienced professional with expertise in ${analysis.matched_skills.slice(0, 3).join(', ')}. Seeking to leverage skills in ${analysis.matched_skills.join(', ')} to contribute to ${company || 'a dynamic organization'}.`,
            coreCompetencies: analysis.matched_skills,
            workExperience: [],
            education: []
          },
          job_title: jobTitle,
          company: company,
          ats_score: 75 // Default score
        })
        .select()
        .single();

      if (error) throw error;
      return newResume;
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error('Failed to generate resume');
      return null;
    }
  };

  const handleGenerateAndEditResume = async () => {
    setCurrentStep(3);
    const newResume = await generateResumeFromAnalysis(analysis);
    if (newResume) {
      setGeneratedResumeId(newResume.id);
      setShowResumeEditor(true);
      setCurrentStep(3.5); // In editing mode
      toast.success('Resume generated! Now customize it by adding/removing experiences.');
    }
  };

  const handleGenerateResume = async () => {
    // Placeholder for resume generation
    console.log('Generating resume...');
    toast.success('Resume generated successfully!');
    setRecentlyCreatedResumeId('sample-resume-id');
  };

  const handleNavigateToVault = () => {
    console.log('Navigating to vault...');
    toast.info('Vault navigation - to be implemented');
  };

  return (
    <div className='space-y-6'>
      <WorkflowStepper currentStep={currentStep} />
      
      {currentStep === 4 && (
        <Card className='border-green-200 bg-gradient-to-r from-green-50 to-blue-50'>
          <CardContent className='text-center py-8'>
            <div className='text-6xl mb-4'>🎉</div>
            <h2 className='text-2xl font-bold text-green-800 mb-2'>Resume Optimized Successfully!</h2>
            <p className='text-green-700 mb-4'>
              Your ATS-optimized resume is ready. You can now paste it into Word, Canva, or any editor.
            </p>
            <div className='flex justify-center gap-3'>
              <Button 
                onClick={() => {
                  setCurrentStep(1);
                  setAnalysis(null);
                  setJobDescription('');
                  setJobTitle('');
                  setCompany('');
                }}
                className='bg-blue-600 hover:bg-blue-700'
              >
                Optimize Another Job
              </Button>
              <Button 
                onClick={() => setShowResumeEditor(true)}
                variant='outline'
              >
                Re-edit Resume
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Job Analyzer</h1>
        
        <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Job Title</label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="e.g., Senior Software Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="e.g., Google, Microsoft"
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium">Job Description</label>
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none w-64 z-10">
                <div className="text-center">
                  <div className="font-semibold mb-1">💡 Pro Tips for Better Analysis</div>
                  <div className="text-left space-y-1">
                    <div>• Include the full job posting (responsibilities, requirements, etc.)</div>
                    <div>• Don't just paste the summary - we need the details!</div>
                    <div>• Include company info if available</div>
                    <div>• Skills sections are especially important</div>
                  </div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            </div>
          </div>
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-lg resize-none"
            placeholder={`Paste the complete job description here...

Example:
"Senior Software Engineer - Full Stack
Company: TechCorp
Location: San Francisco, CA

We are seeking a Senior Software Engineer to join our growing team...

Requirements:
• 5+ years of experience with React and Node.js
• Experience with AWS cloud services
• Strong problem-solving skills
• Bachelor's degree in Computer Science

Responsibilities:
• Develop and maintain web applications
• Collaborate with cross-functional teams
• Mentor junior developers

Benefits:
• Competitive salary and equity
• Health insurance
• Remote work options"`}
          />
          <div className="mt-2 text-xs text-gray-500">
            💡 <strong>Tip:</strong> The more complete the job description, the better our AI can optimize your resume for ATS systems and highlight relevant experience.
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Job'}
        </button>
        </div>

        {/* Enhanced Analysis Results Section */}
        {analysis && (
          <Card className='border-green-200 bg-green-50'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-800'>
                <CheckCircle className='w-5 h-5' />
                Analysis Complete!
              </CardTitle>
              <CardDescription className='text-green-700'>
                Your job has been analyzed. Ready to generate your optimized resume?
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Quick Analysis Summary */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='text-center p-3 bg-white rounded-lg'>
                  <div className='text-lg font-bold text-blue-600'>{analysis.matched_skills.length}</div>
                  <div className='text-sm text-gray-600'>Skills Matched</div>
                </div>
                <div className='text-center p-3 bg-white rounded-lg'>
                  <div className='text-lg font-bold text-orange-600'>{analysis.missing_skills.length}</div>
                  <div className='text-sm text-gray-600'>Skills to Add</div>
                </div>
                <div className='text-center p-3 bg-white rounded-lg'>
                  <div className='text-lg font-bold text-green-600'>{analysis.key_requirements.length}</div>
                  <div className='text-sm text-gray-600'>Requirements Found</div>
                </div>
              </div>

              {/* Primary Actions */}
              <div className='flex flex-col sm:flex-row gap-3 pt-4'>
                <Button 
                  onClick={handleGenerateAndEditResume}
                  className='flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-medium py-3'
                  size='lg'
                >
                  <FileText className='w-5 h-5 mr-2' />
                  Generate & Edit Resume
                </Button>
                <Button 
                  onClick={() => setShowDetailedAnalysis(!showDetailedAnalysis)}
                  variant='outline'
                  className='flex-1 sm:flex-none'
                >
                  <Eye className='w-4 h-4 mr-2' />
                  {showDetailedAnalysis ? 'Hide' : 'View'} Details
                </Button>
              </div>

              {/* Detailed Analysis (collapsible) */}
              {showDetailedAnalysis && (
                <div className='mt-4 p-4 bg-white rounded-lg border'>
                  <div className='space-y-4'>
                    <div>
                      <h4 className='font-semibold mb-2'>Matched Skills</h4>
                      <div className='flex flex-wrap gap-2'>
                        {analysis.matched_skills.map((skill, idx) => (
                          <span key={idx} className='px-2 py-1 bg-green-100 text-green-800 rounded text-sm'>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className='font-semibold mb-2'>Skills to Add</h4>
                      <div className='flex flex-wrap gap-2'>
                        {analysis.missing_skills.map((skill, idx) => (
                          <span key={idx} className='px-2 py-1 bg-orange-100 text-orange-800 rounded text-sm'>
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className='font-semibold mb-2'>Key Requirements</h4>
                      <ul className='list-disc list-inside space-y-1'>
                        {analysis.key_requirements.map((req, idx) => (
                          <li key={idx} className='text-sm text-gray-700'>{req}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resume Editor Modal/Overlay */}
      {showResumeEditor && generatedResumeId && (
        <div className='fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4'>
          <div className='bg-white rounded-xl w-full max-w-7xl h-[90vh] overflow-hidden flex flex-col'>
            <div className='p-4 border-b flex items-center justify-between'>
              <div>
                <h2 className='text-xl font-bold'>Customize Your Resume</h2>
                <p className='text-gray-600'>Add or remove experiences, then copy your final resume</p>
              </div>
              <Button
                onClick={() => {
                  setShowResumeEditor(false);
                  setCurrentStep(4); // Completed
                }}
                variant='outline'
              >
                <X className='w-4 h-4 mr-2' />
                Done Editing
              </Button>
            </div>
            <div className='flex-1 overflow-auto p-4'>
              <ResumeEditor 
                resumeId={generatedResumeId}
                onClose={() => setShowResumeEditor(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobAnalyzer;