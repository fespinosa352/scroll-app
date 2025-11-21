import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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
    if (!anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }

    const { jobDescription, jobTitle, company, userId } = await req.json();

    if (!jobDescription) {
      throw new Error('Job description is required');
    }

    const systemPrompt = `You are an expert job description analyzer. Your job is to extract structured data from job postings and classify them according to a specific schema.

Analyze the provided job description and return a JSON response with the following exact structure:

{
  "company_name": string,
  "title": string,
  "category": string (choose from: "Technology", "Marketing", "Sales", "Operations", "Finance", "HR", "Design", "Product", "Engineering", "Management", "Other"),
  "employment_type": string (choose from: "Full-time", "Part-time", "Contract", "Temporary", "Internship"),
  "workplace_type": string (choose from: "Remote", "Hybrid", "On-site"),
  "locations": string[] (array of location strings, empty if remote),
  "description_text": string (clean, formatted job description),
  "requirements_summary": string (2-3 sentence summary of key requirements),
  "skills": string[] (array of required technical and soft skills),
  "experience_min_years": number (minimum years required, 0 if entry level)
}

Rules:
1. Extract exact company name if mentioned, otherwise use the provided company parameter
2. Extract exact job title if clear, otherwise use the provided title parameter
3. For category, choose the best fit from the provided options
4. Skills should include both technical skills (programming languages, tools, software) and important soft skills
5. Be conservative with experience_min_years - only extract if explicitly stated
6. Clean up the description_text to remove excessive formatting but keep structure
7. If information is not available, use reasonable defaults or empty values

Focus on accuracy and completeness.`;

    const userPrompt = `Job Title: ${jobTitle || 'Not specified'}
Company: ${company || 'Not specified'}

Job Description:
${jobDescription}

Please analyze this job description and extract structured data according to the specified schema.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Anthropic API error:', errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const analysisContent = data.content[0].text;

    // Extract JSON from the response
    let structuredData;
    try {
      // Try to parse the entire response as JSON first
      structuredData = JSON.parse(analysisContent);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = analysisContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback: try to find JSON-like content
        const jsonStart = analysisContent.indexOf('{');
        const jsonEnd = analysisContent.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          structuredData = JSON.parse(analysisContent.slice(jsonStart, jsonEnd));
        } else {
          throw new Error('Could not extract JSON from Claude response');
        }
      }
    }

    // Validate and clean the structured data
    const cleanedData: any = {
      company_name: structuredData.company_name || company || 'Unknown Company',
      title: structuredData.title || jobTitle || 'Unknown Position',
      category: structuredData.category || 'Other',
      employment_type: structuredData.employment_type || 'Full-time',
      workplace_type: structuredData.workplace_type || 'On-site',
      locations: Array.isArray(structuredData.locations) ? structuredData.locations : [],
      description_text: structuredData.description_text || jobDescription,
      requirements_summary: structuredData.requirements_summary || 'Requirements not specified',
      skills: Array.isArray(structuredData.skills) ? structuredData.skills : [],
      experience_min_years: typeof structuredData.experience_min_years === 'number' 
        ? structuredData.experience_min_years 
        : 0
    };

    // Save to database if userId is provided
    if (userId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        const { data: savedJob, error: saveError } = await supabase
          .from('jobs')
          .insert([{
            user_id: userId,
            company_name: cleanedData.company_name,
            title: cleanedData.title,
            category: cleanedData.category,
            employment_type: cleanedData.employment_type,
            workplace_type: cleanedData.workplace_type,
            locations: cleanedData.locations,
            description_text: cleanedData.description_text,
            requirements_summary: cleanedData.requirements_summary,
            skills: cleanedData.skills,
            experience_min_years: cleanedData.experience_min_years,
            raw_job_description: jobDescription
          }])
          .select()
          .single();

        if (saveError) {
          console.error('Error saving job to database:', saveError);
          // Continue with the response even if save fails
        } else {
          cleanedData.job_id = savedJob.id;
        }
      } catch (dbError) {
        console.error('Database error:', dbError);
        // Continue with the response even if save fails
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: cleanedData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in process-job-description function:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred',
      data: null
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});