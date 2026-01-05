import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();

    if (!text) {
      throw new Error("Missing required parameter: text");
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const systemPrompt =
      "You are a medical and dental dictation corrector. You receive short voice-to-text transcripts of clinical notes that may contain misheard words, misspellings, or informal phrasing. " +
      "Return a corrected version that: " +
      "1) fixes misheard medical and dental terms, " +
      "2) preserves the original meaning, " +
      "3) keeps roughly the same length and level of detail, and " +
      "4) does NOT add any new facts that were not implied by the user.\n\n" +
      "Return ONLY the corrected note as plain text, with no explanations or extra formatting.";

    console.log("Calling OpenAI for transcript correction:", text);

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        max_completion_tokens: 256,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI correction API error:", response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const correctedText: string | undefined = data.choices?.[0]?.message?.content;

    if (!correctedText) {
      console.warn("No corrected text returned, falling back to original transcript");
      return new Response(
        JSON.stringify({ correctedText: text }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("Corrected transcript:", correctedText);

    return new Response(
      JSON.stringify({ correctedText }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in correct-clinical-note function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
