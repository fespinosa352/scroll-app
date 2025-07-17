import React from 'react';

export const MarkupGuide: React.FC = () => {
  return (
    <div className="mt-3 text-xs text-slate-500 space-y-1">
      <p><strong>Quick Guide:</strong></p>
      <p>• Use <code># Name</code> for your header</p>
      <p>• Use <code>## Section</code> for main sections</p>
      <p>• Use <code>### Job Title</code> for positions</p>
      <p>• Use <code>**Company**</code> for company names</p>
      <p>• Use <code>- Achievement</code> for bullet points</p>
    </div>
  );
};