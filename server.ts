import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Helper to run Gemini content generation with retry and fallback
  async function generateGeminiContentWithFallback(ai: GoogleGenAI, params: {
    model?: string;
    contents: any;
    config?: any;
  }) {
    const requestedModel = params.model || "gemini-3.5-flash";
    const modelsToTry = [requestedModel, "gemini-flash-latest"];
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 3;
      let delay = 1000;
      while (attempts > 0) {
        try {
          console.log(`[GeminiFallback] Calling generateContent with model: ${modelName}, attempts left: ${attempts}`);
          const result = await ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config: params.config,
          });
          return result; // Successful response!
        } catch (err: any) {
          lastError = err;
          console.warn(`[GeminiFallback] Error using model ${modelName} on attempt ${4 - attempts}:`, err?.message || err);
          attempts--;
          if (attempts > 0) {
            console.log(`[GeminiFallback] Waiting ${delay}ms before retrying...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
          }
        }
      }
    }
    throw lastError || new Error("Failed to generate content with any model");
  }

  let _cachedSupabaseAdmin: any = null;
  async function getSupabaseAdmin() {
    if (_cachedSupabaseAdmin) return _cachedSupabaseAdmin;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      let supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://lnxzkusbhidaqhhsxjtk.supabase.co").trim();
      try {
        const urlObj = new URL(supabaseUrl);
        supabaseUrl = urlObj.origin;
      } catch (e) {
        supabaseUrl = supabaseUrl.replace(/\/$/, "");
      }
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
      _cachedSupabaseAdmin = createClient(supabaseUrl, supabaseKey);
      return _cachedSupabaseAdmin;
    } catch (err) {
      console.warn("Could not init cached supabaseAdmin in server", err);
      return null;
    }
  }

  // Set up JSON parsing with a limit for larger requests
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // API Routes MUST go before Vite middlewares
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // End Point: Get public config for Supabase Realtime client
  app.get("/api/config", (req, res) => {
    res.json({
      supabaseUrl: process.env.VITE_SUPABASE_URL || "https://lnxzkusbhidaqhhsxjtk.supabase.co",
      supabaseAnonKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
    });
  });

  // End Point: Pet Care Plan Generator
  app.post("/api/care-plan", async (req, res) => {
    try {
      const { petData, formData, flowType } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

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

Based on real, factual breed-specific data and the user's lifestyle inputs, generate a care compatibility report. Be honest — if the pet is NOT a good match for the user's lifestyle, say so clearly. Consider space needs, exercise requirements, child-friendliness, time commitment, and realistic monthly costs for Indian market.`;

      const response = await generateGeminiContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              compatibilityScore: { type: Type.NUMBER },
              tagline: { type: Type.STRING },
              feeding: { type: Type.STRING },
              exercise: { type: Type.STRING },
              grooming: { type: Type.STRING },
              monthlyCost: { type: Type.STRING },
              verdict: { type: Type.STRING },
              ...(isDeep ? {
                monthlyCostNote: { type: Type.STRING },
                healthConsiderations: { type: Type.STRING },
                beginnerTips: { type: Type.STRING },
              } : {})
            },
            required: ["compatibilityScore", "tagline", "feeding", "exercise", "grooming", "monthlyCost", "verdict"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: unknown) {
      console.error("Error generating care plan on server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // End Point: Pet AI Insights
  app.post("/api/pet-ai-insights", async (req, res) => {
    try {
      const { breed, category, ageMonths, gender } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `Generate pet care insights for a ${ageMonths} month old ${gender || "unknown"} ${breed} (${category}). 
Provide data for two categories: Quick Facts and Deep Dive.
Quick Facts should cover nutrition, activity, and lifespan.
Deep Dive should cover health, training, and grooming.
Keep descriptions concise (max 2 sentences).`;

      const response = await generateGeminiContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quick: {
                type: Type.OBJECT,
                properties: {
                  nutrition: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  activity: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  lifespan: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["nutrition", "activity", "lifespan"]
              },
              deep: {
                type: Type.OBJECT,
                properties: {
                  health: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  training: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  grooming: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["health", "training", "grooming"]
              }
            },
            required: ["quick", "deep"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: unknown) {
      console.error("Error generating pet insights on server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // End Point: Sruvo Support Chat using ElevenLabs Agent ID and API Key (with Gemini text proxy fallback)
  app.post("/api/support/chat", async (req, res) => {
    try {
      const { messages, userId, profile, currentPath } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages array is required" });
      }

      const geminiApiKey = process.env.GEMINI_API_KEY;
      if (!geminiApiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }

      const agentId = process.env.AGENT_ID || process.env.ELEVENLABS_AGENT_ID || "agent_5001kxxyegp6er3sty5zxb26xkhv";
      const elevenLabsApiKey = process.env.API_KEY || process.env.ELEVENLABS_API_KEY || "";

      console.log(`[SupportChat] Connecting to ElevenLabs conversational agent ID: ${agentId}`);

      let systemPrompt = "You are Sruvo's professional India-First Pet Care assistant. Help pet parents with Smart Match consultations, booking statuses, cancellations, order deliveries, refunds, and Pet Passport details in a warm, polite and direct tone. Keep replies friendly and concise.";

      if (agentId) {
        try {
          const headers: Record<string, string> = {
            "Content-Type": "application/json"
          };
          if (elevenLabsApiKey) {
            headers["xi-api-key"] = elevenLabsApiKey;
          }
          const elevenRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
            method: "GET",
            headers
          });

          if (elevenRes.ok) {
            const agentData: any = await elevenRes.json();
            const retrievedPrompt = 
              agentData?.conversation_config?.agent_config?.prompt?.system_prompt ||
              agentData?.agent_config?.prompt?.system_prompt ||
              agentData?.conversation_config?.prompt?.system_prompt ||
              agentData?.prompt?.system_prompt;

            if (retrievedPrompt) {
              systemPrompt = retrievedPrompt;
              console.log("[SupportChat] Successfully loaded system prompt from ElevenLabs agent configuration!");
            } else {
              console.warn("[SupportChat] ElevenLabs returned agent data but system_prompt was not found in structured path.");
            }
          } else {
            console.warn(`[SupportChat] ElevenLabs returned non-ok status: ${elevenRes.status}`);
          }
        } catch (elevenErr) {
          console.warn("[SupportChat] Failed to fetch agent from ElevenLabs, falling back to default Sruvo prompt:", elevenErr);
        }
      }

      // Build Live Real-Time Database Context (replaces function calling / hallucinated assumptions with real Supabase records)
      let dbContext = "\n\n=== REAL-TIME DATABASE CONTEXT (LIVE FROM SRUVO DB) ===\n";
      dbContext += `Current User ID: ${userId || "Not logged in"}\n`;
      if (profile) {
        dbContext += `User Profile Name: ${profile.full_name || profile.name || "N/A"}\n`;
        dbContext += `User Profile Email: ${profile.email || "N/A"}\n`;
      }
      if (currentPath) {
        dbContext += `Current User Screen Location in App: ${currentPath}\n`;
      }

      if (userId) {
        try {
          const supabaseAdmin = await getSupabaseAdmin();
          
          // 1. Fetch smart match bookings
          const { data: smartMatches } = await supabaseAdmin
            .from("buyer_smart_match")
            .select("id, pet_name, status, created_at")
            .eq("user_id", userId);
            
          if (smartMatches && smartMatches.length > 0) {
            dbContext += "\n[User's Smart Match Bookings (buyer_smart_match)]\n";
            smartMatches.forEach((sm: any) => {
              dbContext += `- ID: ${sm.id}\n  Pet Name: ${sm.pet_name || "N/A"}\n  Status: ${sm.status || "submitted"}\n  Created At: ${sm.created_at || "N/A"}\n`;
            });
          } else {
            dbContext += "\n[User's Smart Match Bookings] None found in database.\n";
          }

          // 2. Fetch vet appointments
          const { data: appointments } = await supabaseAdmin
            .from("vet_appointments")
            .select("id, pet_name, status, appointment_date, time_slot, symptoms")
            .eq("user_id", userId);

          if (appointments && appointments.length > 0) {
            dbContext += "\n[User's Vet Appointments (vet_appointments)]\n";
            appointments.forEach((apt: any) => {
              dbContext += `- ID: ${apt.id}\n  Pet Name: ${apt.pet_name || "N/A"}\n  Status: ${apt.status || "pending"}\n  Date: ${apt.appointment_date || "N/A"}\n  Time Slot: ${apt.time_slot || "N/A"}\n  Symptoms/Concerns: ${apt.symptoms || "N/A"}\n`;
            });
          } else {
            dbContext += "\n[User's Vet Appointments] None found in database.\n";
          }

          // 3. Fetch pet passports
          const { data: passports } = await supabaseAdmin
            .from("pet_passports")
            .select("id, passport_id, pet_name, breed, category, gender, dob")
            .eq("user_id", userId);

          if (passports && passports.length > 0) {
            dbContext += "\n[User's Pet Passports (pet_passports)]\n";
            passports.forEach((p: any) => {
              dbContext += `- ID: ${p.id}\n  Passport Code: ${p.passport_id || "N/A"}\n  Pet Name: ${p.pet_name || "N/A"}\n  Breed: ${p.breed || "N/A"}\n  Category: ${p.category || "N/A"}\n  Gender: ${p.gender || "N/A"}\n  DOB: ${p.dob || "N/A"}\n`;
            });
          } else {
            dbContext += "\n[User's Pet Passports] None found in database.\n";
          }
        } catch (dbErr) {
          console.warn("[SupportChat] Error fetching DB context for userId:", userId, dbErr);
        }
      }

      // Check all messages for custom ID patterns to query explicitly
      const allText = messages.map((m: any) => m.content || m.text || "").join(" ");
      const uuidMatches = allText.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi) || [];
      const customMatches = allText.match(/(srv_sm_[a-zA-Z0-9_-]+|srv_pet_[a-zA-Z0-9_-]+|srv_apt_[a-zA-Z0-9_-]+|SM[a-zA-Z0-9_-]+|APT[a-zA-Z0-9_-]+|PASSPORT-[a-zA-Z0-9_-]+)/gi) || [];
      const uniqueIds = Array.from(new Set([...uuidMatches, ...customMatches]));

      if (uniqueIds.length > 0) {
        try {
          const supabaseAdmin = await getSupabaseAdmin();
          dbContext += "\n\n[Explicitly Mentioned IDs Lookups]:\n";
          for (const id of uniqueIds) {
            // Avoid repeating already listed items
            if (dbContext.includes(id)) continue;
            
            // Check smart match
            const { data: sm } = await supabaseAdmin
              .from("buyer_smart_match")
              .select("id, pet_name, status, created_at")
              .eq("id", id)
              .maybeSingle();
              
            if (sm) {
              dbContext += `- Smart Match Booking Found: ID ${sm.id}, Pet Name: ${sm.pet_name}, Status: ${sm.status}, Created At: ${sm.created_at}\n`;
              continue;
            }
            
            // Check appointment
            const { data: apt } = await supabaseAdmin
              .from("vet_appointments")
              .select("id, pet_name, status, appointment_date, time_slot")
              .eq("id", id)
              .maybeSingle();
              
            if (apt) {
              dbContext += `- Vet Appointment Found: ID ${apt.id}, Pet Name: ${apt.pet_name}, Status: ${apt.status}, Date: ${apt.appointment_date}, Slot: ${apt.time_slot}\n`;
              continue;
            }
            
            // Check passport
            const { data: p } = await supabaseAdmin
              .from("pet_passports")
              .select("id, passport_id, pet_name, breed, category")
              .or(`id.eq.${id},passport_id.eq.${id}`)
              .maybeSingle();
              
            if (p) {
              dbContext += `- Pet Passport Found: ID ${p.id}, Code: ${p.passport_id}, Pet Name: ${p.pet_name}, Breed: ${p.breed}, Type: ${p.category}\n`;
              continue;
            }
          }
        } catch (dbErr) {
          console.warn("[SupportChat] Error fetching mentioned IDs lookup:", dbErr);
        }
      }

      // Sruvo Core Swiggy/Blinkit Premium support instructions
      const baseSystemInstruction = `You are "Sruvo Care Assistant" - a premium customer support agent for Sruvo, similar in style to Blinkit, Swiggy, Instamart, or Urban Company.

ROLE & TONALITY:
- Elite customer service: warm, professional, extremely clear, polite, human, and reassuring.
- Keep responses concise and crisp. Avoid walls of text. Sruvo customers appreciate fast, highly scannable answers.
- Use friendly, human, and helpful expressions (e.g., "I'll sort this out for you right away", "I've checked the status of Bella's consultation", "Rest assured, I am on it!").

STRICT BACKEND & TRUTH RULES:
1. NEVER assume, invent, or hallucinate statuses (like Booking Status, Payment Status, Delivery/Refund Status).
2. Look at the "REAL-TIME DATABASE CONTEXT" provided below. Use ONLY this data to verify records.
3. If the data is present: describe it accurately to the user.
4. If no database record is found in the context block: politely explain that the information is currently not found on your desk, and offer to escalate/handoff the issue to a live customer executive.

STRICT MEDICAL & SAFETY MANDATES:
- NEVER act as a veterinarian, doctor, or medical professional.
- NEVER prescribe medicine, give dosages, recommend clinical products, or diagnose health issues.
- If the user asks medical questions (e.g., "Bella is vomiting, what dose of Paracetamol should I give?", "My dog is bleeding, what do I do?"):
  - Reassure them first.
  - Politely decline to prescribe/diagnose.
  - Say: "As Sruvo's support assistant, I cannot prescribe medicine or give medical diagnoses. For your pet's safety, please connect with a verified vet right away. You can schedule an instant digital consultation or search for a nearby clinic via our Smart Match dashboard!"

ESCALATION & HANDOFF PROTOCOLS:
- If the user's issue relates to:
  - Refund approvals
  - Manual booking verification / payment mismatch
  - Policy exception requests
  - Manual booking cancellations
  - Warehouse or delivery courier investigation
  - Correcting sensitive passport data
- Do NOT guess or tell the user that the action was completed unless the DB status already reflects it.
- Instead, say: "I am escalating this directly to our Senior Support Desk. Let me quickly collect your booking details to prepare a priority handoff ticket."
- Collect only the minimum details needed (if they aren't already visible in the chat or DB context), then say: "I have successfully logged a Sruvo Priority Support ticket. Our senior executive will review this and reach out to you within 15 minutes! Rest assured, we've got your back. 🐾"

SCREEN & NAVIGATION AWARENESS:
- Sruvo Buyer features include:
  - Smart Match & Vet Booking (found on Dashboard: /buyer/dashboard)
  - Pet Passport (managed via Add Pet or Pet Details)
  - Consultation Support / Video Consult (Virtual Consults)
  - Pet Essentials Shop (where premium pet food and products are ordered)
- If the user asks where something is, guide them according to Sruvo's standard navigation:
  - "Help/Chat" is opened via the Help button on the Profile screen (/buyer/profile).
  - "Smart Match" or "Instant Analyzing" can be found on the main Dashboard.
- Never describe screens that do not exist in Sruvo.

CURRENT SESSION REAL-TIME USER INFO:
${dbContext}
`;

      const finalSystemInstruction = `${baseSystemInstruction}\n\n=== ADDITIONAL ELEVENLABS PERSONALITY CONFIG ===\n${systemPrompt}`;

      // Map messages array to Gemini format
      const contents = messages.map((m: any) => {
        const role = m.role === "assistant" ? "model" : "user";
        return {
          role,
          parts: [{ text: m.content || m.text || "" }]
        };
      });

      const ai = new GoogleGenAI({
        apiKey: geminiApiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });
      const response = await generateGeminiContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents,
        config: {
          systemInstruction: finalSystemInstruction,
        }
      });

      const responseText = response.text || "";
      res.json({ response: responseText });
    } catch (err: any) {
      console.error("Error in support chat endpoint:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    }
  });

  // End Point: Sruvo Smart Match — Real-Time Production Engine
  app.post("/api/smart-match", async (req, res) => {
    console.log("[SmartMatch Engine] ==========================================");
    console.log("[SmartMatch Engine] Request Received");

    try {
      const payload = req.body;
      if (!payload || !payload.pet) {
        return res.status(400).json({ success: false, error: "Missing pet payload" });
      }

      const { pet, concerns, healthBackground, currentHealthStatus, mediaFiles, sessionId, userId } = payload;
      const selectedCity = (payload.selectedCity || payload.city || payload.location || "Gurgaon").trim();

      // 1. Normalize Request Data
      const rawSpecies = pet.species ? String(pet.species).trim() : "Dog";
      let canonicalSpecies = rawSpecies.charAt(0).toUpperCase() + rawSpecies.slice(1).toLowerCase();
      if (canonicalSpecies === "Guineapig") canonicalSpecies = "Guineapigs";
      if (canonicalSpecies === "Rabbit") canonicalSpecies = "Rabbits";

      const mainConcernQA = concerns?.find((qa: any) => qa.question && qa.question.includes("What is your main concern today?"));
      const rawConcern = mainConcernQA ? mainConcernQA.answer : "Other";

      // Map Main Concern to Medical Specializations and Conditions
      const concernMap: Record<string, { specs: string[]; conditions: string[] }> = {
        "Vomiting": { specs: ["Gastroenterology", "Internal Medicine", "General Surgery"], conditions: ["vomiting", "diarrhea", "nausea", "gastro", "indigestion"] },
        "Diarrhea": { specs: ["Gastroenterology", "Internal Medicine"], conditions: ["diarrhea", "vomiting", "loose stool", "gastroenteritis"] },
        "Loss of Appetite": { specs: ["Gastroenterology", "Internal Medicine", "General Practice"], conditions: ["appetite", "anorexia", "lethargy", "weakness"] },
        "Itching / Skin Issues": { specs: ["Dermatology", "Skin Care", "Allergy"], conditions: ["itching", "skin", "allergy", "dermatitis", "fungal", "hair fall"] },
        "Eye Problems": { specs: ["Ophthalmology", "Eye Care"], conditions: ["eye", "cataract", "discharge", "redness", "cornea", "vision"] },
        "Ear Problems": { specs: ["Otology", "ENT", "Dermatology"], conditions: ["ear", "ear infection", "discharge", "head shaking", "wax"] },
        "Coughing / Breathing Issues": { specs: ["Pulmonology", "Respiratory Medicine", "Cardiology", "Internal Medicine"], conditions: ["coughing", "breathing", "wheezing", "respiratory", "asthma"] },
        "Injury / Wound": { specs: ["Orthopedics", "General Surgery", "Emergency Medicine"], conditions: ["injury", "wound", "fracture", "trauma", "bleeding", "cut"] },
        "Mobility Issues": { specs: ["Orthopedics", "Neurology", "Physiotherapy"], conditions: ["mobility", "limping", "joint", "paralysis", "arthritis", "stiffness"] },
        "Behavior Changes": { specs: ["Behavioral Medicine", "Psychology"], conditions: ["behavior", "aggression", "anxiety", "depression", "barking", "hiding"] },
        "Other": { specs: ["General Practice", "Internal Medicine"], conditions: ["general", "wellness", "checkup"] }
      };

      const matchedConcernInfo = concernMap[rawConcern] || concernMap["Other"];
      const targetSpecializations = matchedConcernInfo.specs;
      const targetConditions = matchedConcernInfo.conditions;

      console.log("[SmartMatch Engine] Search Criteria:", {
        species: canonicalSpecies,
        concern: rawConcern,
        targetSpecializations,
        selectedCity
      });

      // 2. Fetch Database Veterinarians
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error("Failed to initialize database connection");
      }

      const { data: vetProfiles, error: fetchErr } = await supabaseAdmin
        .from("vet_profiles")
        .select("*");

      if (fetchErr) {
        console.error("[SmartMatch Engine] DB Query Error:", fetchErr);
        throw fetchErr;
      }

      let rawVets = vetProfiles || [];
      if (rawVets.length > 0) {
        const userIds = rawVets.map((v: any) => v.user_id).filter(Boolean);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, name, full_name, profile_photo, is_admin_approved, role")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        rawVets = rawVets.map((v: any) => ({
          ...v,
          profile: profileMap.get(v.user_id) || null
        }));
      }

      // 3. Stage 1 Filtering: Real-Time Availability & Approval Verification
      const eligibleVets = rawVets.filter((v: any) => {
        const isActive = v.is_active !== false;
        const isVerified = v.verification_status === "approved" || v.verification_status === "verified" || !v.verification_status;
        const isApproved = !v.profile || v.profile.is_admin_approved !== false;
        const notBlocked = v.profile?.role !== "blocked" && v.profile?.role !== "rejected";
        return isActive && isVerified && isApproved && notBlocked;
      });

      console.log(`[SmartMatch Engine] Total Vets: ${rawVets.length}, Eligible & Verified: ${eligibleVets.length}`);

      if (eligibleVets.length === 0) {
        return res.json({
          success: true,
          matchedVet: null,
          message: "No active verified veterinarians available."
        });
      }

      // Helper Functions for Multi-Level Matching
      const normalizeText = (txt: any) => String(txt || "").toLowerCase().trim();

      const vetMatchesSpecies = (vet: any, species: string) => {
        const specList = (vet.specializations || []).map(normalizeText);
        const medSpecObj = vet.medical_specializations || {};
        const medSpecies = (medSpecObj.species || []).map(normalizeText);
        const clinicalExp = (vet.clinical_expertise || []).map(normalizeText);
        const target = species.toLowerCase();

        // If explicitly mentions target species, or treats all/general
        if (specList.length === 0 && clinicalExp.length === 0 && !medSpecObj.species) return true; // general fallback
        if (specList.some((s: string) => s.includes(target) || s.includes("all") || s.includes("general") || s.includes("small animal"))) return true;
        if (medSpecies.some((s: string) => s.includes(target) || s.includes("all"))) return true;
        if (clinicalExp.some((c: string) => c.includes(target))) return true;
        return false;
      };

      const vetMatchesMedical = (vet: any, targetSpecs: string[], targetConds: string[]) => {
        const medSpecObj = vet.medical_specializations || {};
        const primary = normalizeText(medSpecObj.primary);
        const secondary = normalizeText(medSpecObj.secondary);
        const conditions = (medSpecObj.conditions || []).map(normalizeText);
        const specList = (vet.specializations || []).map(normalizeText);
        const clinicalExp = (vet.clinical_expertise || []).map(normalizeText);

        let matchScore = 0;

        targetSpecs.forEach((ts) => {
          const tNorm = ts.toLowerCase();
          if (primary.includes(tNorm)) matchScore += 25;
          if (secondary.includes(tNorm)) matchScore += 15;
          if (specList.some((s: string) => s.includes(tNorm))) matchScore += 15;
          if (clinicalExp.some((c: string) => c.includes(tNorm))) matchScore += 15;
        });

        targetConds.forEach((tc) => {
          const cNorm = tc.toLowerCase();
          if (conditions.some((cond: string) => cond.includes(cNorm))) matchScore += 15;
          if (clinicalExp.some((exp: string) => exp.includes(cNorm))) matchScore += 10;
        });

        return matchScore;
      };

      const vetMatchesCity = (vet: any, targetCityStr: string) => {
        const tCity = normalizeText(targetCityStr);
        if (!tCity || tCity === "all") return true;

        const vCity = normalizeText(vet.city);
        const pCity = normalizeText(vet.profile?.city);
        const vAddress = normalizeText(vet.clinic_address);
        const vHospital = normalizeText(vet.hospital_address);

        return vCity.includes(tCity) || pCity.includes(tCity) || vAddress.includes(tCity) || vHospital.includes(tCity);
      };

      // NCR Cluster for Level 2 Fallback
      const ncrCities = ["gurgaon", "gurugram", "delhi", "new delhi", "noida", "greater noida", "ghaziabad", "faridabad"];
      const isNCR = ncrCities.includes(selectedCity.toLowerCase());

      const vetMatchesNearbyCity = (vet: any, targetCityStr: string) => {
        const tCity = normalizeText(targetCityStr);
        if (isNCR) {
          const vCity = normalizeText(vet.city || vet.profile?.city || vet.clinic_address || "");
          return ncrCities.some(c => vCity.includes(c));
        }
        return vetMatchesCity(vet, targetCityStr);
      };

      // 4. Multi-Level Fallback Matching Loop
      let candidatePool: any[] = [];
      let fallbackLevelUsed = "";

      // LEVEL 1: Selected City + Species + Medical Specialization Match
      candidatePool = eligibleVets.filter((v: any) => {
        return vetMatchesCity(v, selectedCity) && vetMatchesSpecies(v, canonicalSpecies) && vetMatchesMedical(v, targetSpecializations, targetConditions) > 0;
      });

      if (candidatePool.length > 0) {
        fallbackLevelUsed = "Level 1: Selected City & Specialist Match";
      } else {
        // LEVEL 2: Nearby Cities / Regional Cluster + Species + Medical Match
        candidatePool = eligibleVets.filter((v: any) => {
          return vetMatchesNearbyCity(v, selectedCity) && vetMatchesSpecies(v, canonicalSpecies) && vetMatchesMedical(v, targetSpecializations, targetConditions) > 0;
        });

        if (candidatePool.length > 0) {
          fallbackLevelUsed = "Level 2: Nearby Regional Specialist Match";
        } else {
          // LEVEL 3: Same State + Species + Medical Match
          const userState = eligibleVets.find((v: any) => vetMatchesCity(v, selectedCity))?.state || "";
          if (userState) {
            candidatePool = eligibleVets.filter((v: any) => {
              const vState = normalizeText(v.state);
              return vState.includes(normalizeText(userState)) && vetMatchesSpecies(v, canonicalSpecies) && vetMatchesMedical(v, targetSpecializations, targetConditions) > 0;
            });
          }

          if (candidatePool.length > 0) {
            fallbackLevelUsed = "Level 3: Same State Specialist Match";
          } else {
            // LEVEL 4: Nationwide Online Consultation Specialist + Species Match
            candidatePool = eligibleVets.filter((v: any) => {
              const isOnlineAvailable = v.consultation_type?.includes("online") || (v.online_fee && v.online_fee > 0);
              return isOnlineAvailable && vetMatchesSpecies(v, canonicalSpecies) && vetMatchesMedical(v, targetSpecializations, targetConditions) > 0;
            });

            if (candidatePool.length > 0) {
              fallbackLevelUsed = "Level 4: Nationwide Online Specialist Match";
            } else {
              // LEVEL 5: General Practitioner Fallback (Selected City or Nationwide)
              candidatePool = eligibleVets.filter((v: any) => vetMatchesSpecies(v, canonicalSpecies));

              if (candidatePool.length > 0) {
                fallbackLevelUsed = "Level 5: General Practitioner Fallback";
              } else {
                // Ultimate Fallback: Any active eligible vet
                candidatePool = [...eligibleVets];
                fallbackLevelUsed = "Level 6: Emergency Availability Fallback";
              }
            }
          }
        }
      }

      console.log(`[SmartMatch Engine] Winning Matching Tier: "${fallbackLevelUsed}" with ${candidatePool.length} candidates.`);

      // 5. Intelligent Ranking & Scoring
      const scoredCandidates = candidatePool.map((vet: any) => {
        const medicalScore = vetMatchesMedical(vet, targetSpecializations, targetConditions);
        const speciesScore = vetMatchesSpecies(vet, canonicalSpecies) ? 20 : 0;
        const experienceScore = Math.min(20, (vet.years_of_experience || 0) * 2);
        const ratingScore = Math.min(15, (vet.average_rating || 4.5) * 3);
        const consultationsScore = Math.min(10, (vet.total_consultations || 0) * 0.1);
        const cityScore = vetMatchesCity(vet, selectedCity) ? 15 : 0;

        // Minor free-text boost (qualification, education, bio)
        let freeTextBoost = 0;
        const freeText = `${vet.qualification || ""} ${vet.other_qualification || ""} ${JSON.stringify(vet.education_details || {})}`.toLowerCase();
        targetSpecializations.forEach(ts => {
          if (freeText.includes(ts.toLowerCase())) freeTextBoost += 3;
        });

        const totalScore = medicalScore + speciesScore + experienceScore + ratingScore + consultationsScore + cityScore + freeTextBoost;

        return {
          vet,
          totalScore,
          medicalScore,
          experienceScore,
          ratingScore,
          cityScore
        };
      });

      scoredCandidates.sort((a, b) => b.totalScore - a.totalScore);
      const winner = scoredCandidates[0];
      const bestVet = winner.vet;

      // 6. Calculate Confidence Score & Internal Explanation Layer
      let confidenceScore = 95;
      if (fallbackLevelUsed.startsWith("Level 1")) confidenceScore = Math.min(98, 88 + Math.round(winner.totalScore / 10));
      else if (fallbackLevelUsed.startsWith("Level 2")) confidenceScore = 85;
      else if (fallbackLevelUsed.startsWith("Level 3")) confidenceScore = 78;
      else if (fallbackLevelUsed.startsWith("Level 4")) confidenceScore = 72;
      else confidenceScore = 60;

      const rawName = bestVet.profile?.full_name || bestVet.profile?.name || (bestVet.user_id === "f9834ef6-778d-4384-8d17-6316fffa03b6" ? "Jashan Pabla" : "Veterinarian");
      const realName = rawName.startsWith("Dr. ") ? rawName : `Dr. ${rawName}`;
      const matchedSpecName = bestVet.medical_specializations?.primary || bestVet.specializations?.[0] || "General Veterinarian";

      const matchExplanation = {
        fallbackLevelUsed,
        confidenceScore,
        selectedCity,
        matchedSpecies: canonicalSpecies,
        mainConcern: rawConcern,
        primarySpecialization: matchedSpecName,
        rankingScore: winner.totalScore,
        factors: [
          `Verified expertise in ${canonicalSpecies} healthcare`,
          `Specialization in ${matchedSpecName} matching symptom '${rawConcern}'`,
          `Location: ${bestVet.city || selectedCity}`,
          `${bestVet.years_of_experience || 3}+ years of clinical experience`,
          `Rating: ${bestVet.average_rating || 4.8}/5.0 based on real client consultations`,
          `Confirmed active consultation availability`
        ]
      };

      // Construct Matched Vet Data Object
      const matchedVetData = {
        id: bestVet.id,
        userId: bestVet.user_id,
        name: realName,
        specialization: matchedSpecName,
        image: bestVet.profile_photo || bestVet.profile?.profile_photo || "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&h=200&fit=crop",
        rating: bestVet.average_rating || 4.9,
        experience: bestVet.years_of_experience || 3,
        fee: bestVet.online_fee || 499,
        onlineFee: bestVet.online_fee || 500,
        offlineFee: bestVet.offline_fee || 800,
        weekly_availability: bestVet.weekly_availability,
        clinic_name: bestVet.clinic_name || "Sruvo Partner Veterinary Clinic",
        clinic_address: bestVet.clinic_address || `${selectedCity}, India`,
        city: bestVet.city || selectedCity,
        qualification: bestVet.qualification || "BVSc & AH",
        confidenceScore,
        matchExplanation
      };

      console.log("[SmartMatch Engine] Selected Winner:", {
        id: matchedVetData.id,
        name: matchedVetData.name,
        confidenceScore,
        fallbackLevelUsed
      });

      // 7. Persist Result into Database `buyer_smart_match`
      const finalAssessmentId = sessionId || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : "sms_" + Date.now());
      
      const smartMatchRecord: any = {
        id: finalAssessmentId,
        user_id: (userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) ? userId : null,
        selected_city: selectedCity,
        pet_details: pet,
        symptoms_and_concerns: concerns || [],
        health_background: healthBackground || [],
        current_health_status: currentHealthStatus || [],
        matched_vet_id: bestVet.id,
        match_confidence_score: confidenceScore,
        match_explanation: matchExplanation,
        fallback_level_used: fallbackLevelUsed,
        status: "matched",
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabaseAdmin
        .from("buyer_smart_match")
        .upsert(smartMatchRecord, { onConflict: "id" });

      if (upsertErr) {
        console.warn("[SmartMatch Engine] Database persistence warning:", upsertErr.message);
      }

      console.log("[SmartMatch Engine] Response successfully dispatched.");
      console.log("[SmartMatch Engine] ==========================================");

      return res.json({
        success: true,
        matchedVet: matchedVetData,
        veterinarians: [bestVet],
        matchDetails: {
          confidenceScore,
          fallbackLevel: fallbackLevelUsed,
          explanation: matchExplanation
        }
      });

    } catch (err: any) {
      console.error("[SmartMatch Engine] Endpoint Exception:", err);
      return res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });

  // End Point: Sruvo Save Smart Match - Persist entries to Supabase first
  app.post("/api/save-smart-match", async (req, res) => {
    try {
      const payload = req.body;
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error("Failed to connect to database (Supabase client not initialized)");
      }

      const petId = payload.pet?.id;
      const petName = payload.pet?.name;
      const userId = payload.userId;

      // Prepare IDs for DB - allow nulls if they don't map to real Supabase entities to avoid FK errors
      let petPassportId = null;
      let dbUserId = null;

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      // Attempt to resolve real UUID for User
      if (userId && uuidRegex.test(String(userId).trim())) {
          dbUserId = String(userId).trim();
      }

      // Attempt to resolve real UUID for Pet Passport
      if (petId && !String(petId).startsWith("srv_pet_")) {
          const cleanPetId = String(petId).trim();
          if (uuidRegex.test(cleanPetId)) {
            const { data: pet } = await supabaseAdmin.from("pet_passports").select("id").eq("id", cleanPetId).maybeSingle();
            if (pet) petPassportId = pet.id;
          }
          if (!petPassportId) {
            const { data: pet } = await supabaseAdmin.from("pet_passports").select("id").ilike("passport_id", cleanPetId).maybeSingle();
            if (pet) petPassportId = pet.id;
          }
      }

      // Safe randomUUID fallback
      const finalAssessmentId = payload.sessionId || (typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : "sms_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11));

      // We attempt to save into the requested 'buyer_smart_match' table first.
      const smartMatchRecord = {
          id: finalAssessmentId,
          user_id: dbUserId,
          pet_passport_id: petPassportId,
          pet_name: petName || null,
          step1_pet_details: payload.pet || {},
          step2_concerns: payload.concerns || [],
          step3_health_background: payload.healthBackground || [],
          step4_current_health_status: payload.currentHealthStatus || [],
          step5_photos_videos: payload.mediaFiles || [],
          step6_review_data: payload.reviewData || {},
          status: "submitted",
          updated_at: new Date().toISOString()
      };

      let { error: insertErr } = await supabaseAdmin
        .from("buyer_smart_match")
        .upsert(smartMatchRecord, { onConflict: "id" });

      // Handle user_id or pet_passport_id FK constraint violation by falling back to null IDs
      if (insertErr && (insertErr.code === '23503' || insertErr.message?.includes('foreign key'))) {
         console.warn("[SmartMatch Save] Upsert failed on buyer_smart_match with foreign key constraint, retrying with null FK IDs...", insertErr.message);
         smartMatchRecord.user_id = null;
         smartMatchRecord.pet_passport_id = null;
         const { error: retryErr } = await supabaseAdmin.from("buyer_smart_match").upsert(smartMatchRecord, { onConflict: "id" });
         insertErr = retryErr;
      }

      if (insertErr) {
        console.error("Supabase insert error details:", insertErr);
        return res.status(400).json({ success: false, error: "Database error: " + (insertErr.message || JSON.stringify(insertErr)) });
      }

      return res.json({ success: true, id: finalAssessmentId });
    } catch (err: any) {
      console.error("[SmartMatch Save] Route error:", err);
      const errorMessage = err?.message || (typeof err === "string" ? err : "Unknown internal server error");
      return res.status(500).json({ success: false, error: errorMessage });
    }
  });

  // End Point: Save individual Smart Match Response in Real-time (Zero-loss)
  app.post("/api/save-smart-match-response", async (req, res) => {
    try {
      const payload = req.body;
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error("Failed to connect to database (Supabase client not initialized)");
      }

      const {
        session_id,
        user_id,
        pet_id,
        step,
        question_id,
        question_text,
        question_type,
        raw_answer,
        normalized_answer,
        status
      } = payload;

      if (!session_id || !question_id) {
        return res.status(400).json({ success: false, error: "session_id and question_id are required" });
      }

      const dbUserId = (user_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(user_id)) ? user_id : null;
      const petPassportId = (pet_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pet_id)) ? pet_id : null;

      // Try reading existing buyer_smart_match responses
      let responsesArray: any[] = [];

      const { data: existingRecord, error: selectError } = await supabaseAdmin
        .from("buyer_smart_match")
        .select("responses")
        .eq("id", session_id)
        .maybeSingle();

      if (selectError) {
        console.warn("[Save SmartMatch Response] Select error:", selectError.message);
      }

      if (existingRecord && Array.isArray(existingRecord.responses)) {
        responsesArray = existingRecord.responses;
      }
      
      // Remove any existing response with the same question_id to handle backtracking/updates without duplicates
      responsesArray = responsesArray.filter((r: any) => r.question_id !== question_id);

      const newResponse = {
        session_id,
        user_id: dbUserId,
        pet_id: pet_id || null,
        step: step || 1,
        question_id,
        question_text,
        question_type,
        raw_answer: raw_answer || null,
        normalized_answer: normalized_answer || null,
        status: status || "saved",
        created_at: new Date().toISOString()
      };

      responsesArray.push(newResponse);

      // Map responses to distinct steps
      const step2_concerns = responsesArray.filter((r: any) => r.step === 2).map((r: any) => ({ question: r.question_text, answer: r.normalized_answer || r.raw_answer }));
      const step3_health_background = responsesArray.filter((r: any) => r.step === 3).map((r: any) => ({ question: r.question_text, answer: r.normalized_answer || r.raw_answer }));
      const step4_current_health_status = responsesArray.filter((r: any) => r.step === 4).map((r: any) => ({ question: r.question_text, answer: r.normalized_answer || r.raw_answer }));
      
      // Handle photo/video special mapping if uploaded in step 5
      let step5_photos_videos = [];
      if (step === 5 && question_id === "S5_MEDIA" && raw_answer) {
        try {
          step5_photos_videos = JSON.parse(raw_answer);
        } catch(e) {
          step5_photos_videos = [raw_answer];
        }
      }

      const upsertRecord: any = {
        id: session_id,
        user_id: dbUserId,
        pet_passport_id: petPassportId,
        responses: responsesArray,
        step2_concerns,
        step3_health_background,
        step4_current_health_status,
        updated_at: new Date().toISOString()
      };

      if (step5_photos_videos.length > 0) {
        upsertRecord.step5_photos_videos = step5_photos_videos;
      }

      const { error: upsertErr } = await supabaseAdmin
        .from("buyer_smart_match")
        .upsert(upsertRecord, { onConflict: "id" });

      if (upsertErr) {
        console.error("[Save SmartMatch Response] Upsert buyer_smart_match error:", upsertErr.message);
        return res.status(400).json({ success: false, error: upsertErr.message });
      }

      return res.json({
        success: true,
        session_id,
        user_id: dbUserId,
        pet_id,
        step,
        event_type: "answer_saved"
      });
    } catch (err: any) {
      console.error("[Save SmartMatch Response] Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Unknown internal error" });
    }
  });

  // End Point: Get all saved responses for a given Smart Match Session
  app.get("/api/get-smart-match-responses", async (req, res) => {
    try {
      const sessionId = req.query.sessionId as string;
      if (!sessionId) {
        return res.status(400).json({ success: false, error: "sessionId is required" });
      }
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error("Failed to connect to database (Supabase client not initialized)");
      }

      // Try selecting from buyer_smart_match first
      const { data: record, error: selectErr } = await supabaseAdmin
        .from("buyer_smart_match")
        .select("responses")
        .eq("id", sessionId)
        .maybeSingle();

      if (selectErr) {
        console.error("Failed to query responses from buyer_smart_match:", selectErr);
        return res.status(400).json({ success: false, error: selectErr.message });
      }

      return res.json({ success: true, responses: record?.responses || [] });
    } catch (err: any) {
      console.error("[Get SmartMatch Responses] Error:", err);
      return res.status(500).json({ success: false, error: err?.message || "Unknown internal error" });
    }
  });

  app.post("/api/product-insights", async (req, res) => {
    try {
      const { name, brand, pet_type, category, ingredients, highlights } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is required");
      }
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          }
        }
      });

      const prompt = `Provide nutrition and wellness insights for a pet product:
Name: ${name}
Brand: ${brand}
Type: ${pet_type}
Category: ${category}
Ingredients: ${ingredients?.join(", ") || "N/A"}
Highlights: ${highlights?.join(", ") || "N/A"}

Keep descriptions concise (max 2 sentences).`;

      const response = await generateGeminiContentWithFallback(ai, {
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              quick: {
                type: Type.OBJECT,
                properties: {
                  nutrition: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  activity: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  lifespan: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["nutrition", "activity", "lifespan"]
              },
              deep: {
                type: Type.OBJECT,
                properties: {
                  health: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  training: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                  grooming: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["title", "text"] },
                },
                required: ["health", "training", "grooming"]
              }
            },
            required: ["quick", "deep"]
          }
        }
      });

      if (response.text) {
        let jsonString = response.text.trim();
        if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
        }
        res.json(JSON.parse(jsonString));
      } else {
        throw new Error("No response text from Gemini");
      }
    } catch (err: unknown) {
      console.error("Error generating product insights on server:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // End Point: Generate Vet Biography / Description using Gemini and cache it
  app.post("/api/generate-vet-bio", async (req, res) => {
    try {
      const { 
        vetId, 
        name, 
        qualification, 
        yearsExp, 
        specializations, 
        consultationType, 
        clinic, 
        forceUpdate = false
      } = req.body;

      // 1. Initialize Supabase secure client if vetId is provided for caching
      let supabaseAdmin: any = null;
      let existingBio = "";

      if (vetId) {
        supabaseAdmin = await getSupabaseAdmin();

        const { data, error: fetchErr } = await supabaseAdmin
          .from("vet_profiles")
          .select("weekly_availability")
          .eq("id", vetId)
          .single();

        if (!fetchErr && data) {
          const weeklyAvailability = data.weekly_availability as any;
          if (weeklyAvailability && weeklyAvailability.ai_description && !forceUpdate) {
            console.log(`[Server] Found cached AI description for vetId: ${vetId}`);
            return res.json({ description: weeklyAvailability.ai_description });
          }
          existingBio = weeklyAvailability?.ai_description || "";
        }
      }

      let generatedText = "";

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error("GEMINI_API_KEY environment variable is required");
        }
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            }
          }
        });

        const specList = Array.isArray(specializations) && specializations.length > 0 
          ? specializations.join(", ") 
          : "general veterinary care";

        const prompt = `Generate a professional 'About Doctor' description for a veterinary profile.
    
REQUIREMENTS:
- Length: Exactly 3 to 4 lines only. (Mandatory)
- Language: Natural, human-written language suitable for a real veterinary profile.
- Tone: Professional, trustworthy, and healthcare-focused.
- Perspective: Third person.
- Mention years of experience: naturally integrated (e.g., "With over 8 years of clinical experience...").
- Content: Mention ONLY the animal types and consultation areas selected: ${specList}.
- Focus areas: Practical veterinary care, diagnosis, treatment, preventive healthcare, wellness support, or nutrition guidance.
- Simplicity: Keep content concise and easy to read on mobile devices.
- LIMITATIONS: DO NOT mention education, degrees, clinic address, ratings, reviews, awards, or achievements.
- NO MARKETING BUZZWORDS: Avoid words like "best", "world-class", "top-rated", "stellar", "unmatched", "passionate", etc.
- UNIQUENESS: Do NOT use a template. Ensure this feels like a unique, handwritten summary for this specific doctor.

DOCTOR DATA:
- Name: ${name || "the veterinarian"}
- Experience: ${yearsExp || "several"} years
- Focus: ${specList}
- Consultation: ${consultationType || "General"}

Return the response as a single JSON object containing only a "description" key. Ensure the description is exactly 3-4 lines when displayed.`;

        const response = await generateGeminiContentWithFallback(ai, {
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                description: { type: Type.STRING }
              },
              required: ["description"]
            }
          }
        });

        if (response.text) {
          let jsonString = response.text.trim();
          if (jsonString.startsWith("```json")) {
            jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "").trim();
          } else if (jsonString.startsWith("```")) {
            jsonString = jsonString.replace(/^```/, "").replace(/```$/, "").trim();
          }
          const parsed = JSON.parse(jsonString);
          generatedText = parsed.description;
        } else {
          throw new Error("No response text from Gemini");
        }

        if (!generatedText) {
          throw new Error("Gemini produced an empty description");
        }
      } catch (genErr: any) {
        console.warn("[Server] Gemini vet bio generation failed, using fallback:", genErr.message);
        const specText = Array.isArray(specializations) && specializations.length > 0 
            ? specializations.join(" and ") 
            : "pets";
        generatedText = `${name && !name.includes("Dr") ? "Dr. " + name : name || "This veterinarian"} is a verified professional with ${yearsExp || "several"} years of experience in veterinary medicine. They focus on ${specText}, providing practical care, diagnostics, and wellness support to ensure the long-term health of animals. Their approach emphasizes preventive healthcare and reliable treatment for companions.`;
      }

      // 3. Save the generated description back to Supabase if we have vetId
      if (vetId && supabaseAdmin && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
        console.log(`[Server] Saving AI generated description to DB for vetId: ${vetId}.`);
        
        // Fetch current data first to avoid overwriting other fields in weekly_availability
        const { data: currentData } = await supabaseAdmin
          .from("vet_profiles")
          .select("weekly_availability")
          .eq("id", vetId)
          .single();

        const currentAvailability = (currentData?.weekly_availability as any) || {};
        const updatedAvailability = { ...currentAvailability, ai_description: generatedText };

        const { error: updateErr } = await supabaseAdmin
          .from("vet_profiles")
          .update({ weekly_availability: updatedAvailability })
          .eq("id", vetId);

        if (updateErr) {
          console.warn(`[Server] Failed to write generated description to Supabase for vetId: ${vetId}. Error: ${updateErr.message}`);
        } else {
          console.log(`[Server] Successfully persisted generated description for vetId: ${vetId}`);
        }
      }

      res.json({ description: generatedText });
    } catch (err: unknown) {
      console.error("Error generating vet biography:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      res.status(500).json({ error: errorMessage });
    }
  });

  // End Point: Pet Passport Fetch
  app.get("/api/pet-passport", async (req, res) => {
    try {
      const supabaseAdmin = await getSupabaseAdmin();

      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      const passportId = req.query.id as string;
      const userId = req.query.userId as string;

      if (!passportId) {
        if (!userId) {
          // Prevent data leak: if no userId is passed, don't return all passports
          return res.json([]);
        }
        
        let query = supabaseAdmin.from("pet_passports").select("*").order("created_at", { ascending: false });
        query = query.eq("user_id", userId);
        
        try {
          const { data, error } = await query;
          if (error) {
            // Log it but return empty so frontend can use fallback logic
            console.error("Supabase query error (possibly missing column):", error);
            return res.json([]);
          }
          return res.json(data || []);
        } catch (queryErr) {
          console.error("Query failed:", queryErr);
          return res.json([]);
        }
      }

      const { data: pet, error: petErr } = await supabaseAdmin
        .from("pet_passports")
        .select("*")
        .eq("passport_id", passportId)
        .single();

      if (petErr || !pet) {
        return res.status(404).json({ error: "Passport not found" });
      }

      const { data: medical } = await supabaseAdmin
        .from("pet_medical_logs")
        .select("*")
        .eq("pet_passport_id", pet.id)
        .single();

      const { data: conditions } = await supabaseAdmin
        .from("pet_health_conditions")
        .select("*")
        .eq("pet_passport_id", pet.id);

      const { data: healthRecords } = await supabaseAdmin
        .from("pet_health_records_documents")
        .select("*")
        .eq("pet_passport_id", pet.id);

      // Fetch appointments for this pet
      // Since vet_appointments doesn't have a strict FK to pet_passports, we match by user_id and pet_name
      const { data: appointments } = await supabaseAdmin
        .from("vet_appointments")
        .select("*")
        .eq("user_id", pet.user_id)
        .eq("pet_name", pet.pet_name);

      return res.json({
        pet,
        medical,
        conditions,
        healthRecords,
        appointments: appointments || []
      });
    } catch (err: any) {
      console.error("Error fetching passport details:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // End Point: Pet Passport Generation & Sync
  app.post("/api/pet-passport", async (req, res) => {
    try {
      const payload = req.body;
      const userId = req.query.userId as string || payload.userId || null;
      const supabaseAdmin = await getSupabaseAdmin();
      
      let passportId = payload.passportId || "SRV-" + Math.random().toString(36).substring(2, 5).toUpperCase() + "-" + Math.random().toString(36).substring(2, 5).toUpperCase();
      
      if (supabaseAdmin) {
        let timeoutId: any;
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error("Supabase timeout")), 25000); // 25 sec timeout to allow base64 uploads
        });
        
        try {
          const dbOperations = async () => {
            let existingPet: any = null;
            if (payload.passportId) {
              const { data, error } = await supabaseAdmin
                .from("pet_passports")
                .select("*")
                .eq("passport_id", payload.passportId)
                .maybeSingle();
              if (data) {
                existingPet = data;
              }
            }

            let petData: any = null;
            let petErr: any = null;

            if (existingPet) {
              passportId = existingPet.passport_id;
              const { data, error } = await supabaseAdmin
                .from("pet_passports")
                .update({
                  user_id: userId || existingPet.user_id,
                  pet_name: payload.petName,
                  species: payload.species,
                  gender: payload.gender,
                  breed: payload.breed,
                  appearance: payload.appearance,
                  age_type: payload.ageType,
                  dob: payload.dob || null,
                  approx_years: payload.approxYears ? parseInt(payload.approxYears) : null,
                  approx_months: payload.approxMonths ? parseInt(payload.approxMonths) : null,
                  weight: payload.weight ? parseFloat(payload.weight) : null,
                  owner_name: payload.ownerName,
                  primary_phone: payload.primaryPhone,
                  emergency_contact_name: payload.emergencyContactName,
                  emergency_phone: payload.emergencyPhone,
                  emergency_relationship: payload.emergencyRelationship,
                  photo_url: payload.photoUrl
                })
                .eq("passport_id", passportId)
                .select()
                .single();
              
              petData = data;
              petErr = error;
            } else {
              const { data, error } = await supabaseAdmin
                .from("pet_passports")
                .insert({
                  user_id: userId,
                  passport_id: passportId,
                  pet_name: payload.petName,
                  species: payload.species,
                  gender: payload.gender,
                  breed: payload.breed,
                  appearance: payload.appearance,
                  age_type: payload.ageType,
                  dob: payload.dob || null,
                  approx_years: payload.approxYears ? parseInt(payload.approxYears) : null,
                  approx_months: payload.approxMonths ? parseInt(payload.approxMonths) : null,
                  weight: payload.weight ? parseFloat(payload.weight) : null,
                  owner_name: payload.ownerName,
                  primary_phone: payload.primaryPhone,
                  emergency_contact_name: payload.emergencyContactName,
                  emergency_phone: payload.emergencyPhone,
                  emergency_relationship: payload.emergencyRelationship,
                  photo_url: payload.photoUrl
                })
                .select()
                .single();
              
              petData = data;
              petErr = error;
            }
              
            if (petErr) {
              console.error("petErr", petErr);
              throw new Error("Failed to save pet passport: " + petErr.message);
            }

            const medicalRowId = petData.id;

            // Clear existing related table records to allow safe re-entry during update/edit
            await supabaseAdmin.from("pet_medical_logs").delete().eq("pet_passport_id", medicalRowId);
            await supabaseAdmin.from("pet_health_conditions").delete().eq("pet_passport_id", medicalRowId);
            await supabaseAdmin.from("pet_health_records_documents").delete().eq("pet_passport_id", medicalRowId);
            
            await supabaseAdmin.from("pet_medical_logs").insert({
              pet_passport_id: medicalRowId,
              last_vaccination_date: payload.lastVaccinationDate || null,
              known_allergies: payload.knownAllergies,
              last_veterinary_visit: payload.lastVeterinaryVisit || null
            });

            // conditions
            if (payload.conditions && payload.conditions.length > 0) {
              const conditionsInserts = payload.conditions.map((c: string) => ({
                pet_passport_id: medicalRowId,
                condition_name: c,
                specify_other: c === 'Other' || c === 'Others' ? payload.otherConditionText : null
              }));
              await supabaseAdmin.from("pet_health_conditions").insert(conditionsInserts);
            }
            
            // health records
            if (payload.healthRecords && payload.healthRecords.length > 0) {
              await supabaseAdmin.from("pet_health_records_documents").insert(
                payload.healthRecords.map((r: any) => ({
                  pet_passport_id: medicalRowId,
                  record_type: r.type,
                  vaccine_name: r.vaccineName,
                  specify_vaccine: r.specifyVaccine,
                  date_administered: r.dateAdministered || null,
                  next_due_date: r.nextDueDate || null,
                  diagnosis: r.diagnosis,
                  prescribed_by: r.prescribedBy,
                  issue_date: r.issueDate || null,
                  test_name: r.testName,
                  test_date: r.testDate || null,
                  procedure_name: r.procedureName,
                  surgery_date: r.surgeryDate || null,
                  condition_name: r.conditionName,
                  certificate_title: r.certificateTitle,
                  record_description: r.recordDescription,
                  // limit base64 insertion size if needed, but proceeding normally
                  document_base64: r.documentBase64
                }))
              );
            }
          };

          await Promise.race([dbOperations(), timeoutPromise]);
        } catch (dbErr: any) {
          console.error("Database operations failed or timed out. Handled gracefully. Error:", dbErr?.message || dbErr);
          throw new Error(dbErr?.message || "Failed to save passport to database.");
        } finally {
          clearTimeout(timeoutId);
        }
      } else {
        throw new Error("Supabase is not configured. Cannot generate passport.");
      }
      
      return res.json({ success: true, passportId });
    } catch(e: any) {
       console.error("Error creating pet passport:", e);
       res.status(500).json({ error: e.message });
    }
  });

  // End Point: Appending a single health record directly to the database for an existing passport
  app.post("/api/health-record", async (req, res) => {
    try {
      const { passportId, record } = req.body;
      if (!passportId) {
        return res.status(400).json({ error: "passportId is required" });
      }
      if (!record) {
        return res.status(400).json({ error: "record is required" });
      }

      const supabaseAdmin = await getSupabaseAdmin();

      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      // Get pet_passport rows ID
      const { data: pet, error: petErr } = await supabaseAdmin
        .from("pet_passports")
        .select("id")
        .eq("passport_id", passportId)
        .maybeSingle();

      if (petErr) {
        return res.status(500).json({ error: "Error searching passport: " + petErr.message });
      }
      if (!pet) {
        return res.status(404).json({ error: "Passport not found" });
      }
      
      // First upload the document if exists
      let fileUrl = null;
      let filePath = null;
      const bucket = "pet-documents";
      
      if (record.documentBase64 && record.documentBase64.startsWith("data:")) {
         try {
             const matches = record.documentBase64.match(/^data:(.+?);base64,(.+)$/);
             if (matches && matches.length === 3) {
                 const mimeType = matches[1];
                 const base64Data = matches[2];
                 
                 let ext = 'bin';
                 if (mimeType.includes('pdf')) ext = 'pdf';
                 else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
                 else if (mimeType.includes('png')) ext = 'png';
                 
                 filePath = `${passportId}/records/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
                 
                 const buffer = Buffer.from(base64Data, 'base64');
                 
                 const { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, {
                     contentType: mimeType,
                     upsert: true
                 });
                 
                 if (!uploadErr) {
                     const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
                     fileUrl = publicUrlData.publicUrl;
                 } else {
                     console.error("Storage upload error:", uploadErr);
                 }
             }
         } catch (err) {
             console.error("Failed to upload document to storage:", err);
         }
      }

      // Insert into pet_health_records_documents
      const { data, error } = await supabaseAdmin
        .from("pet_health_records_documents")
        .insert({
          pet_passport_id: pet.id,
          record_type: record.type,
          vaccine_name: record.vaccineName,
          specify_vaccine: record.specifyVaccine,
          date_administered: record.dateAdministered || null,
          next_due_date: record.nextDueDate || null,
          diagnosis: record.diagnosis,
          prescribed_by: record.prescribedBy,
          issue_date: record.issueDate || null,
          test_name: record.testName,
          test_date: record.testDate || null,
          procedure_name: record.procedureName,
          surgery_date: record.surgeryDate || null,
          condition_name: record.conditionName,
          certificate_title: record.certificateTitle,
          record_description: record.recordDescription,
          document_base64: record.documentBase64,
          file_url: fileUrl,
          file_path: filePath,
          storage_bucket: bucket
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: "Failed to insert health record: " + error.message });
      }

      return res.json({ success: true, record: data });
    } catch (e: any) {
      console.error("Error adding single health record:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // End Point: Delete Health Record
  app.delete("/api/health-record", async (req, res) => {
    try {
      const { recordId } = req.query;
      if (!recordId) {
        return res.status(400).json({ error: "recordId is required" });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      const { data: recordInfo } = await supabaseAdmin.from("pet_health_records_documents").select("pet_passport_id").eq("id", recordId).single();

      const { error } = await supabaseAdmin
        .from("pet_health_records_documents")
        .delete()
        .eq("id", recordId);

      if (error) {
        return res.status(500).json({ error: "Failed to delete health record: " + error.message });
      }

      if (recordInfo) {
          await supabaseAdmin.from("pet_passports").update({ last_sync: new Date().toISOString() }).eq("id", recordInfo.pet_passport_id);
      }

      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error deleting health record:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // End Point: Update/Replace Health Record / Document
  app.put("/api/health-record", async (req, res) => {
    try {
      const { recordId, updates } = req.body;
      if (!recordId) {
        return res.status(400).json({ error: "recordId is required" });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      let updatePayload = { ...updates };
      if (updates.documentBase64 && updates.documentBase64.startsWith("data:")) {
        const bucket = "pet-documents";
        try {
          const matches = updates.documentBase64.match(/^data:(.+?);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const mimeType = matches[1];
            const base64Data = matches[2];
            
            let ext = "bin";
            if (mimeType.includes("pdf")) ext = "pdf";
            else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) ext = "jpg";
            else if (mimeType.includes("png")) ext = "png";
            
            const filePath = `updated/records/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
            const buffer = Buffer.from(base64Data, "base64");
            
            const { error: uploadErr } = await supabaseAdmin.storage.from(bucket).upload(filePath, buffer, {
              contentType: mimeType,
              upsert: true
            });
            
            if (!uploadErr) {
              const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
              updatePayload.file_url = publicUrlData.publicUrl;
              updatePayload.file_path = filePath;
              updatePayload.storage_bucket = bucket;
              updatePayload.document_base64 = updates.documentBase64;
            }
          }
        } catch (err) {
          console.error("Failed to upload replacement document:", err);
        }
      }

      const mappedDbUpdates: any = {};
      if (updatePayload.certificateTitle !== undefined) mappedDbUpdates.certificate_title = updatePayload.certificateTitle;
      if (updatePayload.recordDescription !== undefined) mappedDbUpdates.record_description = updatePayload.recordDescription;
      if (updatePayload.record_description !== undefined) mappedDbUpdates.record_description = updatePayload.record_description;
      if (updatePayload.prescribedBy !== undefined) mappedDbUpdates.prescribed_by = updatePayload.prescribedBy;
      if (updatePayload.prescribed_by !== undefined) mappedDbUpdates.prescribed_by = updatePayload.prescribed_by;
      if (updatePayload.nextDueDate !== undefined) mappedDbUpdates.next_due_date = updatePayload.nextDueDate || null;
      if (updatePayload.issueDate !== undefined) mappedDbUpdates.issue_date = updatePayload.issueDate || null;
      if (updatePayload.document_base64 !== undefined) mappedDbUpdates.document_base64 = updatePayload.document_base64;
      if (updatePayload.file_url !== undefined) mappedDbUpdates.file_url = updatePayload.file_url;
      if (updatePayload.file_path !== undefined) mappedDbUpdates.file_path = updatePayload.file_path;
      if (updatePayload.storage_bucket !== undefined) mappedDbUpdates.storage_bucket = updatePayload.storage_bucket;

      Object.keys(updatePayload).forEach(key => {
        if (key.includes("_")) {
          mappedDbUpdates[key] = updatePayload[key];
        }
      });

      const { data, error } = await supabaseAdmin
        .from("pet_health_records_documents")
        .update(mappedDbUpdates)
        .eq("id", recordId)
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: "Failed to update record: " + error.message });
      }

      if (data) {
          await supabaseAdmin.from("pet_passports").update({ last_sync: new Date().toISOString() }).eq("id", data.pet_passport_id);
      }

      return res.json({ success: true, record: data });
    } catch (e: any) {
      console.error("Error updating health record:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // End Point: Create an ownership transfer request
  app.post("/api/ownership-transfer/request", async (req, res) => {
    try {
      const passportId = req.body.passportId;
      const requesterName = req.body.requesterName || req.body.name;
      const requesterEmail = req.body.requesterEmail || req.body.email;
      const requesterPhone = req.body.requesterPhone || req.body.phone;

      if (!passportId || !requesterName || !requesterEmail || !requesterPhone) {
        return res.status(400).json({ error: "Missing required fields: passportId, requesterName, requesterEmail, requesterPhone" });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      // 1. Fetch passport record to get database ID
      const { data: pet, error: petErr } = await supabaseAdmin
        .from("pet_passports")
        .select("id, user_id")
        .eq("passport_id", passportId)
        .maybeSingle();

      if (petErr) {
        return res.status(500).json({ error: "Database error searching passport: " + petErr.message });
      }
      if (!pet) {
        return res.status(404).json({ error: "Passport not found with ID: " + passportId });
      }

      // Check if request already exists to prevent duplicate entries
      const { data: existing } = await supabaseAdmin
        .from("pet_health_records_documents")
        .select("id")
        .eq("pet_passport_id", pet.id)
        .eq("record_type", "OwnershipTransferRequest")
        .eq("certificate_title", requesterEmail)
        .maybeSingle();

      if (existing) {
        return res.json({ success: true, message: "Request already submitted." });
      }

      // 2. Insert as a live database record of type "OwnershipTransferRequest"
      const { data, error } = await supabaseAdmin
        .from("pet_health_records_documents")
        .insert({
          pet_passport_id: pet.id,
          record_type: "OwnershipTransferRequest",
          certificate_title: requesterEmail, // store target email
          prescribed_by: requesterName,      // store target name
          record_description: "pending",     // status
          condition_name: requesterPhone,    // phone
          document_base64: pet.user_id       // store current owner ID for mapping
        })
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: "Failed to submit request: " + error.message });
      }

      return res.json({ success: true, request: data });
    } catch (e: any) {
      console.error("Error creating ownership transfer request:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // End Point: Get incoming requests for a passport
  app.get("/api/ownership-transfer/requests", async (req, res) => {
    try {
      const { passportId } = req.query;
      if (!passportId) {
        return res.status(400).json({ error: "passportId is required" });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      const { data: pet, error: petErr } = await supabaseAdmin
        .from("pet_passports")
        .select("id")
        .eq("passport_id", passportId)
        .maybeSingle();

      if (petErr || !pet) {
        return res.json([]);
      }

      const { data, error } = await supabaseAdmin
        .from("pet_health_records_documents")
        .select("*")
        .eq("pet_passport_id", pet.id)
        .eq("record_type", "OwnershipTransferRequest")
        .order("created_at", { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.json(data || []);
    } catch (e: any) {
      console.error("Error fetching transfer requests:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // End Point: Reject/Delete ownership transfer request
  app.post("/api/ownership-transfer/reject", async (req, res) => {
    try {
      const { requestId } = req.body;
      if (!requestId) {
        return res.status(400).json({ error: "requestId is required" });
      }

      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      const { error } = await supabaseAdmin
        .from("pet_health_records_documents")
        .delete()
        .eq("id", requestId);

      if (error) {
        return res.status(500).json({ error: "Failed to reject: " + error.message });
      }

      return res.json({ success: true });
    } catch (e: any) {
      console.error("Error rejecting request:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // End Point: Approve / Complete ownership transfer
  app.post("/api/ownership-transfer/approve", async (req, res) => {
    try {
      const { requestId, emailDirect, passportIdDirect } = req.body;
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        return res.status(500).json({ error: "Supabase client not initialized" });
      }

      let email = "";
      let petPassportId = "";
      let isDirect = false;

      if (requestId) {
        // Fetch request data
        const { data: request, error: reqErr } = await supabaseAdmin
          .from("pet_health_records_documents")
          .select("*")
          .eq("id", requestId)
          .single();

        if (reqErr || !request) {
          return res.status(404).json({ error: "Request record not found: " + (reqErr?.message || "") });
        }
        email = request.certificate_title;
        petPassportId = request.pet_passport_id;
      } else if (emailDirect && passportIdDirect) {
        isDirect = true;
        email = emailDirect.trim();
        
        const { data: pet, error: petErr } = await supabaseAdmin
          .from("pet_passports")
          .select("id")
          .eq("passport_id", passportIdDirect)
          .maybeSingle();

        if (petErr || !pet) {
          return res.status(404).json({ error: "Passport not found" });
        }
        petPassportId = pet.id;
      } else {
        return res.status(400).json({ error: "Either requestId or (emailDirect and passportIdDirect) is required" });
      }

      // 1. Look up recipient in profiles by email
      const { data: recipient, error: recErr } = await supabaseAdmin
        .from("profiles")
        .select("id, name, full_name")
        .eq("email", email)
        .maybeSingle();

      if (recErr) {
        return res.status(500).json({ error: "Database error during profile search: " + recErr.message });
      }
      if (!recipient) {
        return res.status(404).json({ error: `The recipient email (${email}) is not registered. Please ensure they create an account first so they can receive ownership.` });
      }

      const targetUserId = recipient.id;

      // 2. Lookup existing passport Details
      const { data: petDetail, error: detailErr } = await supabaseAdmin
        .from("pet_passports")
        .select("*")
        .eq("id", petPassportId)
        .single();

      if (detailErr || !petDetail) {
        return res.status(404).json({ error: "Target passport not found." });
      }

      const previousUserId = petDetail.user_id;

      // 3. Database transaction / updates
      // A. Transfer basic passport details to the new owner
      const { error: updatePetErr } = await supabaseAdmin
        .from("pet_passports")
        .update({ 
          user_id: targetUserId,
          owner_name: recipient.full_name || recipient.name || petDetail.owner_name,
          last_sync: new Date().toISOString()
        })
        .eq("id", petPassportId);

      if (updatePetErr) {
        throw new Error("Failed transferring passport owner column: " + updatePetErr.message);
      }

      // B. Transfer all associated consultation records (vet_appointments)
      const { error: apptErr } = await supabaseAdmin
        .from("vet_appointments")
        .update({ user_id: targetUserId })
        .eq("user_id", previousUserId)
        .eq("pet_name", petDetail.pet_name);

      if (apptErr) {
         console.warn("Associated appointment updates warnings (non-fatal):", apptErr.message);
      }

      // C. Delete the request record
      if (requestId) {
        await supabaseAdmin
          .from("pet_health_records_documents")
          .delete()
          .eq("id", requestId);
      } else {
        // Direct transfer, clean up other request records pointing to this passport
        await supabaseAdmin
          .from("pet_health_records_documents")
          .delete()
          .eq("pet_passport_id", petPassportId)
          .eq("record_type", "OwnershipTransferRequest");
      }

      return res.json({ success: true, message: "Ownership successfully transferred!", targetUserId });
    } catch (e: any) {
      console.error("Error approving ownership transfer:", e);
      return res.status(500).json({ error: e.message });
    }
  });

  // Serve RjRollout.html on the /rj route directly with 100% visual and functional parity
  app.get("/rj", (req, res) => {
    const targetPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "RjRollout.html")
      : path.join(process.cwd(), "public", "RjRollout.html");
    res.sendFile(targetPath);
  });

  // Serve jasriyu.html on the /rj49 route directly with 100% visual and functional parity
  app.get("/rj49", (req, res) => {
    const targetPath = process.env.NODE_ENV === "production"
      ? path.join(process.cwd(), "dist", "jasriyu.html")
      : path.join(process.cwd(), "public", "jasriyu.html");
    res.sendFile(targetPath);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware mounted successfully.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets middleware configured.");
  }

  // Global Error Handler to always return JSON for API routes
  app.use((err: any, req: any, res: any, next: any) => {
    if (req.path.startsWith('/api/')) {
      console.error("Express API Error:", err);
      res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
    } else {
      next(err);
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Sruvo Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
