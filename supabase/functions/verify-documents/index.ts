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
    const { aadhaarImage, selfieImage } = await req.json();
    
    if (!aadhaarImage || !selfieImage) {
      return new Response(
        JSON.stringify({ success: false, error: 'Both Aadhaar and selfie images are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are a document verification AI assistant. Your task is to verify:
1. The first image should be a valid Aadhaar card (Indian national ID). Check if it shows:
   - The Aadhaar logo and 12-digit number
   - A photo of a person
   - Name and address details
   
2. The second image should be a live selfie of a person HOLDING the Aadhaar card. Verify:
   - A person is visible in the image
   - The person is holding what appears to be an Aadhaar card
   - The face is clearly visible
   - The Aadhaar card being held is readable

Respond with JSON only in this exact format:
{
  "isValid": boolean,
  "aadhaarValid": boolean,
  "selfieValid": boolean,
  "aadhaarIssue": "string or null - describe issue if any",
  "selfieIssue": "string or null - describe issue if any"
}

Be strict but fair. The main goal is to prevent fraud while allowing legitimate users.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: "Please verify these two images. First image is the Aadhaar card, second image is the selfie with Aadhaar:" },
              { type: "image_url", image_url: { url: aadhaarImage } },
              { type: "image_url", image_url: { url: selfieImage } }
            ]
          }
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: 'Service temporarily unavailable.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: 'Verification service error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '';
    
    console.log("AI Response:", content);

    // Parse the JSON response from AI
    let verificationResult;
    try {
      // Extract JSON from the response (handle markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError, content);
      // Default to requiring manual review
      return new Response(
        JSON.stringify({ 
          success: true, 
          verified: false,
          message: 'Could not automatically verify. Please ensure images are clear and try again.',
          details: null
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        verified: verificationResult.isValid === true,
        aadhaarValid: verificationResult.aadhaarValid,
        selfieValid: verificationResult.selfieValid,
        message: verificationResult.isValid 
          ? 'Documents verified successfully!' 
          : 'Verification failed. Please upload correct documents.',
        details: {
          aadhaarIssue: verificationResult.aadhaarIssue,
          selfieIssue: verificationResult.selfieIssue
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
