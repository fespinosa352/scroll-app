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
    console.log('Starting resume suggestions generation...');

    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth header for the supabase client
    supabase.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: '',
    });

    // Get user from auth header
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated:', user.id);

    // Get request data
    const { targetRole, jobDescription } = await req.json();

    // Fetch user's professional data
    console.log('Fetching user professional data...');
    
    const [workExperienceRes, skillsRes, educationRes, certificationsRes] = await Promise.all([
      supabase.from('work_experiences').select('*').eq('user_id', user.id),
      supabase.from('user_skills').select('*').eq('user_id', user.id),
      supabase.from('education').select('*').eq('user_id', user.id),
      supabase.from('certifications').select('*').eq('user_id', user.id)
    ]);

    if (workExperienceRes.error) {
      console.error('Work experience fetch error:', workExperienceRes.error);
      throw new Error('Failed to fetch work experience');
    }

    console.log('Professional data fetched successfully');

    // Build context for Claude
    const workExperience = workExperienceRes.data || [];
    const skills = skillsRes.data || [];
    const education = educationRes.data || [];
    const certifications = certificationsRes.data || [];

    // Create rich context string
    let context = `Professional Background:\n\n`;
    
    if (workExperience.length > 0) {
      context += `Work Experience:\n`;
      workExperience.forEach(exp => {
        context += `- ${exp.title} at ${exp.company_name || exp.company_id} (${exp.start_date} - ${exp.is_current ? 'Present' : exp.end_date})\n`;
        if (exp.description) context += `  Description: ${exp.description}\n`;
        if (exp.location) context += `  Location: ${exp.location}\n`;
      });
      context += `\n`;
    }

    if (skills.length > 0) {
      context += `Skills:\n`;
      skills.forEach(skill => {
        context += `- ${skill.skill_name}`;
        if (skill.proficiency_level) context += ` (${skill.proficiency_level})`;
        if (skill.years_experience) context += ` - ${skill.years_experience} years`;
        context += `\n`;
      });
      context += `\n`;
    }

    if (education.length > 0) {
      context += `Education:\n`;
      education.forEach(edu => {
        context += `- ${edu.degree} in ${edu.field_of_study || 'N/A'} from ${edu.institution}\n`;
      });
      context += `\n`;
    }

    if (certifications.length > 0) {
      context += `Certifications:\n`;
      certifications.forEach(cert => {
        context += `- ${cert.name} from ${cert.issuing_organization}\n`;
      });
      context += `\n`;
    }

    // Add target role context
    if (targetRole) {
      context += `Target Role: ${targetRole}\n\n`;
    }

    if (jobDescription) {
      context += `Job Description/Requirements:\n${jobDescription}\n\n`;
    }

    console.log('Sending request to Claude...');

    // Call Claude API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: `Based on the following professional background, generate 6-8 personalized resume bullet points that would be compelling for the target role. Each bullet point should:

1. Start with a strong action verb
2. Include specific, quantifiable metrics when possible (you can suggest realistic ranges based on the role level)
3. Highlight relevant skills and technologies from their background
4. Be tailored to the target role and industry
5. Follow the format: "Action verb + what you did + quantifiable result/impact"
6. Be professional and impactful
7. Vary the action verbs used

${context}

Please generate bullet points that feel authentic to this person's background while being optimized for their target role. Focus on achievements that would resonate with hiring managers in their target industry.

Return only the bullet points, one per line, without numbers or additional formatting.`
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
    console.log('Claude response received');

    if (!data.content || !data.content[0] || !data.content[0].text) {
      throw new Error('Invalid response format from Claude');
    }

    // Parse the bullet points
    const suggestions = data.content[0].text
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 8); // Limit to 8 suggestions

    console.log('Generated suggestions:', suggestions.length);

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-resume-suggestions function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate suggestions', 
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});