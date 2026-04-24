import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { petData, formData, flowType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { breed, category, ageMonths, gender } = petData;
    const isDeep = flowType === "deep";

    let lifestyleBlock = "";

    if (isDeep) {
      const { homeType, cityType, hasKids, otherPets, freeTime, workSchedule, travelFrequency, firstTimePetParent, budgetMin, emergencyFund } = formData;
      const budgetINR = budgetMin ? `₹${(budgetMin * 80).toLocaleString("en-IN")}` : "not specified";
      lifestyleBlock = `
- Home type: ${homeType || "unknown"}
- City type: ${cityType || "unknown"}
- Has children: ${hasKids ? "Yes" : "No"}
- Other pets at home: ${otherPets ? "Yes" : "No"}
- Daily free time: ${freeTime || "unknown"}
- Work schedule: ${workSchedule || "unknown"}
- Travel frequency: ${travelFrequency || "unknown"}
- First time pet parent: ${firstTimePetParent ? "Yes" : "No"}
- Monthly budget: ${budgetINR}
- Emergency fund ready: ${emergencyFund ? "Yes" : "No"}`;
    } else {
      const { living, hasChildren, freeTime, budgetMin, budgetMax } = formData;
      lifestyleBlock = `
- Living situation: ${living || "unknown"}
- Has children under 18: ${hasChildren ? "Yes" : "No"}
- Daily free time: ${freeTime || "unknown"}
- Monthly budget range: ₹${budgetMin || 0} - ₹${budgetMax || 0}`;
    }

    const prompt = `You are a professional pet care advisor. Generate a PERSONALIZED care compatibility report.

PET DETAILS:
- Breed: ${breed}
- Category: ${category}
- Age: ${ageMonths} months
- Gender: ${gender || "unknown"}

USER'S LIFESTYLE:${lifestyleBlock}

Based on real, factual breed-specific data and the user's lifestyle inputs, generate a care compatibility report. Be honest — if the pet is NOT a good match for the user's lifestyle, say so clearly. Consider space needs, exercise requirements, child-friendliness, time commitment, and realistic monthly costs for Indian market.

You MUST respond using the suggest_care_plan tool.`;

    const baseProperties: Record<string, any> = {
      compatibilityScore: { type: "number", description: "0-100 score of how well this pet matches the user's lifestyle. Be realistic and honest." },
      tagline: { type: "string", description: "A short 3-5 word personality tagline for this breed." },
      feeding: { type: "string", description: "Detailed feeding recommendation. 2-3 sentences covering food type, frequency, and portion guidance." },
      exercise: { type: "string", description: "Exercise needs based on breed and user's available time. 2-3 sentences." },
      grooming: { type: "string", description: "Grooming needs. 2-3 sentences covering brushing, professional grooming frequency." },
      monthlyCost: { type: "string", description: "Realistic monthly cost range in INR, e.g. '₹3,000 - ₹5,000'" },
      verdict: { type: "string", description: "One sentence suitability verdict. Be honest if it's not a good match." },
    };

    const baseRequired = ["compatibilityScore", "tagline", "feeding", "exercise", "grooming", "monthlyCost", "verdict"];

    if (isDeep) {
      baseProperties.monthlyCostNote = { type: "string", description: "Brief note about what the monthly cost includes." };
      baseProperties.healthConsiderations = { type: "string", description: "2-3 sentences about breed-specific health issues and vet check-up schedule." };
      baseProperties.beginnerTips = { type: "string", description: "2-3 practical tips for the owner, especially if first-time pet parent." };
      baseRequired.push("monthlyCostNote", "healthConsiderations", "beginnerTips");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "suggest_care_plan",
            description: "Return a personalized pet care compatibility report.",
            parameters: {
              type: "object",
              properties: baseProperties,
              required: baseRequired,
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "suggest_care_plan" } },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("care-plan-generate error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
