import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import crypto from "crypto";
import { runSmartMatch } from "./src/utils/smartMatchEngine.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

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
      const ai = new GoogleGenAI({ apiKey });

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

      const response = await ai.models.generateContent({
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
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Generate pet care insights for a ${ageMonths} month old ${gender || "unknown"} ${breed} (${category}). 
Provide data for two categories: Quick Facts and Deep Dive.
Quick Facts should cover nutrition, activity, and lifespan.
Deep Dive should cover health, training, and grooming.
Keep descriptions concise (max 2 sentences).`;

      const response = await ai.models.generateContent({
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

  // End Point: Sruvo Smart Match — Phase 1 Foundation
  app.post("/api/smart-match", async (req, res) => {
    console.log("[SmartMatch] ==========================================");
    console.log("[SmartMatch] [Log 1/8] Request Received");

    try {
      const payload = req.body;
      console.log("[SmartMatch] [Log 2/8] Raw Payload Received:", JSON.stringify(payload, null, 2));

      // 1. Validate payload shape
      if (!payload) {
        console.warn("[SmartMatch] [Log 3/8] Payload Validation Result: FAILED (Empty payload)");
        return res.status(400).json({ success: false, error: "Empty payload received" });
      }

      const { pet, concerns, healthBackground, currentHealthStatus, mediaFiles } = payload;

      if (!pet || !pet.species || !pet.name) {
        console.warn("[SmartMatch] [Log 3/8] Payload Validation Result: FAILED (Missing basic pet details like species or name)");
        return res.status(400).json({ success: false, error: "Missing pet details (name, species are required)" });
      }

      console.log("[SmartMatch] [Log 3/8] Payload Validation Result: SUCCESS");

      // 2. Normalize the request
      const rawSpecies = pet.species ? String(pet.species).trim() : "";
      let canonicalSpecies = rawSpecies.charAt(0).toUpperCase() + rawSpecies.slice(1).toLowerCase();
      if (canonicalSpecies === "Guineapig") canonicalSpecies = "Guineapigs";
      if (canonicalSpecies === "Rabbit") canonicalSpecies = "Rabbits";

      // Extract main concern from Step 2 QA list
      const concernQA = concerns?.find((qa: any) => qa.question && qa.question.includes("What is your main concern today?"));
      const rawConcern = concernQA ? concernQA.answer : "Other";

      // Determine canonical concern enum or freeform keyword
      const VALID_CONCERN_ENUMS = [
        "Vomiting",
        "Diarrhea",
        "Loss of Appetite",
        "Itching / Skin Issues",
        "Eye Problems",
        "Ear Problems",
        "Coughing / Breathing Issues",
        "Injury / Wound",
        "Mobility Issues",
        "Behavior Changes",
        "Other"
      ];

      let canonicalConcern = "Other";
      let freeformKeyword = "";

      if (VALID_CONCERN_ENUMS.includes(rawConcern)) {
        canonicalConcern = rawConcern;
      } else {
        canonicalConcern = "Other";
        freeformKeyword = rawConcern; // 12th option: freeform input text
      }

      const normalizedRequest = {
        petDetails: {
          name: pet.name,
          species: canonicalSpecies,
          rawSpecies: rawSpecies,
          breed: pet.breed || "Unknown",
          age: pet.age || "Unknown",
          gender: pet.gender || "Unknown",
          weight: pet.weight || "Unknown"
        },
        mainConcern: canonicalConcern,
        freeformKeyword: freeformKeyword,
        followUpAnswers: concerns?.filter((qa: any) => qa.question && !qa.question.includes("What is your main concern today?")) || [],
        healthBackground: healthBackground || [],
        currentHealthStatus: currentHealthStatus || [],
        mediaReferences: mediaFiles || []
      };

      console.log("[SmartMatch] [Log 4/8] Normalized Payload:", JSON.stringify(normalizedRequest, null, 2));

      // 3. Connect to database
      console.log("[SmartMatch] [Log 5/8] Connecting to database...");
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        console.error("[SmartMatch] Database connection result: FAILED");
        throw new Error("Failed to connect to database");
      }
      console.log("[SmartMatch] Database connection result: SUCCESS");

      // 3.1 Fetch user pincode and geographic coordinates
      let userPincode = "";
      let userLat: number | null = null;
      let userLon: number | null = null;
      const dbUserId = (payload.userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(payload.userId)) ? payload.userId : null;
      if (dbUserId) {
        const { data: addrData } = await supabaseAdmin
          .from("addresses")
          .select("pincode, latitude, longitude")
          .eq("user_id", dbUserId)
          .eq("is_default", true)
          .maybeSingle();
        if (addrData) {
          if (addrData.pincode) userPincode = addrData.pincode;
          if (addrData.latitude !== undefined && addrData.latitude !== null) userLat = Number(addrData.latitude);
          if (addrData.longitude !== undefined && addrData.longitude !== null) userLon = Number(addrData.longitude);
        } else {
          const { data: anyAddr } = await supabaseAdmin
            .from("addresses")
            .select("pincode, latitude, longitude")
            .eq("user_id", dbUserId)
            .limit(1)
            .maybeSingle();
          if (anyAddr) {
            if (anyAddr.pincode) userPincode = anyAddr.pincode;
            if (anyAddr.latitude !== undefined && anyAddr.latitude !== null) userLat = Number(anyAddr.latitude);
            if (anyAddr.longitude !== undefined && anyAddr.longitude !== null) userLon = Number(anyAddr.longitude);
          }
        }
      }
      console.log(`[SmartMatch] User resolved Pincode: ${userPincode || "NONE"}, Lat: ${userLat || "NONE"}, Lon: ${userLon || "NONE"}`);

      // 3.2 Fetch only candidate veterinarians using database-level filtering
      console.log(`[SmartMatch] Fetching filtered veterinarians with species: ${canonicalSpecies}, lat: ${userLat}, lon: ${userLon}`);
      let { data: vetProfiles, error: fetchErr } = await supabaseAdmin
        .rpc("get_candidate_vets", {
          p_species: canonicalSpecies,
          p_consultation_type: payload.consultationType || "instant",
          p_user_lat: userLat,
          p_user_lon: userLon,
          p_user_pincode: userPincode,
          p_limit: 100
        });

      if (fetchErr || !vetProfiles || vetProfiles.length === 0) {
        console.warn("[SmartMatch] get_candidate_vets RPC failed or returned 0 rows. Running lenient fallback query...");
        // Fallback: direct select on vet_profiles with active & verified filters
        const fallbackQuery = supabaseAdmin
          .from("vet_profiles")
          .select("*")
          .eq("is_active", true)
          .in("verification_status", ["verified", "approved"]);
        
        const { data: fallbackVets, error: fallbackErr } = await fallbackQuery;
        if (fallbackErr) {
          console.error("[SmartMatch] Fallback query failed:", fallbackErr);
          throw fallbackErr;
        }
        vetProfiles = fallbackVets;
      }

      let rawVets = vetProfiles || [];
      const shortlistedVetUserIds = rawVets.map((v: any) => v.user_id);

      // 3.3 Fetch active/non-cancelled booked appointments ONLY for the shortlisted veterinarians and required range
      let activeAppointments: any[] = [];
      if (shortlistedVetUserIds.length > 0) {
        const todayStr = new Date().toISOString().split("T")[0];
        const requestedDateStr = payload.requestedDate || todayStr;
        const startDate = requestedDateStr < todayStr ? requestedDateStr : todayStr;
        
        // End date is 8 days after requestedDate or today, whichever is later
        const baseDate = new Date(requestedDateStr > todayStr ? requestedDateStr : todayStr);
        baseDate.setDate(baseDate.getDate() + 8);
        const endDate = baseDate.toISOString().split("T")[0];

        console.log(`[SmartMatch] Fetching booked appointments between ${startDate} and ${endDate} for ${shortlistedVetUserIds.length} vets.`);

        const { data: bookedAppointments, error: apptErr } = await supabaseAdmin
          .from("vet_appointments")
          .select("*")
          .in("vet_id", shortlistedVetUserIds)
          .gte("appointment_date", startDate)
          .lte("appointment_date", endDate)
          .not("status", "in", '("cancelled", "completed", "rejected", "done", "Canceled", "Cancelled", "Completed")');

        if (apptErr) {
          console.error("[SmartMatch] Fetching filtered appointments failed:", apptErr);
        } else {
          activeAppointments = bookedAppointments || [];
        }
      }
      console.log(`[SmartMatch] Fetched ${activeAppointments.length} relevant active bookings to prevent overlaps.`);

      // 4. Fetch corresponding user profiles for the shortlisted veterinarians
      if (rawVets.length > 0) {
        const userIds = rawVets.map((v: any) => v.user_id);
        const { data: profiles, error: profileErr } = await supabaseAdmin
          .from("profiles")
          .select("id, name, full_name, profile_photo, is_admin_approved, role")
          .in("id", userIds);

        if (profileErr) {
          console.error("[SmartMatch] Fetching profiles failed in SmartMatch endpoint:", profileErr);
        } else {
          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
          rawVets = rawVets.map((v: any) => ({
            ...v,
            profile: profileMap.get(v.user_id) || null
          }));
        }
      }

      const totalFetched = rawVets.length;
      console.log(`[SmartMatch] [Log 6/8] Total Veterinarians Fetched: ${totalFetched}`);

      const enrichedRequest = {
        ...normalizedRequest,
        consultationType: payload.consultationType || "instant",
        requestedDate: payload.requestedDate || "",
        requestedTime: payload.requestedTime || "",
        userPincode: userPincode,
        activeAppointments: activeAppointments,
        userLat: userLat,
        userLon: userLon
      };

      let matchResult: any = null;
      let lockSucceeded = false;
      let attemptVets = [...rawVets];
      let maxAttempts = 5;
      let attempts = 0;

      while (attempts < maxAttempts && attemptVets.length > 0) {
        attempts++;
        matchResult = runSmartMatch(enrichedRequest, attemptVets);
        
        if (!matchResult.bestVet || !matchResult.bestVet.suggestedSlot) {
          // No more suitable vets or no slots left
          break;
        }

        const slot = matchResult.bestVet.suggestedSlot;
        
        // Release expired slot locks (pending_payment older than 10 minutes)
        const tenMinsAgoISO = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const { error: deleteErr } = await supabaseAdmin
          .from("vet_appointments")
          .delete()
          .eq("status", "pending_payment")
          .lt("created_at", tenMinsAgoISO);

        if (deleteErr) {
          console.warn("[SmartMatch Lock] Failed to release expired slot locks:", deleteErr.message);
        }

        // Pre-check if slot is still free (Check -> Lock -> Reserve flow)
        const { data: existingAppt } = await supabaseAdmin
          .from("vet_appointments")
          .select("id")
          .eq("vet_id", matchResult.bestVet.user_id)
          .eq("appointment_date", slot.date)
          .eq("appointment_time", slot.time)
          .not("status", "in", '("cancelled", "completed", "rejected", "done", "Canceled", "Cancelled", "Completed")')
          .maybeSingle();

        if (existingAppt) {
          console.warn(`[SmartMatch Lock] Slot already booked on pre-check. Retrying with next highest-ranked vet...`);
          const failedVetId = matchResult.bestVet.user_id;
          attemptVets = attemptVets.filter((v: any) => v.user_id !== failedVetId);
          continue;
        }

        const lockPayload = {
          vet_id: matchResult.bestVet.user_id,
          user_id: dbUserId || "f9834ef6-778d-4384-8d17-6316fffa03b6",
          appointment_date: slot.date,
          appointment_time: slot.time,
          appointment_type: payload.consultationType === "future" ? "Scheduled Consultation" : "Instant Consultation",
          amount: matchResult.bestVet.online_fee || 500,
          status: "pending_payment",
          pet_name: normalizedRequest.petDetails.name || "Pet",
          pet_type: normalizedRequest.petDetails.species || "Dog",
          pet_breed: normalizedRequest.petDetails.breed || "Unknown"
        };

        // Insert new slot lock. Rely on PostgreSQL's uq_active_vet_appointments unique index for atomic concurrency protection.
        const { error: lockErr } = await supabaseAdmin
          .from("vet_appointments")
          .insert(lockPayload);

        if (lockErr) {
          console.warn(`[SmartMatch Lock] DB level conflict (double-booking protection): ${lockErr.message}. Retrying with next highest-ranked vet...`);
          const failedVetId = matchResult.bestVet.user_id;
          attemptVets = attemptVets.filter((v: any) => v.user_id !== failedVetId);
        } else {
          console.log("[SmartMatch Lock] Slot successfully reserved in vet_appointments database:", lockPayload);
          lockSucceeded = true;
          break;
        }
      }

      return res.json({
        success: true,
        normalizedRequest: normalizedRequest,
        totalFetched: totalFetched,
        veterinarians: rawVets,
        matchResult: matchResult
      });

    } catch (err: any) {
      console.error("[SmartMatch] Endpoint experienced an error:", err);
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

      // Fetch vet profiles to run the match and build Audit Log
      const { data: vetProfiles } = await supabaseAdmin.from("vet_profiles").select("*");
      let auditLog: any = null;
      let matchedVetId: string | null = null;
      let matchScore: number | null = null;

      if (vetProfiles && vetProfiles.length > 0) {
        // Resolve user pincode
        let userPincode = "";
        if (dbUserId) {
          const { data: addrData } = await supabaseAdmin
            .from("addresses")
            .select("pincode")
            .eq("user_id", dbUserId)
            .eq("is_default", true)
            .maybeSingle();
          if (addrData && addrData.pincode) {
            userPincode = addrData.pincode;
          }
        }

        // Fetch active appointments
        const { data: bookedAppointments } = await supabaseAdmin
          .from("vet_appointments")
          .select("*")
          .not("status", "in", '("cancelled", "completed", "rejected", "done", "Canceled", "Cancelled", "Completed")');

        const activeAppointments = bookedAppointments || [];

        // Build mock profiles user_id map for matching profiles
        const userIds = vetProfiles.map((v: any) => v.user_id);
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, name, full_name, profile_photo, is_admin_approved, role")
          .in("id", userIds);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        const rawVets = vetProfiles.map((v: any) => ({
          ...v,
          profile: profileMap.get(v.user_id) || null
        }));

        const rawSpecies = payload.pet?.species ? String(payload.pet.species).trim() : "";
        let canonicalSpecies = rawSpecies.charAt(0).toUpperCase() + rawSpecies.slice(1).toLowerCase();
        if (canonicalSpecies === "Guineapig") canonicalSpecies = "Guineapigs";
        if (canonicalSpecies === "Rabbit") canonicalSpecies = "Rabbits";

        const concernQA = payload.concerns?.find((qa: any) => qa.question && qa.question.includes("What is your main concern today?"));
        const rawConcern = concernQA ? concernQA.answer : "Other";

        const VALID_CONCERN_ENUMS = [
          "Vomiting", "Diarrhea", "Loss of Appetite", "Itching / Skin Issues",
          "Eye Problems", "Ear Problems", "Coughing / Breathing Issues",
          "Injury / Wound", "Mobility Issues", "Behavior Changes", "Other"
        ];

        let canonicalConcern = "Other";
        let freeformKeyword = "";
        if (VALID_CONCERN_ENUMS.includes(rawConcern)) {
          canonicalConcern = rawConcern;
        } else {
          canonicalConcern = "Other";
          freeformKeyword = rawConcern;
        }

        const normalizedRequest = {
          petDetails: {
            name: payload.pet?.name || "",
            species: canonicalSpecies,
            rawSpecies: rawSpecies,
            breed: payload.pet?.breed || "Unknown",
            age: payload.pet?.age || "Unknown",
            gender: payload.pet?.gender || "Unknown",
            weight: payload.pet?.weight || "Unknown"
          },
          mainConcern: canonicalConcern,
          freeformKeyword: freeformKeyword,
          followUpAnswers: payload.concerns?.filter((qa: any) => qa.question && !qa.question.includes("What is your main concern today?")) || [],
          healthBackground: payload.healthBackground || [],
          currentHealthStatus: payload.currentHealthStatus || [],
          mediaReferences: payload.mediaFiles || [],
          consultationType: payload.consultationType || "instant",
          requestedDate: payload.requestedDate || "",
          requestedTime: payload.requestedTime || "",
          userPincode: userPincode,
          activeAppointments: activeAppointments
        };

        const matchResult = runSmartMatch(normalizedRequest, rawVets);
        if (matchResult && matchResult.bestVet) {
          auditLog = matchResult.auditLog;
          matchedVetId = matchResult.bestVet.id;
          matchScore = matchResult.score;
        }
      }

      const generateFallbackUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      // Safe fallback using standard UUID
      const finalAssessmentId = payload.sessionId || generateFallbackUUID();

      // We attempt to save into the requested 'buyer_smart_match' table first.
      const smartMatchRecord: any = {
          id: finalAssessmentId,
          user_id: dbUserId,
          pet_passport_id: petPassportId,
          pet_name: petName || null,
          step1_pet_details: payload.pet || {},
          step2_concerns: payload.concerns || [],
          step3_health_background: payload.healthBackground || [],
          step4_current_health_status: payload.currentHealthStatus || [],
          step5_photos_videos: payload.mediaFiles || [],
          step6_review_data: {
             ...(payload.reviewData || {}),
             auditLog: auditLog
          },
          status: "submitted",
          updated_at: new Date().toISOString()
      };

      // Add audit log fields directly if custom columns exist
      const smartMatchRecordWithColumns = {
          ...smartMatchRecord,
          matched_vet_id: matchedVetId,
          match_score: matchScore,
          audit_log: auditLog
      };

      let { error: insertErr } = await supabaseAdmin
        .from("buyer_smart_match")
        .upsert(smartMatchRecordWithColumns, { onConflict: "id" });

      if (insertErr && (insertErr.code === '42703' || insertErr.message?.includes('column'))) {
         console.warn("[SmartMatch Save] Column does not exist, retrying with fallback schema...", insertErr.message);
         const { error: fallbackErr } = await supabaseAdmin
           .from("buyer_smart_match")
           .upsert(smartMatchRecord, { onConflict: "id" });
         insertErr = fallbackErr;
      }

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
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Provide nutrition and wellness insights for a pet product:
Name: ${name}
Brand: ${brand}
Type: ${pet_type}
Category: ${category}
Ingredients: ${ingredients?.join(", ") || "N/A"}
Highlights: ${highlights?.join(", ") || "N/A"}

Keep descriptions concise (max 2 sentences).`;

      const response = await ai.models.generateContent({
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
        const ai = new GoogleGenAI({ apiKey });

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

        const response = await ai.models.generateContent({
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
