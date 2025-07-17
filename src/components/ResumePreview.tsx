import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StructuredResumeData } from '@/hooks/useMarkupConverter';

interface ResumePreviewProps {
  structuredData: StructuredResumeData | null;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ structuredData }) => {
  if (!structuredData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-slate-500 py-8">
            Start typing to see your resume preview
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none bg-white p-8 border border-slate-200 rounded-lg">
          {structuredData.personalInfo?.name && (
            <div className="text-center border-b pb-4 mb-6">
              <h1 className="text-2xl font-bold mb-2">{structuredData.personalInfo.name}</h1>
              <div className="space-y-1 text-sm text-slate-600">
                {structuredData.personalInfo.email && <div>{structuredData.personalInfo.email}</div>}
                {structuredData.personalInfo.phone && <div>{structuredData.personalInfo.phone}</div>}
                {structuredData.personalInfo.linkedin && <div>{structuredData.personalInfo.linkedin}</div>}
              </div>
            </div>
          )}

          {structuredData.experienceBullets?.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-slate-800">Professional Experience</h2>
              <div className="space-y-6">
                {structuredData.experienceBullets.map((exp, idx) => (
                  <div key={idx}>
                    <h3 className="font-semibold text-lg text-slate-900">{exp.position}</h3>
                    {exp.company && <div className="font-medium text-slate-700 mb-2">{exp.company}</div>}
                    {exp.bullets?.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 text-slate-700">
                        {exp.bullets.map((bullet, bulletIdx) => (
                          <li key={bulletIdx}>{bullet}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};