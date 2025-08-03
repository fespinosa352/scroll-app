import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Circle, ChevronRight, ChevronLeft, User, Briefcase, GraduationCap, Award, Target, FileText, Calendar, MapPin, Building, Users } from 'lucide-react';
import { useUserProfileData } from '@/hooks/useUserProfileData';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

interface Project {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
}

const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Website Redesign',
    description: 'Revamp the company website for a modern look and improved user experience.',
    tasks: [
      { id: '1-1', title: 'Design Mockups', description: 'Create initial design concepts.', completed: true },
      { id: '1-2', title: 'Develop Frontend', description: 'Implement the new design using React.', completed: false },
      { id: '1-3', title: 'Backend Integration', description: 'Connect the frontend to the existing backend.', completed: false },
    ],
  },
  {
    id: '2',
    name: 'Mobile App Development',
    description: 'Develop a mobile app for iOS and Android platforms.',
    tasks: [
      { id: '2-1', title: 'Plan App Features', description: 'Define the core features of the app.', completed: true },
      { id: '2-2', title: 'Design UI/UX', description: 'Create wireframes and mockups for the app.', completed: true },
      { id: '2-3', title: 'Develop iOS Version', description: 'Build the app for iOS devices.', completed: false },
      { id: '2-4', title: 'Develop Android Version', description: 'Build the app for Android devices.', completed: false },
    ],
  },
];

const GettingStarted = () => {
  console.log('GettingStarted component rendering');
  console.log('ChevronRight import:', ChevronRight);
  
  const [activeStep, setActiveStep] = useState('about');
  const { data, isLoading, error } = useUserProfileData();
  const { user } = useAuth();
  const [projects, setProjects] = useState(sampleProjects);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
  };

  const handleTaskToggle = (projectId: string, taskId: string) => {
    setProjects(projects.map(project => {
      if (project.id === projectId) {
        return {
          ...project,
          tasks: project.tasks.map(task => {
            if (task.id === taskId) {
              return { ...task, completed: !task.completed };
            }
            return task;
          })
        };
      }
      return project;
    }));
  };

  const steps = [
    { 
      id: 'about', 
      title: 'About You', 
      icon: User, 
      completed: !!data?.display_name && !!data?.bio,
      description: 'Tell us about yourself'
    },
    { 
      id: 'work', 
      title: 'Work Experience', 
      icon: Briefcase, 
      completed: (data?.work_experiences?.length || 0) > 0,
      description: 'Add your professional background'
    },
    { 
      id: 'education', 
      title: 'Education', 
      icon: GraduationCap, 
      completed: (data?.education?.length || 0) > 0,
      description: 'Share your educational background'
    },
    { 
      id: 'certifications', 
      title: 'Certifications', 
      icon: Award, 
      completed: (data?.certifications?.length || 0) > 0,
      description: 'List your professional certifications'
    },
    { 
      id: 'skills', 
      title: 'Skills', 
      icon: Target, 
      completed: (data?.user_skills?.length || 0) > 0,
      description: 'Highlight your key competencies'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Getting Started</h1>
        <p className="text-muted-foreground">Complete your professional profile to unlock powerful resume tools</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          console.log(`Rendering step ${index}: ${step.title}`);
          return (
            <div key={step.id} className="flex items-center flex-shrink-0">
              <div 
                className={`flex items-center space-x-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeStep === step.id 
                    ? 'bg-primary/10 text-primary' 
                    : step.completed 
                      ? 'text-green-600' 
                      : 'text-muted-foreground hover:text-foreground'
                }`}
                onClick={() => setActiveStep(step.id)}
              >
                <div className="flex items-center justify-center">
                  {step.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                <span className="hidden md:block">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="mx-3">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                  {console.log('Rendering ChevronRight between steps')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Content Section */}
      <Card>
        <CardHeader>
          <CardTitle>{steps.find(step => step.id === activeStep)?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {activeStep === 'about' && (
            <div className="space-y-4">
              <p>Welcome! Let's start with some basic information about you.</p>
              <p>Display Name: {data?.display_name || 'Not set'}</p>
              <p>Bio: {data?.bio || 'Not set'}</p>
              <Button>Edit Profile</Button>
            </div>
          )}
          {activeStep === 'work' && (
            <div className="space-y-4">
              <p>Share your work experience to showcase your professional background.</p>
              {data?.work_experiences?.length > 0 ? (
                <ul>
                  {data.work_experiences.map(exp => (
                    <li key={exp.id}>
                      {exp.title} at {exp.company_name} ({format(new Date(exp.start_date), 'MMM yyyy')} - {exp.is_current ? 'Present' : format(new Date(exp.end_date || exp.start_date), 'MMM yyyy')})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No work experience added yet.</p>
              )}
              <Button>Add Work Experience</Button>
            </div>
          )}
          {activeStep === 'education' && (
            <div className="space-y-4">
              <p>Add your educational background to highlight your academic achievements.</p>
              {data?.education?.length > 0 ? (
                <ul>
                  {data.education.map(edu => (
                    <li key={edu.id}>
                      {edu.degree} in {edu.field_of_study} from {edu.institution}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No education added yet.</p>
              )}
              <Button>Add Education</Button>
            </div>
          )}
          {activeStep === 'certifications' && (
            <div className="space-y-4">
              <p>List your professional certifications to demonstrate your expertise.</p>
              {data?.certifications?.length > 0 ? (
                <ul>
                  {data.certifications.map(cert => (
                    <li key={cert.id}>
                      {cert.name} from {cert.issuing_organization}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No certifications added yet.</p>
              )}
              <Button>Add Certification</Button>
            </div>
          )}
          {activeStep === 'skills' && (
            <div className="space-y-4">
              <p>Highlight your key competencies and skills.</p>
              {data?.user_skills?.length > 0 ? (
                <ul>
                  {data.user_skills.map(skill => (
                    <li key={skill.id}>
                      {skill.skill_name} ({skill.proficiency_level})
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No skills added yet.</p>
              )}
              <Button>Add Skill</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GettingStarted;
