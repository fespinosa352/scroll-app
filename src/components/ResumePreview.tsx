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

          {structuredData.sections?.map((section, idx) => {
            // Group consecutive bullet points together
            const groupedContent: Array<{ type: 'bullets', items: string[] } | { type: 'single', item: string }> = [];
            let currentBullets: string[] = [];
            
            section.content.forEach((item, itemIdx) => {
              if (item.startsWith('- ')) {
                currentBullets.push(item.substring(2));
              } else {
                // If we have accumulated bullets, add them as a group
                if (currentBullets.length > 0) {
                  groupedContent.push({ type: 'bullets', items: [...currentBullets] });
                  currentBullets = [];
                }
                groupedContent.push({ type: 'single', item });
              }
            });
            
            // Don't forget remaining bullets
            if (currentBullets.length > 0) {
              groupedContent.push({ type: 'bullets', items: currentBullets });
            }

            return (
              <div key={idx} className="mt-6">
                <h2 className="text-xl font-semibold mb-4 text-slate-800">{section.title}</h2>
                <div className="space-y-3">
                  {groupedContent.map((group, groupIdx) => {
                    if (group.type === 'bullets') {
                      return (
                        <ul key={groupIdx} className="list-disc list-inside ml-4 space-y-1">
                          {group.items.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="text-slate-700">{bullet}</li>
                          ))}
                        </ul>
                      );
                    } else {
                      const item = group.item;
                      // Handle different content types
                      if (item.startsWith('### ')) {
                        // Sub-headings (like degree titles)
                        return (
                          <h3 key={groupIdx} className="font-semibold text-lg text-slate-900 mt-4 mb-1">
                            {item.substring(4)}
                          </h3>
                        );
                      } else if (item.startsWith('**') && item.endsWith('**')) {
                        // Bold text (like institution names or company names)
                        // Check if this is in certifications section and if the previous item was a bullet
                        const isCertificationSection = section.title.toLowerCase().includes('certification');
                        const prevGroup = groupedContent[groupIdx - 1];
                        const isAfterBullet = prevGroup && prevGroup.type === 'bullets';
                        
                        if (isCertificationSection && isAfterBullet) {
                          // Indent company name similar to Work Experience
                          return (
                            <div key={groupIdx} className="font-medium text-slate-700 mb-2 ml-6">
                              {item.slice(2, -2)}
                            </div>
                          );
                        } else {
                          // Regular bold text (like institution names)
                          return (
                            <div key={groupIdx} className="font-semibold text-slate-800 mb-1">
                              {item.slice(2, -2)}
                            </div>
                          );
                        }
                      } else if (item.startsWith('*') && item.endsWith('*')) {
                        // Italic text (like dates)
                        return (
                          <div key={groupIdx} className="italic text-slate-600 text-sm mb-2">
                            {item.slice(1, -1)}
                          </div>
                        );
                      } else {
                        // Regular text
                        return (
                          <div key={groupIdx} className="text-slate-700">
                            {item}
                          </div>
                        );
                      }
                    }
                  })}
                </div>
              </div>
            );
           })}
        </div>
      </CardContent>
    </Card>
  );
};