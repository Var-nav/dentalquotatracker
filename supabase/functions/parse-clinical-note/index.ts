import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, departments, tasks } = await req.json();
    
    if (!text || !departments || !tasks) {
      throw new Error('Missing required parameters: text, departments, tasks');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build context for the AI
    const departmentsList = departments.map((d: any) => `${d.name} (id: ${d.id})`).join('\n');
    const tasksList = tasks.map((t: any) => `${t.task_name} in department ${t.department_id} (id: ${t.id})`).join('\n');

    const systemPrompt = `You are a clinical note parser for dental students. Extract structured data from clinical notes.

Available Departments:
${departmentsList}

Available Quota Tasks:
${tasksList}

Extract the department ID, task ID, and supervisor name from the clinical note. Be intelligent about matching:
- Recognize common dental procedure names (extraction, filling, crown, root canal, etc.)
- Match them to the appropriate quota tasks
- Identify supervisor names (usually prefixed with "Dr." or similar titles)
- Handle informal language and abbreviations`;

    console.log('Calling OpenAI with clinical note:', text);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-mini-2025-08-07',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Parse this clinical note: "${text}"` }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_clinical_data',
              description: 'Extract structured clinical data from a note',
              parameters: {
                type: 'object',
                properties: {
                  department_id: {
                    type: 'string',
                    description: 'The ID of the department where the procedure was performed'
                  },
                  task_id: {
                    type: 'string',
                    description: 'The ID of the specific quota task/procedure performed'
                  },
                  supervisor_name: {
                    type: 'string',
                    description: 'The name of the supervising doctor (with title like Dr.)'
                  }
                },
                required: [],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_clinical_data' } },
        max_completion_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI response:', JSON.stringify(data));

    // Extract the tool call result
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log('No tool call in response, returning empty result');
      return new Response(
        JSON.stringify({ department: null, task: null, supervisorName: null }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const parsedData = JSON.parse(toolCall.function.arguments);
    console.log('Parsed clinical data:', parsedData);

    return new Response(
      JSON.stringify({
        department: parsedData.department_id || null,
        task: parsedData.task_id || null,
        supervisorName: parsedData.supervisor_name || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-clinical-note function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
