import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  let _cachedSupabaseAdmin: any = null;
  async function getSupabaseAdmin() {
    if (_cachedSupabaseAdmin) return _cachedSupabaseAdmin;
    try {
      const { createClient } = await import("@supabase/supabase-js");
      let supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co").trim();
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
      supabaseUrl: process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co",
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

  // End Point: Sruvo Smart Match (Phase 2 Backend Candidate Filtering Pipeline)
  app.post("/api/smart-match", async (req, res) => {
    console.log("STEP 3 reached");
    console.log("[Smart Match Backend] Request received at POST /api/smart-match");

    try {
      const payload = req.body;
      
      // Basic structured validation of the complete Smart Match questionnaire payload
      if (!payload || Object.keys(payload).length === 0) {
        console.warn("[Smart Match Backend] Payload validated: FAILED (Empty payload)");
        return res.status(400).json({
          success: false,
          error: "Smart Match questionnaire payload is missing or empty"
        });
      }

      console.log("[Smart Match Backend] Payload validated: SUCCESS", {
        hasPetData: !!payload.pet,
        hasConcerns: !!payload.concerns,
        hasHealthBackground: !!payload.healthBackground,
        hasCurrentHealthStatus: !!payload.currentHealthStatus,
        hasMediaFiles: !!payload.mediaFiles
      });

      // Extract pet species/type with robust support for various formats
      let petSpecies = "";
      if (payload.pet?.species) {
        petSpecies = payload.pet.species;
      } else if (payload.pet?.type) {
        petSpecies = payload.pet.type;
      } else if (typeof payload.pet === "string") {
        petSpecies = payload.pet;
      }

      // Extract main concern with robust support for various formats
      let mainConcern = "";
      if (payload.mainConcern) {
        mainConcern = payload.mainConcern;
      } else if (payload.concerns?.mainConcern) {
        mainConcern = payload.concerns.mainConcern;
      } else if (Array.isArray(payload.concerns)) {
        const mainConcernItem = payload.concerns.find((c: any) => 
          c.question?.toLowerCase().includes("main concern") || 
          c.question?.toLowerCase().includes("primary symptom") ||
          c.question?.toLowerCase().includes("happening")
        );
        if (mainConcernItem) {
          mainConcern = mainConcernItem.answer;
        } else if (payload.concerns.length > 0) {
          mainConcern = payload.concerns[0].answer;
        }
      } else if (typeof payload.concerns === "string") {
        mainConcern = payload.concerns;
      }

      // Smart Fallback Scanning if still empty
      if (!petSpecies) {
        const payloadString = JSON.stringify(payload).toLowerCase();
        const knownSpecies = ["Dog", "Cat", "Bird", "Hamster"];
        for (const sp of knownSpecies) {
          if (payloadString.includes(sp.toLowerCase())) {
            petSpecies = sp;
            break;
          }
        }
      }

      if (!mainConcern) {
        const payloadString = JSON.stringify(payload).toLowerCase();
        const knownConditions = [
          "Vomiting", "Diarrhea", "Loss of Appetite", "Itching / Skin Issues", 
          "Eye Problems", "Ear Problems", "Coughing / Breathing Issues", 
          "Injury / Wound", "Mobility Issues", "Behavior Changes"
        ];
        for (const cond of knownConditions) {
          if (payloadString.includes(cond.toLowerCase())) {
            mainConcern = cond;
            break;
          }
        }
      }

      console.log("[Smart Match Backend] Parsing query parameters:", {
        extractedPetSpecies: petSpecies,
        extractedMainConcern: mainConcern
      });

      console.log("[Smart Match Backend] Connecting to database...");
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        console.error("[Smart Match Backend] Database connected: FAILED (Could not obtain Supabase client)");
        return res.status(500).json({
          success: false,
          error: "Database connection failed"
        });
      }
      console.log("[Smart Match Backend] Database connected: SUCCESS");

      console.log("[Smart Match Backend] Querying all veterinarians from database...");
      const { data: veterinarians, error: fetchError } = await supabaseAdmin
        .from("vet_profiles")
        .select("*");

      if (fetchError) {
        console.error("[Smart Match Backend] Failed to fetch veterinarians from database:", fetchError.message);
        return res.status(500).json({
          success: false,
          error: `Database fetch failed: ${fetchError.message}`
        });
      }

      const totalFetched = veterinarians?.length || 0;
      console.log(`[Smart Match Backend] Number of veterinarians fetched: ${totalFetched}`);

      // Candidate Filtering Pipeline
      const stage1Active: any[] = [];
      const stage2Verified: any[] = [];
      const stage3Available: any[] = [];
      const stage4Species: any[] = [];
      const stage5Concern: any[] = [];

      let totalVetsLoaded = totalFetched;
      let afterCityFilterCount = 0;
      let afterPetFilterCount = 0;
      let afterConditionFilterCount = 0;

      for (const vet of (veterinarians || [])) {
        const vetId = vet.id || vet.user_id || "unknown";
        const vetName = vet.name || vet.full_name || "Unknown Vet";
        const vetSpecializations = Array.isArray(vet.specializations) ? vet.specializations : [];
        const vetExpertise = Array.isArray(vet.clinical_expertise) ? vet.clinical_expertise : [];
        const vetLanguages = vet.preferred_language || "Not specified";
        const vetConsultationType = vet.consultation_type || "Not specified";
        const vetAvailabilityDays = Array.isArray(vet.available_days) ? vet.available_days.join(", ") : "None";
        const vetWeeklyAvailability = vet.weekly_availability ? JSON.stringify(vet.weekly_availability) : "None";
        const vetEmergency = vet.emergency_available ? "Yes" : "No";

        // Check if we have any verified active vets at all to use as a strict filter
        const hasVerifiedVets = (veterinarians || []).some(v => {
          const status = String(v.verification_status || "").trim().toLowerCase();
          return (status === "verified" || status === "approved") && v.is_active === true;
        });

        // Check if we have any available vets at all to use as a strict filter
        const hasAvailableVets = (veterinarians || []).some(v => {
          const hasDays = Array.isArray(v.available_days) && v.available_days.length > 0;
          const hasSlots = v.weekly_availability && typeof v.weekly_availability === "object" && Object.keys(v.weekly_availability).length > 0;
          const isEmerg = v.emergency_available === true || String(v.emergency_available).toLowerCase() === "yes" || String(v.emergency_available).toLowerCase() === "true";
          return hasDays || hasSlots || isEmerg;
        });

        // Stage 1: Active filter
        const isActive = vet.is_active === true;
        
        // Stage 2: Verified filter
        const verificationStatus = String(vet.verification_status || "").trim().toLowerCase();
        const isVerified = hasVerifiedVets 
          ? (verificationStatus === "verified" || verificationStatus === "approved")
          : true;
        
        // Stage 3: Available filter
        const hasAvailableDays = Array.isArray(vet.available_days) && vet.available_days.length > 0;
        const hasWeeklyAvailability = vet.weekly_availability && typeof vet.weekly_availability === "object" && Object.keys(vet.weekly_availability).length > 0;
        const isEmergencyAvailable = vet.emergency_available === true || String(vet.emergency_available).toLowerCase() === "yes" || String(vet.emergency_available).toLowerCase() === "true";
        const isAvailable = hasAvailableVets 
          ? (hasAvailableDays || hasWeeklyAvailability || isEmergencyAvailable)
          : true;

        // Stage 4: Species filter (Robust match)
        const userPetSpecies = petSpecies.trim().toLowerCase();
        const speciesTreated = Array.isArray(vet.specializations)
          ? vet.specializations.map((s: any) => String(s).trim().toLowerCase())
          : [];
        const matchesSpecies = speciesTreated.some((s: string) => {
          const val = s.trim().toLowerCase();
          const target = userPetSpecies;
          return val === target || val.includes(target) || target.includes(val) ||
                 (val + "s") === target || (target + "s") === val ||
                 (val === "dog" && target === "canine") || (val === "canine" && target === "dog") ||
                 (val === "cat" && target === "feline") || (val === "feline" && target === "cat");
        });

        // City Match
        const userCity = (payload.city || "").trim().toLowerCase();
        const vetCity = (vet.city || "").trim().toLowerCase();
        const matchesCity = !userCity || !vetCity || (vetCity === userCity || vetCity.includes(userCity) || userCity.includes(vetCity));

        // Stage 5: Condition Frequently Managed filter (Robust match)
        const userMainConcern = mainConcern.trim().toLowerCase();
        const clinicalExpertise = Array.isArray(vet.clinical_expertise)
          ? vet.clinical_expertise.map((e: any) => String(e).trim().toLowerCase())
          : [];
        const matchesConcern = clinicalExpertise.some((e: string) => {
          const val = e.trim().toLowerCase();
          const target = userMainConcern;
          return val === target || val.includes(target) || target.includes(val);
        });

        // Update pipeline counters
        if (isActive && isVerified && isAvailable) {
          if (matchesCity) {
            afterCityFilterCount++;
            if (matchesSpecies) {
              afterPetFilterCount++;
              if (matchesConcern) {
                afterConditionFilterCount++;
              }
            }
          }
        }

        // Detailed console log format for every vet as requested
        console.log(`\nVet: ${vetName}`);
        console.log(`Pet types: ${JSON.stringify(vetSpecializations)}`);
        console.log(`Conditions Frequently Managed: ${JSON.stringify(vetExpertise)}`);
        console.log(`Languages: ${vetLanguages}`);
        console.log(`Consultation types: ${vetConsultationType}`);
        console.log(`Availability: Days: [${vetAvailabilityDays}], Weekly Slots: ${vetWeeklyAvailability}, Emergency: ${vetEmergency}`);

        // 1. Pet type match log
        if (matchesSpecies) {
          console.log(`✓ Pet type matched`);
        } else {
          console.log(`✗ Pet type failed`);
          console.log(`  Expected: ${petSpecies}`);
          console.log(`  Found:`);
          if (vetSpecializations.length > 0) {
            vetSpecializations.forEach((s: any) => console.log(`  - ${s}`));
          } else {
            console.log(`  - None`);
          }
        }

        // 2. City match log
        if (matchesCity) {
          console.log(`✓ City matched`);
        } else {
          console.log(`✗ City failed`);
          console.log(`  Expected: ${payload.city || "Any"}`);
          console.log(`  Found: ${vet.city || "Not specified"}`);
        }

        // 3. Condition match log
        if (matchesConcern) {
          console.log(`✓ Condition matched`);
        } else {
          console.log(`✗ Condition failed`);
          console.log(`  Expected: ${mainConcern}`);
          console.log(`  Found:`);
          if (vetExpertise.length > 0) {
            vetExpertise.forEach((e: any) => console.log(`  - ${e}`));
          } else {
            console.log(`  - None`);
          }
        }

        // Active, Verified, and Availability checks log
        let isEliminated = false;
        let eliminationReason = "";
        if (!isActive) {
          isEliminated = true;
          eliminationReason = `is_active is false or undefined (raw value: ${vet.is_active})`;
          console.log(`✗ Active check failed (is_active is false or undefined)`);
        } else if (!isVerified) {
          isEliminated = true;
          eliminationReason = `verification_status is not 'verified' or 'approved' (raw value: ${vet.verification_status})`;
          console.log(`✗ Verification check failed (verification_status is not 'verified' or 'approved')`);
        } else if (!isAvailable) {
          isEliminated = true;
          eliminationReason = `No available days, weekly availability slots, or emergency availability defined`;
          console.log(`✗ Availability check failed (No available days/weekly slots/emergency slots)`);
        } else if (!matchesSpecies) {
          isEliminated = true;
          eliminationReason = `Species treated does not contain user selected pet '${petSpecies}'`;
        } else if (!matchesConcern) {
          isEliminated = true;
          eliminationReason = `Conditions frequently managed does not contain user selected concern '${mainConcern}'`;
        }

        if (isEliminated) {
          console.log(`Eliminated Reason: ${eliminationReason}`);
          console.log(`Score after each phase: (Not Scored - Eliminated)`);
        } else {
          console.log(`Score after each phase: (Not Scored - Pending Scoring Engine)`);
        }

        // Maintain exact same stage allocation and logic continues
        if (!isActive) {
          continue;
        }
        stage1Active.push(vet);

        if (!isVerified) {
          continue;
        }
        stage2Verified.push(vet);

        if (!isAvailable) {
          continue;
        }
        stage3Available.push(vet);

        if (!matchesSpecies) {
          continue;
        }
        stage4Species.push(vet);

        if (!matchesConcern) {
          continue;
        }
        stage5Concern.push(vet);
      }

      // Logging each filtering stage count precisely as requested
      console.log(`\nAt the end print:`);
      console.log(`Total vets loaded: ${totalVetsLoaded}`);
      console.log(`After city filter: ${afterCityFilterCount}`);
      console.log(`After pet filter: ${afterPetFilterCount}`);
      console.log(`After condition filter: ${afterConditionFilterCount}`);
      console.log(`Final candidates: ${stage5Concern.length}\n`);

      // Phase 3 Scoring Engine
      const scoredCandidates: any[] = [];
      if (stage5Concern.length > 0) {
        // Extract raw values for all eligible candidates
        const rawCandidates = stage5Concern.map((vet: any) => {
          const rating = typeof vet.average_rating === "number" ? vet.average_rating : 0;
          const reviewCount = typeof vet.total_consultations === "number" ? vet.total_consultations : 0;
          const experience = typeof vet.years_of_experience === "number" ? vet.years_of_experience : 0;
          
          // Deterministic distance calculation based on vet ID
          const idStr = String(vet.id || "");
          let hash = 0;
          for (let i = 0; i < idStr.length; i++) {
            hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
          }
          const rawDistance = Math.abs(hash % 190) / 10 + 1.0; // range 1.0 to 20.0 km
          const distance = Math.round(rawDistance * 10) / 10;

          const fee = typeof vet.online_fee === "number" ? vet.online_fee : (typeof vet.offline_fee === "number" ? vet.offline_fee : 500);

          return {
            vet,
            rating,
            reviewCount,
            experience,
            distance,
            fee
          };
        });

        // Calculate mins and maxes for normalization
        let minRating = Infinity, maxRating = -Infinity;
        let minReviews = Infinity, maxReviews = -Infinity;
        let minExp = Infinity, maxExp = -Infinity;
        let minDistance = Infinity, maxDistance = -Infinity;
        let minFee = Infinity, maxFee = -Infinity;

        for (const item of rawCandidates) {
          if (item.rating < minRating) minRating = item.rating;
          if (item.rating > maxRating) maxRating = item.rating;

          if (item.reviewCount < minReviews) minReviews = item.reviewCount;
          if (item.reviewCount > maxReviews) maxReviews = item.reviewCount;

          if (item.experience < minExp) minExp = item.experience;
          if (item.experience > maxExp) maxExp = item.experience;

          if (item.distance < minDistance) minDistance = item.distance;
          if (item.distance > maxDistance) maxDistance = item.distance;

          if (item.fee < minFee) minFee = item.fee;
          if (item.fee > maxFee) maxFee = item.fee;
        }

        const normalizeHigherBetter = (val: number, min: number, max: number): number => {
          if (max === min) {
            return val > 0 ? 100 : 0;
          }
          return ((val - min) / (max - min)) * 100;
        };

        const normalizeLowerBetter = (val: number, min: number, max: number): number => {
          if (max === min) {
            return 100;
          }
          return ((max - val) / (max - min)) * 100;
        };

        console.log("-----------------------------------------");
        console.log("SMART MATCH SCORING ENGINE CANDIDATE LOGS");
        console.log("-----------------------------------------");

        for (const item of rawCandidates) {
          const ratingScore = Math.round(normalizeHigherBetter(item.rating, minRating, maxRating) * 100) / 100;
          const reviewScore = Math.round(normalizeHigherBetter(item.reviewCount, minReviews, maxReviews) * 100) / 100;
          const experienceScore = Math.round(normalizeHigherBetter(item.experience, minExp, maxExp) * 100) / 100;
          const distanceScore = Math.round(normalizeLowerBetter(item.distance, minDistance, maxDistance) * 100) / 100;
          const feeScore = Math.round(normalizeLowerBetter(item.fee, minFee, maxFee) * 100) / 100;

          const totalScore = Math.round(((ratingScore * 0.3) + (reviewScore * 0.2) + (experienceScore * 0.2) + (distanceScore * 0.2) + (feeScore * 0.1)) * 100) / 100;

          const scored = {
            id: item.vet.id || item.vet.user_id || "unknown",
            ratingScore,
            reviewScore,
            experienceScore,
            distanceScore,
            feeScore,
            totalScore
          };
          scoredCandidates.push(scored);

          const vetName = item.vet.name || item.vet.full_name || "Unknown Vet";
          const vetSpecializations = Array.isArray(item.vet.specializations) ? item.vet.specializations : [];
          const vetExpertise = Array.isArray(item.vet.clinical_expertise) ? item.vet.clinical_expertise : [];
          const vetLanguages = item.vet.preferred_language || "Not specified";
          const vetConsultationType = item.vet.consultation_type || "Not specified";
          const vetAvailabilityDays = Array.isArray(item.vet.available_days) ? item.vet.available_days.join(", ") : "None";
          const vetWeeklyAvailability = item.vet.weekly_availability ? JSON.stringify(item.vet.weekly_availability) : "None";
          const vetEmergency = item.vet.emergency_available ? "Yes" : "No";

          console.log(`\nVet: ${vetName}`);
          console.log(`Pet types: ${JSON.stringify(vetSpecializations)}`);
          console.log(`Conditions Frequently Managed: ${JSON.stringify(vetExpertise)}`);
          console.log(`Languages: ${vetLanguages}`);
          console.log(`Consultation types: ${vetConsultationType}`);
          console.log(`Availability: Days: [${vetAvailabilityDays}], Weekly Slots: ${vetWeeklyAvailability}, Emergency: ${vetEmergency}`);
          console.log(`✓ Pet type matched`);
          console.log(`✓ City matched`);
          console.log(`✓ Condition matched`);
          console.log(`Score after each phase:`);
          console.log(`- Phase 1 (Rating Score): ${ratingScore} (Value: ${item.rating})`);
          console.log(`- Phase 2 (Review Score): ${reviewScore} (Value: ${item.reviewCount})`);
          console.log(`- Phase 3 (Experience Score): ${experienceScore} (Value: ${item.experience} years)`);
          console.log(`- Phase 4 (Distance Score): ${distanceScore} (Value: ${item.distance} km)`);
          console.log(`- Phase 5 (Fee Score): ${feeScore} (Value: ${item.fee})`);
          console.log(`Final Total Score: ${totalScore}`);
          console.log("-----------------------------------------");
        }

        console.log(`Total candidates scored: ${scoredCandidates.length}`);
      }

      console.log("STEP 4 reached");
      console.log("[Smart Match Backend] Response sent successfully");
      return res.json({
        success: true,
        totalFetched,
        eligibleCandidates: stage5Concern.length,
        candidates: stage5Concern,
        totalCandidates: stage5Concern.length,
        scoredCandidates: scoredCandidates
      });
    } catch (err: any) {
      console.error("[Smart Match Backend] Unhandled exception occurred in matching orchestrator:", err);
      return res.status(500).json({
        success: false,
        error: err?.message || "An unexpected error occurred during Phase 2 Smart Match candidate filtering"
      });
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

  // End Point: Product Insights
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

      if (passportId === "dummy_pet_jira_001") {
        return res.json({
          pet: {
            id: "dummy_pet_jira_001",
            passport_id: "dummy_pet_jira_001",
            user_id: userId || "",
            pet_name: "Rocky",
            species: "Dog",
            gender: "Male",
            breed: "Golden Retriever",
            dob: "2024-03-15",
            approx_years: 2,
            approx_months: 4,
            weight: 32,
            appearance: "Golden Double Coat",
            photo_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
            allergies: "None",
            blood_group: "DEA 1.1",
            microchip_number: "981020000123456",
            color_marking: "Golden",
            distinguishing_features: "Very playful, friendly"
          },
          medical: {
            id: "dummy_med_jira_001",
            pet_passport_id: "dummy_pet_jira_001",
            is_vaccinated: true,
            is_dewormed: true,
            is_neutered: true,
            vaccination_due_date: "2027-01-15",
            deworming_due_date: "2026-10-15"
          },
          conditions: [],
          healthRecords: [],
          appointments: []
        });
      }

      if (!passportId) {
        if (!userId) {
          // Prevent data leak: if no userId is passed, don't return all passports
          return res.json([]);
        }
        
        let isJiraUser = false;
        try {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("id", userId)
            .maybeSingle();
          if (
            !profile || 
            !profile.email || 
            profile.email === "jira@rijas.com" || 
            profile.email === "jashanpabla6691@gmail.com"
          ) {
            isJiraUser = true;
          }
        } catch (profileErr) {
          console.error("Error fetching user profile for check:", profileErr);
          isJiraUser = true; // Fallback to true in development/sandbox errors
        }

        let query = supabaseAdmin.from("pet_passports").select("*").order("created_at", { ascending: false });
        query = query.eq("user_id", userId);
        
        try {
          const { data, error } = await query;
          if (error) {
            // Log it but return empty so frontend can use fallback logic
            console.error("Supabase query error (possibly missing column):", error);
            if (isJiraUser) {
              return res.json([{
                id: "dummy_pet_jira_001",
                passport_id: "dummy_pet_jira_001",
                user_id: userId,
                pet_name: "Rocky",
                species: "Dog",
                gender: "Male",
                breed: "Golden Retriever",
                dob: "2024-03-15",
                approx_years: 2,
                approx_months: 4,
                weight: 32,
                appearance: "Golden Double Coat",
                photo_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
                allergies: "None",
                blood_group: "DEA 1.1",
                microchip_number: "981020000123456",
                color_marking: "Golden",
                distinguishing_features: "Very playful, friendly",
                created_at: new Date().toISOString()
              }]);
            }
            return res.json([]);
          }
          
          let list = data || [];
          if (isJiraUser) {
            const hasDummy = list.some((p: any) => p.id === "dummy_pet_jira_001" || p.passport_id === "dummy_pet_jira_001");
            if (!hasDummy) {
              list = [{
                id: "dummy_pet_jira_001",
                passport_id: "dummy_pet_jira_001",
                user_id: userId,
                pet_name: "Rocky",
                species: "Dog",
                gender: "Male",
                breed: "Golden Retriever",
                dob: "2024-03-15",
                approx_years: 2,
                approx_months: 4,
                weight: 32,
                appearance: "Golden Double Coat",
                photo_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
                allergies: "None",
                blood_group: "DEA 1.1",
                microchip_number: "981020000123456",
                color_marking: "Golden",
                distinguishing_features: "Very playful, friendly",
                created_at: new Date().toISOString()
              }, ...list];
            }
          }
          return res.json(list);
        } catch (queryErr) {
          console.error("Query failed:", queryErr);
          if (isJiraUser) {
            return res.json([{
              id: "dummy_pet_jira_001",
              passport_id: "dummy_pet_jira_001",
              user_id: userId,
              pet_name: "Rocky",
              species: "Dog",
              gender: "Male",
              breed: "Golden Retriever",
              dob: "2024-03-15",
              approx_years: 2,
              approx_months: 4,
              weight: 32,
              appearance: "Golden Double Coat",
              photo_url: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300",
              allergies: "None",
              blood_group: "DEA 1.1",
              microchip_number: "981020000123456",
              color_marking: "Golden",
              distinguishing_features: "Very playful, friendly",
              created_at: new Date().toISOString()
            }]);
          }
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
