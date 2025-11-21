import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');

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

    const { jobDescription, resumeContent } = await req.json();

    if (!jobDescription || !resumeContent) {
      throw new Error('Job description and resume content are required');
    }

    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyzer. Your job is to analyze resumes against job descriptions and provide detailed scoring and optimization suggestions.

Analyze the provided resume content against the job description and return a JSON response with the following structure:

{
  "overallScore": number (0-100),
  "categoryScores": {
    "keyword": number (0-100),
    "content": number (0-100), 
    "structure": number (0-100),
    "experience": number (0-100)
  },
  "keywordAnalysis": [
    {
      "keyword": string,
      "found": boolean,
      "frequency": number,
      "importance": "high" | "medium" | "low",
      "suggestions": string[]
    }
  ],
  "suggestions": [
    {
      "type": "critical" | "important" | "suggestion",
      "category": string,
      "title": string,
      "description": string,
      "impact": number,
      "autoFixAvailable": boolean
    }
  ],
  "strengths": string[],
  "improvements": string[]
}

Focus on:
1. Keyword matching and density
2. Content quality and quantified achievements
3. Structure and formatting
4. Experience relevance to the role
5. ATS-friendly formatting

Be specific and actionable in your suggestions.`;

    const userPrompt = `Job Description:
${jobDescription}

Resume Content:
${resumeContent}

Please analyze this resume against the job description and provide detailed ATS optimization feedback.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
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
    let analysisData;
    try {
      // Try to parse the entire response as JSON first
      analysisData = JSON.parse(analysisContent);
    } catch (e) {
      // If that fails, try to extract JSON from markdown code blocks
      const jsonMatch = analysisContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        analysisData = JSON.parse(jsonMatch[1]);
      } else {
        // Fallback: try to find JSON-like content
        const jsonStart = analysisContent.indexOf('{');
        const jsonEnd = analysisContent.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          analysisData = JSON.parse(analysisContent.slice(jsonStart, jsonEnd));
        } else {
          throw new Error('Could not extract JSON from Claude response');
        }
      }
    }

    return new Response(JSON.stringify(analysisData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in claude-ats-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An error occurred',
      overallScore: 0,
      categoryScores: { keyword: 0, content: 0, structure: 0, experience: 0 },
      keywordAnalysis: [],
      suggestions: [],
      strengths: [],
      improvements: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});