import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting optimized summary generation...');

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // Get request data
    const { userData, jobAnalysis, targetRole, jobDescription } = await req.json();

    if (!userData || !jobAnalysis) {
      throw new Error('Missing required data: userData and jobAnalysis');
    }

    console.log('Processing summary optimization for role:', targetRole);

    // Build context from user's actual resume data
    let context = `User's Professional Background:\n\n`;
    
    // Work Experience
    if (userData.workExperience && userData.workExperience.length > 0) {
      context += `Work Experience:\n`;
      userData.workExperience.forEach((exp: any) => {
        context += `- ${exp.position} at ${exp.company}`;
        if (exp.startDate) {
          const start = new Date(exp.startDate).getFullYear();
          const end = exp.isCurrentRole ? 'Present' : (exp.endDate ? new Date(exp.endDate).getFullYear() : '');
          context += ` (${start} - ${end})`;
        }
        context += `\n`;
        if (exp.description) {
          // Extract key achievements from description
          const achievements = exp.description.split('\n').filter((line: string) => line.trim()).slice(0, 2);
          achievements.forEach((achievement: string) => {
            context += `  • ${achievement.replace(/^[•\-*]\s*/, '')}\n`;
          });
        }
      });
      context += `\n`;
    }

    // Skills
    if (userData.skills && userData.skills.length > 0) {
      context += `Key Skills: ${userData.skills.slice(0, 15).join(', ')}\n\n`;
    }

    // Education
    if (userData.education && userData.education.length > 0) {
      context += `Education:\n`;
      userData.education.forEach((edu: any) => {
        context += `- ${edu.degree}`;
        if (edu.fieldOfStudy) context += ` in ${edu.fieldOfStudy}`;
        context += ` from ${edu.institution}\n`;
      });
      context += `\n`;
    }

    // Certifications
    if (userData.certifications && userData.certifications.length > 0) {
      context += `Certifications: ${userData.certifications.map((cert: any) => cert.name).join(', ')}\n\n`;
    }

    // Job Analysis Context
    context += `Target Role: ${targetRole}\n`;
    context += `Job Match Score: ${jobAnalysis.match_score}%\n`;
    if (jobAnalysis.matched_skills && jobAnalysis.matched_skills.length > 0) {
      context += `Matched Skills: ${jobAnalysis.matched_skills.join(', ')}\n`;
    }
    if (jobAnalysis.key_requirements && jobAnalysis.key_requirements.length > 0) {
      context += `Key Job Requirements:\n${jobAnalysis.key_requirements.map((req: string) => `- ${req}`).join('\n')}\n`;
    }
    context += `\n`;

    // Add relevant job description excerpts
    if (jobDescription) {
      const shortJobDesc = jobDescription.length > 1000 ? jobDescription.substring(0, 1000) + '...' : jobDescription;
      context += `Job Description Summary:\n${shortJobDesc}\n\n`;
    }

    console.log('Sending request to Claude for summary optimization...');

    // Call Claude API for optimized summary
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 800,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `Based on the following professional background and target job information, create an optimized professional summary that will maximize ATS scores and appeal to hiring managers.

${context}

Create a professional summary that:
1. Is 3-4 sentences long (approximately 80-120 words)
2. Highlights the most relevant experience and skills for the target role
3. Includes specific years of experience and key achievements
4. Uses keywords from the job requirements and matched skills
5. Demonstrates value proposition and impact
6. Sounds natural and professional, not robotic
7. Positions the candidate as an ideal fit for the specific role

Focus on the candidate's strongest, most relevant qualifications that align with the job requirements. Use quantifiable achievements where possible based on their background.

Return only the optimized professional summary text, without any additional formatting or explanations.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Claude response received for summary optimization');

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude');
    }

    const optimizedSummary = data.content[0].text.trim();
    console.log('Generated optimized summary length:', optimizedSummary.length);

    return new Response(
      JSON.stringify({ optimizedSummary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-optimized-summary function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate optimized summary', 
        details: error instanceof Error ? error.message : 'An error occurred'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});