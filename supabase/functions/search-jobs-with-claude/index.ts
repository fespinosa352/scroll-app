import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface JobSearchParams {
  jobTitle: string;
  location?: string;
  experienceLevel?: string;
  skills?: string[];
  companySize?: string;
  remoteWork?: boolean;
}

interface JobListing {
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  experienceLevel: string;
  employmentType: string;
  salaryRange?: string;
  posted: string;
  applyUrl?: string;
  source: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Search jobs function called');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    console.log('API key exists:', !!anthropicApiKey);
    console.log('API key length:', anthropicApiKey?.length || 0);
    
    if (!anthropicApiKey) {
      console.error('ANTHROPIC_API_KEY not found');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const searchParams: JobSearchParams = await req.json();
    console.log('Job search request:', searchParams);

    const { jobTitle, location = 'Remote', experienceLevel = 'Mid-level', skills = [], remoteWork = true } = searchParams;

    // Create a comprehensive search prompt for Claude
    const searchPrompt = `You are a job search specialist. I need you to help me find current job listings based on these criteria:

Job Title: ${jobTitle}
Location: ${location}
Experience Level: ${experienceLevel}
Skills: ${skills.join(', ')}
Remote Work: ${remoteWork ? 'Yes' : 'No'}

Please provide 8-12 realistic job listings that match these criteria. For each job listing, provide:

1. Job Title
2. Company Name
3. Location
4. Job Description (2-3 sentences)
5. Key Requirements (3-5 bullet points)
6. Required Skills (list of 5-8 skills)
7. Experience Level
8. Employment Type (Full-time, Part-time, Contract)
9. Salary Range (if available)
10. Posted Date (realistic recent date)
11. Source (job board name like LinkedIn, Indeed, etc.)

Format your response as a JSON array of job objects with these exact field names:
- title
- company  
- location
- description
- requirements (array of strings)
- skills (array of strings)
- experienceLevel
- employmentType
- salaryRange (optional)
- posted
- source

Make the listings diverse, realistic, and current. Include a mix of companies (startups, mid-size, large corporations). Ensure the jobs actually match the search criteria provided.

IMPORTANT: Return ONLY the JSON array, no additional text or explanation.`;

    console.log('Sending request to Claude API');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${anthropicApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: searchPrompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', response.status, errorText);
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const claudeResponse = await response.json();
    console.log('Claude API response received');

    if (!claudeResponse.content || !claudeResponse.content[0]) {
      console.error('Invalid Claude response format:', claudeResponse);
      throw new Error('Invalid response format from Claude API');
    }

    let jobListings: JobListing[];
    try {
      const jobListingsText = claudeResponse.content[0].text.trim();
      console.log('Raw Claude response:', jobListingsText.substring(0, 500));
      
      // Try to extract JSON from the response
      const jsonMatch = jobListingsText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      
      jobListings = JSON.parse(jsonMatch[0]);
      console.log(`Parsed ${jobListings.length} job listings`);
      
      // Validate the structure
      if (!Array.isArray(jobListings)) {
        throw new Error('Response is not an array');
      }
      
      // Ensure each job has required fields
      jobListings = jobListings.map(job => ({
        title: job.title || 'Unknown Position',
        company: job.company || 'Unknown Company', 
        location: job.location || location,
        description: job.description || 'No description available',
        requirements: Array.isArray(job.requirements) ? job.requirements : [],
        skills: Array.isArray(job.skills) ? job.skills : [],
        experienceLevel: job.experienceLevel || experienceLevel,
        employmentType: job.employmentType || 'Full-time',
        salaryRange: job.salaryRange || undefined,
        posted: job.posted || 'Recently',
        applyUrl: job.applyUrl || undefined,
        source: job.source || 'Job Board'
      }));

    } catch (parseError) {
      console.error('Error parsing Claude response:', parseError);
      console.error('Raw response:', claudeResponse.content[0].text);
      
      // Fallback: create some sample jobs based on search criteria
      jobListings = createFallbackJobs(searchParams);
    }

    console.log(`Returning ${jobListings.length} job listings`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        jobs: jobListings,
        searchParams 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in search-jobs-with-claude function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while searching for jobs',
        success: false 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function createFallbackJobs(params: JobSearchParams): JobListing[] {
  const { jobTitle, location = 'Remote', experienceLevel = 'Mid-level' } = params;
  
  return [
    {
      title: `Senior ${jobTitle}`,
      company: 'TechCorp Solutions',
      location: location,
      description: `We're looking for a talented ${jobTitle} to join our growing team and help build innovative solutions.`,
      requirements: [
        `3+ years of experience in ${jobTitle} role`,
        'Strong problem-solving skills',
        'Excellent communication abilities',
        'Bachelor\'s degree or equivalent experience'
      ],
      skills: params.skills?.length ? params.skills : ['JavaScript', 'React', 'Node.js', 'SQL'],
      experienceLevel: experienceLevel,
      employmentType: 'Full-time',
      salaryRange: '$80,000 - $120,000',
      posted: '2 days ago',
      source: 'LinkedIn'
    },
    {
      title: `${jobTitle} Specialist`,
      company: 'Innovation Labs',
      location: location,
      description: `Join our dynamic team as a ${jobTitle} and contribute to cutting-edge projects.`,
      requirements: [
        `2+ years of ${jobTitle} experience`,
        'Strong analytical skills',
        'Team collaboration experience',
        'Relevant certifications preferred'
      ],
      skills: params.skills?.length ? params.skills : ['Python', 'AWS', 'Git', 'Agile'],
      experienceLevel: experienceLevel,
      employmentType: 'Full-time',
      salaryRange: '$70,000 - $100,000',
      posted: '1 day ago',
      source: 'Indeed'
    }
  ];
}