import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { breed, category, ageMonths, gender, isProduct, productName, productCategory, productIngredients, productHighlights } = body;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const seed = Math.floor(Math.random() * 100000);

    let prompt: string;

    if (isProduct) {
      prompt = `You are a pet product expert and nutritionist. Generate accurate, product-specific insights for a pet product.

Product details:
- Product Name: ${productName || "Unknown"}
- Pet Type: ${category || "Unknown"}
- Product Category: ${productCategory || "Unknown"}
- Key Ingredients: ${productIngredients?.join(", ") || "Not specified"}
- Product Highlights: ${productHighlights?.join(", ") || "Not specified"}
- Variation seed: ${seed}

CRITICAL RULES:
- Professional, calm, informative tone only.
- No marketing language, no exaggeration, no emojis, no storytelling, no filler words.
- No repetition across sections.
- No speculative claims, no guarantees.
- Fact-based and concise only.
- Use cautious phrasing: "commonly recommended," "may support," "typically."
- NEVER push or force the user to buy. Strictly informational.
- No unwanted, illegal, or 18+ wording.
- Avoid unnecessary adjectives or vague phrases.
- IMPORTANT: Use the variation seed to vary wording significantly every time.

MOBILE DISPLAY CONSTRAINTS:
- Quick Facts: Each category EXACTLY 2 sentences. Keep within 2 mobile lines.
- Deep Dive: Each category maximum 4 sentences. Keep within 4 mobile lines.

Return a JSON object with this EXACT structure (no markdown, no code blocks, just raw JSON):
{
  "quick": {
    "nutrition": {
      "title": "short 2-3 word nutrition insight title",
      "text": "Sentence 1: key nutritional benefit of this product. Sentence 2: practical feeding context."
    },
    "activity": {
      "title": "short 2-3 word energy/health insight title",
      "text": "Sentence 1: how this product supports pet health/energy. Sentence 2: practical implication."
    },
    "lifespan": {
      "title": "short 2-3 word wellness insight title",
      "text": "Sentence 1: long-term wellness benefit. Sentence 2: key factor."
    }
  },
  "deep": {
    "health": {
      "title": "Ingredient Analysis",
      "text": "Sentence 1: primary ingredient benefit. Sentence 2: nutritional context. Sentence 3: suitability for pet type. Sentence 4: any considerations."
    },
    "training": {
      "title": "Usage & Suitability",
      "text": "Sentence 1: ideal usage scenario. Sentence 2: pet age/size suitability. Sentence 3: recommended serving approach. Sentence 4: complementary care tip."
    },
    "grooming": {
      "title": "Storage & Quality",
      "text": "Sentence 1: storage recommendation. Sentence 2: shelf life consideration. Sentence 3: quality indicators. Sentence 4: best practices."
    }
  }
}

Be specific to this exact product. No generic advice.`;
    } else {
      prompt = `You are a veterinary information assistant. Generate accurate, breed-specific pet care insights.

Pet details:
- Breed: ${breed}
- Category: ${category}
- Age: ${ageMonths} months
- Gender: ${gender}
- Variation seed: ${seed}

CRITICAL RULES:
- Professional, calm, informative tone only.
- No marketing language, no exaggeration, no emojis, no storytelling, no filler words.
- No repetition across sections.
- No speculative claims, no guarantees.
- Fact-based and concise only.
- Use cautious phrasing where uncertainty exists: "commonly seen," "may require," "typically."
- No breed praise language. No emotional persuasion.
- No unwanted, illegal, or 18+ wording.
- Avoid unnecessary adjectives. Avoid vague phrases like "very," "extremely," or "super."
- IMPORTANT: Use the variation seed to significantly vary your wording every time.

MOBILE DISPLAY CONSTRAINTS:
- Quick Facts: Each category EXACTLY 2 sentences. Keep within 2 mobile lines.
- Deep Dive: Each category maximum 4 sentences. Keep within 4 mobile lines.

Return a JSON object with this EXACT structure (no markdown, no code blocks, just raw JSON):
{
  "quick": {
    "nutrition": {
      "title": "Nutrition Focus",
      "text": "Sentence 1: core dietary trait or requirement. Sentence 2: practical feeding implication."
    },
    "activity": {
      "title": "Activity Level",
      "text": "Sentence 1: core activity trait. Sentence 2: practical exercise implication."
    },
    "lifespan": {
      "title": "Avg Lifespan",
      "text": "Sentence 1: typical lifespan range. Sentence 2: key longevity factor."
    }
  },
  "deep": {
    "health": {
      "title": "Health & Genetics",
      "text": "Sentence 1: primary health concern. Sentence 2: context or explanation. Sentence 3: care or management approach. Sentence 4: preventive or monitoring recommendation."
    },
    "training": {
      "title": "Training & Temperament",
      "text": "Sentence 1: primary temperament trait. Sentence 2: context. Sentence 3: training approach. Sentence 4: socialization note."
    },
    "grooming": {
      "title": "Grooming & Care",
      "text": "Sentence 1: coat or care type. Sentence 2: grooming frequency. Sentence 3: seasonal or special needs. Sentence 4: maintenance recommendation."
    }
  }
}

Be accurate and specific to the breed and age. No generic advice.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    const insights = JSON.parse(content);

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("pet-ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
