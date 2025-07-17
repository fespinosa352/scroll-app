import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useResumeData } from "@/contexts/ResumeDataContext";
import { Briefcase, GraduationCap, Award, Calendar, MapPin, Building, Edit, FileText, Trophy, Target } from "lucide-react";
import { formatDateRange, formatDateForDisplay } from "@/lib/dateUtils";
import WorkExperienceBlocks from "./WorkExperienceBlocks";
import Education from "./Education";
import Certifications from "./Certifications";
import UserSkills from "./UserSkills";
import { useProjects } from "@/hooks/useProjects";
import { useJobAnalysis } from "@/hooks/useJobAnalysis";

const MyResume = () => {
  const { 
    workExperience, 
    workExperienceBlocks, 
    personalInfo, 
    education, 
    certifications, 
    skills 
  } = useResumeData();
  
  const { projects } = useProjects();
  const { userSkills } = useJobAnalysis();

  const [editingSection, setEditingSection] = useState<'work' | 'education' | 'certifications' | 'skills' | null>(null);

  const hasAnyData = personalInfo || workExperience.length > 0 || education.length > 0 || certifications.length > 0 || skills.length > 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-slate-900">My Resume</h1>
        <p className="text-lg text-slate-600">
          {hasAnyData 
            ? "A comprehensive view of your professional profile and experience"
            : "Upload your resume in the Get Started section to see your parsed data here"
          }
        </p>
      </div>

      {/* Data Status */}
      {!hasAnyData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Resume Data Found</h3>
              <p className="text-slate-600 mb-4">
                Upload your resume in the "Get Started" section to automatically populate this page with your professional information.
              </p>
              <Button 
                variant="outline" 
                onClick={() => window.location.hash = '#getting-started'}
              >
                Go to Get Started
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personal Information */}
      {personalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{personalInfo.name}</h3>
                <p className="text-slate-600">{personalInfo.email}</p>
              </div>
              <div>
                <p className="text-slate-600">{personalInfo.phone}</p>
                <p className="text-slate-600 flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {personalInfo.location}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Experience */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Work Experience
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditingSection('work')}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workExperience.length > 0 ? (
            <div className="space-y-6">
              {workExperience.map((exp, index) => (
                <div key={exp.id} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{exp.position}</h3>
                        <p className="text-slate-700 font-medium">{exp.company}</p>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(exp.startDate, exp.endDate, exp.isCurrentRole)}
                      </div>
                    </div>
                    {exp.description && (
                      <div className="text-slate-600 leading-relaxed">
                        {exp.description.split('\n').map((line, i) => (
                          <p key={i} className="mb-2">{line}</p>
                        ))}
                      </div>
                    )}
                    {exp.skills && exp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {exp.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No work experience added yet</p>
              <p className="text-sm text-slate-400 mt-2">
                Use the Quick Launch tiles or Get Started module to add your experience
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievements & Wins */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Achievements & Wins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects.length > 0 ? (
            <div className="space-y-6">
              {projects.map((project, index) => (
                <div key={project.id} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {project.title.replace('Win - ', '')}
                        </h3>
                        {project.work_experiences && (
                          <p className="text-slate-700 font-medium">
                            {project.work_experiences.company_name || 'Unknown Company'}
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {project.start_date ? formatDateForDisplay(project.start_date) : 'No date'}
                      </div>
                    </div>
                    <div className="text-slate-600 leading-relaxed">
                      <p>{project.description}</p>
                    </div>
                    {project.impact_metrics && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">
                          Impact: {project.impact_metrics}
                        </span>
                      </div>
                    )}
                    {project.technologies_used && project.technologies_used.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies_used.map((tech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Trophy className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No achievements logged yet</p>
              <p className="text-sm text-slate-400 mt-2">
                Use the "+ Log Wins" button on the dashboard to add your achievements
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Education
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditingSection('education')}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {education.length > 0 ? (
            <div className="space-y-6">
              {education.map((edu, index) => (
                <div key={edu.id} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{edu.degree}</h3>
                        <p className="text-slate-700 font-medium">{edu.institution}</p>
                        {edu.fieldOfStudy && (
                          <p className="text-slate-600">{edu.fieldOfStudy}</p>
                        )}
                      </div>
                      <div className="text-sm text-slate-500 flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateRange(edu.startDate, edu.endDate, edu.isCurrentlyEnrolled)}
                      </div>
                    </div>
                    {edu.gpa && (
                      <p className="text-slate-600">GPA: {edu.gpa}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <GraduationCap className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No education added yet</p>
              <p className="text-sm text-slate-400 mt-2">
                Use the Quick Launch tiles or Get Started module to add your education
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Certifications
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setEditingSection('certifications')}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {certifications.length > 0 ? (
            <div className="space-y-6">
              {certifications.map((cert, index) => (
                <div key={cert.id} className="space-y-3">
                  {index > 0 && <Separator />}
                  <div className="space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{cert.name}</h3>
                        <p className="text-slate-700 font-medium">{cert.issuer}</p>
                      </div>
                      <div className="text-sm text-slate-500">
                        {cert.issueDate && (
                          <p className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Issued: {formatDateForDisplay(cert.issueDate)}
                          </p>
                        )}
                        {cert.expiryDate && !cert.doesNotExpire && (
                          <p className="text-red-600">
                            Expires: {formatDateForDisplay(cert.expiryDate)}
                          </p>
                        )}
                        {cert.doesNotExpire && (
                          <p className="text-green-600">No expiration</p>
                        )}
                      </div>
                    </div>
                    {cert.credentialId && (
                      <p className="text-slate-600 text-sm">
                        Credential ID: {cert.credentialId}
                      </p>
                    )}
                    {cert.credentialUrl && (
                      <a 
                        href={cert.credentialUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Credential
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No certifications added yet</p>
              <p className="text-sm text-slate-400 mt-2">
                Use the Quick Launch tiles to add your certifications
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills Summary */}
      {(skills.length > 0 || userSkills.length > 0) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Skills Summary</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setEditingSection('skills')}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Skills from resume parsing */}
              {skills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">From Resume</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* User-defined skills with proficiency levels */}
              {userSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">Detailed Skills</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {userSkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="font-medium">{skill.skill_name}</span>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={skill.proficiency_level === 'expert' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {skill.proficiency_level}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {skill.years_experience}yr{skill.years_experience !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modals */}
      <Dialog open={editingSection === 'work'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Work Experience</DialogTitle>
          </DialogHeader>
          <WorkExperienceBlocks />
        </DialogContent>
      </Dialog>

      <Dialog open={editingSection === 'education'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Education</DialogTitle>
          </DialogHeader>
          <Education />
        </DialogContent>
      </Dialog>

      <Dialog open={editingSection === 'certifications'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Certifications</DialogTitle>
          </DialogHeader>
          <Certifications />
        </DialogContent>
      </Dialog>

      <Dialog open={editingSection === 'skills'} onOpenChange={(open) => !open && setEditingSection(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Skills</DialogTitle>
          </DialogHeader>
          <UserSkills />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyResume;