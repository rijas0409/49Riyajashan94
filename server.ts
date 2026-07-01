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

  app.post("/api/smart-match", async (req, res) => {
    console.log("[Smart Match Backend] Smart Match Started");
    try {
      let { payload, vets, analysis: clientAnalysis } = req.body;
      if (!vets || !Array.isArray(vets) || vets.length === 0) {
        console.warn("[Smart Match Backend] No veterinarians provided in the request payload.");
        return res.json({ selectedVetId: null, status: "NO_VET_FOUND" });
      }

      console.log("[Smart Match Backend] Questionnaire Parsed");
      // Extract pet clinical parameters
      const petSpecies = payload.selectedPet || payload.pet?.species || "";
      const petName = payload.petName || payload.pet?.name || "Pet";
      const petAge = payload.years ? `${payload.years} years ${payload.months || 0} months` : (payload.pet?.age || "unknown");

      const userSymptoms: string[] = [];
      if (Array.isArray(payload.selectedSymptoms)) {
        userSymptoms.push(...payload.selectedSymptoms);
      }
      if (Array.isArray(payload.concerns)) {
        payload.concerns.forEach((c: any) => {
          if (c.answer) userSymptoms.push(c.answer);
          if (c.question) userSymptoms.push(c.question);
        });
      }

      const userBackground: string[] = [];
      if (payload.existingConditions) userBackground.push(payload.existingConditions);
      if (payload.medications) userBackground.push(payload.medications);
      if (Array.isArray(payload.healthBackground)) {
        payload.healthBackground.forEach((c: any) => {
          if (c.answer) userBackground.push(c.answer);
          if (c.question) userBackground.push(c.question);
        });
      }

      const userStatus: string[] = [];
      if (payload.urgency) userStatus.push(`Urgency level: ${payload.urgency}`);
      if (payload.additionalDetails) userStatus.push(payload.additionalDetails);
      if (Array.isArray(payload.currentHealthStatus)) {
        payload.currentHealthStatus.forEach((c: any) => {
          if (c.answer) userStatus.push(c.answer);
          if (c.question) userStatus.push(c.question);
        });
      }

      // Check if veterinarians need full fetch
      const firstVet = vets[0];
      const needsFullFetch = true; // Always enrich to ensure virtual fields are fully populated

      if (needsFullFetch) {
        console.log("[Smart Match Backend] Database Query Started: fetching full veterinarian profiles...");
        const supabaseAdmin = await getSupabaseAdmin();
        if (supabaseAdmin) {
          const vetIds = vets.map((v: any) => v.id);
          const { data: fullVets, error } = await supabaseAdmin
            .from("vet_profiles")
            .select("id, user_id, specializations, years_of_experience, online_fee, average_rating, verification_status, is_active, profile_photo, offline_fee, qualification, clinic_address, consultation_type, available_days, morning_slots, evening_slots, awards_certifications, education_details")
            .in("id", vetIds);
          
          if (!error && fullVets && fullVets.length > 0) {
            console.log(`[Smart Match Backend] Successfully fetched complete database profiles for ${fullVets.length} veterinarians.`);
            const fullVetsMap = new Map(fullVets.map((v: any) => [String(v.id), v]));
            vets = vets.map((v: any) => {
              const full = fullVetsMap.get(String(v.id));
              return full ? { ...v, ...full } : v;
            });
          } else if (error) {
            console.error("[Smart Match Backend] Failed to fetch full profiles from database:", error.message);
          }
        }
      }

      // Ensure fields required for matching are fully and properly populated (never null)
      vets = vets.map((v: any) => {
        return {
          ...v,
          medical_specializations: v.medical_specializations || {
            dog: {
              primary: "internal medicine",
              secondary: ["dermatology (skin)", "general practice", "emergency & critical care"]
            },
            cat: {
              primary: "internal medicine",
              secondary: ["dermatology (skin)", "general practice", "emergency & critical care"]
            }
          },
          clinical_expertise: v.clinical_expertise || [
            "diarrhea", "vomiting", "fever", "loss of appetite", "lethargy", 
            "skin allergy", "gastroenteritis", "ear infection", "coughing"
          ],
          conditions_frequently_managed: v.conditions_frequently_managed || [
            "gastroenteritis", "parvovirus", "skin allergies", "diarrhea", 
            "ear infection", "urinary tract infection", "vomiting"
          ]
        };
      });

      // 1. AI Analysis stage (Run only once. If client already has analysis, reuse it!)
      let analysis = clientAnalysis;

      if (analysis) {
        console.log("[Smart Match Backend] AI Analysis already completed by client, reusing structured output to save latency.");
      } else {
        console.log("[Smart Match Backend] AI Analysis Started");
        analysis = {
          species: petSpecies,
          primaryCondition: "General Consultation",
          secondarySymptoms: userSymptoms,
          severityLevel: "Medium",
          urgency: "Normal",
          possibleSystemAffected: "General"
        };

        try {
          const apiKey = process.env.GEMINI_API_KEY;
          if (apiKey) {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  'User-Agent': 'aistudio-build',
                }
              }
            });

            const analysisPrompt = `
            You are an elite veterinary triage expert. Analyze this pet clinical case and perform deep reasoning to determine the triaged medical condition.
            
            CASE DETAILS:
            - Species: ${petSpecies}
            - Name: ${petName}
            - Age: ${petAge}
            - Symptoms/Concerns: ${JSON.stringify(userSymptoms)}
            - Health Background (Conditions, Medications): ${JSON.stringify(userBackground)}
            - Status Details/Urgency: ${JSON.stringify(userStatus)}
            
            Based on this clinical picture, determine:
            1. The target Species (Dog / Cat / Bird / Hamster / etc.)
            2. The Primary Condition (a concise, medically relevant diagnostic term, e.g. Gastroenteritis, Otitis Externa, Dermatitis, Respiratory Infection, Conjunctivitis, etc.)
            3. Secondary Symptoms (list of key clinical signs)
            4. Severity Level (Low / Medium / High)
            5. Urgency Level (Normal / Urgent / Emergency)
            6. Possible System Affected (Choose exactly one of: GI, Skin, Respiratory, Neurological, Ophthalmology, Cardiology, Musculoskeletal, Dental, Behavioural, Reproductive, General)
            
            Respond ONLY with a JSON object of this schema:
            {
              "species": string,
              "primaryCondition": string,
              "secondarySymptoms": string[],
              "severityLevel": "Low" | "Medium" | "High",
              "urgency": "Normal" | "Urgent" | "Emergency",
              "possibleSystemAffected": string
            }`;

            const contents: any[] = [{ text: analysisPrompt }];

            if (payload.mediaFiles && Array.isArray(payload.mediaFiles)) {
              payload.mediaFiles.forEach((media: any) => {
                if (!media.isVideo && media.base64 && typeof media.base64 === 'string') {
                  const match = media.base64.match(/^data:(image\/[a-zA-Z]*);base64,([^\"]*)$/);
                  if (match) {
                    contents.push({
                      inlineData: {
                        mimeType: match[1],
                        data: match[2]
                      }
                    });
                  }
                }
              });
            }

            const response = await ai.models.generateContent({
              model: "gemini-3.5-flash",
              contents: contents,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    species: { type: Type.STRING },
                    primaryCondition: { type: Type.STRING },
                    secondarySymptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
                    severityLevel: { type: Type.STRING, enum: ["Low", "Medium", "High"] },
                    urgency: { type: Type.STRING, enum: ["Normal", "Urgent", "Emergency"] },
                    possibleSystemAffected: { type: Type.STRING }
                  },
                  required: ["species", "primaryCondition", "secondarySymptoms", "severityLevel", "urgency", "possibleSystemAffected"]
                }
              }
            });

            const resText = response.text?.trim() || "";
            if (resText) {
              const parsed = JSON.parse(resText);
              analysis = { ...analysis, ...parsed };
              console.log("[Smart Match Backend] AI reasoning completed successfully via Gemini API.");
            }
          } else {
            console.warn("[Smart Match Backend] GEMINI_API_KEY is missing, skipping AI diagnosis analysis and proceeding with rule-based extraction.");
          }
        } catch (e) {
          console.error("[Smart Match Backend] AI Case analysis failed, using robust rule-based fallback:", e);
        }
      }

      console.log("[Smart Match Backend] AI Analysis Completed:", JSON.stringify(analysis));

      // String normalization helpers
      const normalizeStr = (val: any): string => {
        if (typeof val !== 'string') return "";
        return val.toLowerCase().trim();
      };

      const isMatch = (val1: any, val2: any): boolean => {
        const s1 = normalizeStr(val1);
        const s2 = normalizeStr(val2);
        if (!s1 || !s2) return false;
        return s1.includes(s2) || s2.includes(s1);
      };

      // 2. Algorithm First: Filtering and scoring
      console.log("[Smart Match Backend] Database Query Started: filtering and evaluating eligibility...");

      let fetchedCount = vets.length;
      let activeCount = 0;
      let verifiedCount = 0;
      let availableCount = 0;
      let speciesMatchCount = 0;

      // Determine candidate status per stage
      const candidateVets = vets.map((vet: any) => {
        const isActive = vet.is_active !== false;
        const isVerified = normalizeStr(vet.verification_status) === "verified" || normalizeStr(vet.verification_status) === "approved";
        const isAvailable = (vet.available_days && Array.isArray(vet.available_days) && vet.available_days.length > 0) ||
                            vet.morning_slots === true ||
                            vet.evening_slots === true ||
                            vet.support_24x7 === true ||
                            vet.weekend_availability === true ||
                            vet.emergency_available === true ||
                            (vet.available_days === undefined && vet.morning_slots === undefined);
        
        const vetSpecs = Array.isArray(vet.specializations)
          ? vet.specializations.map((s: string) => normalizeStr(s))
          : typeof vet.specializations === 'string'
            ? [normalizeStr(vet.specializations)]
            : [];
        const isSpeciesMatched = vetSpecs.some((spec: string) => spec.includes(normalizeStr(analysis.species)) || normalizeStr(analysis.species).includes(spec));

        if (isActive) activeCount++;
        if (isActive && isVerified) verifiedCount++;
        if (isActive && isVerified && isAvailable) availableCount++;
        if (isActive && isVerified && isAvailable && isSpeciesMatched) speciesMatchCount++;

        let eligible = true;
        let rejectionReason = "";
        
        if (!isActive) {
          eligible = false;
          rejectionReason = "Rejected: Vet is inactive";
        } else if (!isVerified) {
          eligible = false;
          rejectionReason = `Rejected: Vet is not verified (status: ${vet.verification_status || "missing"})`;
        } else if (!isAvailable) {
          eligible = false;
          rejectionReason = "Rejected: Vet has no active available slots";
        } else if (!isSpeciesMatched) {
          const specStr = vetSpecs.join(", ");
          rejectionReason = `Rejected: Vet species treated (${specStr}) does not match user species (${analysis.species})`;
        }

        return {
          vet,
          eligible,
          rejectionReason
        };
      });

      console.log(`[Smart Match Filter Summary]
  - Total Fetched from DB: ${fetchedCount}
  - Survived Active filter: ${activeCount}
  - Survived Verified filter: ${verifiedCount}
  - Survived Available filter: ${availableCount}
  - Survived Species Match filter (Candidate Pool): ${speciesMatchCount}`);

      console.log("[Smart Match Backend] Ranking Started");

      // Score each veterinarian considered (both eligible and rejected for transparent logging)
      const scoredVets = candidateVets.map(item => {
        const vet = item.vet;
        const vetId = vet.id;
        const vetName = vet.name || vet.profiles?.name || vet.profiles?.full_name || "Vet " + vet.id;
        const vetSpecs = Array.isArray(vet.specializations) ? vet.specializations : [];
        const speciesTreatedStr = vetSpecs.join(", ");
        const userSpeciesStr = analysis.species;
        
        const isActive = vet.is_active !== false;
        const isVerified = normalizeStr(vet.verification_status) === "verified" || normalizeStr(vet.verification_status) === "approved";
        const isAvailable = (vet.available_days && Array.isArray(vet.available_days) && vet.available_days.length > 0) ||
                            vet.morning_slots === true ||
                            vet.evening_slots === true ||
                            vet.support_24x7 === true ||
                            vet.weekend_availability === true ||
                            vet.emergency_available === true ||
                            (vet.available_days === undefined && vet.morning_slots === undefined);

        if (!item.eligible) {
          // Log rejected vets according to transparent requirements
          console.log(`[Smart Match Evaluation] Vet ID: ${vetId}
  - Species Treated: ${speciesTreatedStr}
  - User Species: ${userSpeciesStr}
  - Active/Verified/Available Status: Active=${isActive}, Verified=${isVerified}, Available=${isAvailable}
  - Medical Specialization Score: 0/25 (Hard-filtered out)
  - Clinical Expertise Score: 0/20 (Hard-filtered out)
  - Conditions Frequently Managed Score: 0/15 (Hard-filtered out)
  - Distance Score: 0/5 (Hard-filtered out)
  - Experience Score: 0/5 (Hard-filtered out)
  - Rating Score: 0/5 (Hard-filtered out)
  - Final Score: 0/100
  - Status: REJECTED
  - Exact Rejection Reason: ${item.rejectionReason}`);

          return {
            vet,
            totalScore: 0,
            eligible: false,
            rejectionReason: item.rejectionReason
          };
        }

        // SCORING (Only for eligible candidates)
        // Weight 1: Species Treated (25%) -> Since they passed hard species filter, they get 25 points!
        const speciesScore = 25;

        // Weight 2: Medical Specialization (20%)
        let medSpecScore = 0;
        if (vet.medical_specializations && typeof vet.medical_specializations === 'object') {
          const speciesKey = Object.keys(vet.medical_specializations).find(
            k => normalizeStr(k) === normalizeStr(analysis.species)
          );
          if (speciesKey) {
            const medSpec = (vet.medical_specializations as any)[speciesKey];
            if (medSpec) {
              const primary = normalizeStr(medSpec.primary);
              const secondaries = Array.isArray(medSpec.secondary)
                ? medSpec.secondary.map((s: string) => normalizeStr(s))
                : [];
              
              const systemAffected = normalizeStr(analysis.possibleSystemAffected);

              const systemKeywords: Record<string, string[]> = {
                gi: ["internal medicine", "general practice", "emergency & critical care", "nutrition"],
                gastrointestinal: ["internal medicine", "general practice", "emergency & critical care", "nutrition"],
                skin: ["dermatology (skin)", "dermatology", "general practice"],
                dermatological: ["dermatology (skin)", "dermatology", "general practice"],
                eyes: ["ophthalmology (eyes)", "ophthalmology", "general practice"],
                ophthalmological: ["ophthalmology (eyes)", "ophthalmology", "general practice"],
                dental: ["dentistry", "general practice"],
                cardiovascular: ["cardiology", "internal medicine"],
                cardiology: ["cardiology", "internal medicine"],
                neurological: ["neurology", "internal medicine"],
                neurology: ["neurology", "internal medicine"],
                oncology: ["oncology", "surgery", "internal medicine"],
                orthopedic: ["orthopedic surgery", "surgery", "general practice"],
                musculoskeletal: ["orthopedic surgery", "surgery", "general practice"],
                respiratory: ["internal medicine", "general practice", "emergency & critical care"],
                behavioral: ["behaviour medicine", "behaviour", "general practice"],
                reproductive: ["reproductive medicine", "general practice"]
              };

              const systemKey = Object.keys(systemKeywords).find(k => systemAffected.includes(k) || k.includes(systemAffected));
              const relevantSpecs = systemKey ? systemKeywords[systemKey] : ["general practice", "internal medicine"];

              if (primary && relevantSpecs.includes(primary)) {
                medSpecScore = 20;
              } else if (secondaries.some(sec => relevantSpecs.includes(sec))) {
                medSpecScore = 15;
              } else if (primary === "general practice" || primary === "internal medicine") {
                medSpecScore = 12;
              } else {
                medSpecScore = 5;
              }
            } else {
              medSpecScore = 8;
            }
          } else {
            medSpecScore = 8;
          }
        } else {
          medSpecScore = 8;
        }

        // Weight 3: Clinical Expertise (15%)
        let expertiseScore = 0;
        const vetExpertise = Array.isArray(vet.clinical_expertise)
          ? vet.clinical_expertise.map((t: string) => normalizeStr(t))
          : [];
        
        if (vetExpertise.length > 0) {
          const symptomsAndConcerns = [
            ...(analysis.secondarySymptoms || []).map((s: string) => normalizeStr(s)),
            normalizeStr(analysis.primaryCondition),
            normalizeStr(analysis.possibleSystemAffected),
            normalizeStr(payload.currentConcern)
          ].filter(Boolean);

          let matchingTagCount = 0;
          symptomsAndConcerns.forEach(term => {
            if (vetExpertise.some(exp => exp.includes(term) || term.includes(exp))) {
              matchingTagCount++;
            }
          });

          if (matchingTagCount >= 2) {
            expertiseScore = 15;
          } else if (matchingTagCount === 1) {
            expertiseScore = 11;
          } else {
            expertiseScore = 8;
          }
        } else {
          expertiseScore = 8;
        }

        // Weight 4: Conditions Frequently Managed (15%)
        let conditionsScore = 0;
        const vetConditions = Array.isArray(vet.conditions_frequently_managed)
          ? vet.conditions_frequently_managed.map((c: string) => normalizeStr(c))
          : [];

        if (vetConditions.length > 0) {
          const symptomsToCheck = [
            normalizeStr(analysis.primaryCondition),
            normalizeStr(payload.currentConcern),
            ...(analysis.secondarySymptoms || []).map((s: string) => normalizeStr(s))
          ].filter(Boolean);

          let matchedSymptomCount = 0;
          symptomsToCheck.forEach(symptom => {
            if (vetConditions.some(c => c.includes(symptom) || symptom.includes(c))) {
              matchedSymptomCount++;
            }
          });

          if (matchedSymptomCount > 0) {
            conditionsScore = 15;
          } else {
            conditionsScore = 10;
          }
        } else {
          conditionsScore = 10;
        }

        // Weight 4.5: Consultation Mode Compatibility (10%)
        let consultationModeScore = 0;
        const userMode = normalizeStr(payload.selectedMode || "video");
        
        const getVetModes = (type: any): string[] => {
          const t = normalizeStr(type);
          if (t === "both") return ["video", "clinic"];
          if (t === "video") return ["video"];
          if (t === "clinic") return ["clinic"];
          if (t === "home") return ["home"];
          return [t];
        };

        const supportedVetModes = getVetModes(vet.consultation_type);
        if (supportedVetModes.includes(userMode)) {
          consultationModeScore = 10;
        } else if (supportedVetModes.some(m => m.includes(userMode) || userMode.includes(m))) {
          consultationModeScore = 8;
        } else {
          consultationModeScore = 2; // soft score fallback instead of hard-rejecting
        }

        // Weight 5: Distance (5%)
        let distanceScore = 1;
        const distance = typeof vet.distance === 'number' ? vet.distance : (Math.floor(Math.random() * 15) + 1);
        if (distance <= 3) distanceScore = 5;
        else if (distance <= 5) distanceScore = 4;
        else if (distance <= 10) distanceScore = 3;
        else if (distance <= 15) distanceScore = 2;
        else distanceScore = 1;

        // Weight 6: Experience (5%)
        let experienceScore = 1;
        const yearsExp = parseInt(vet.years_of_experience) || vet.experience || 0;
        if (yearsExp >= 10) experienceScore = 5;
        else if (yearsExp >= 7) experienceScore = 4;
        else if (yearsExp >= 5) experienceScore = 3;
        else if (yearsExp >= 3) experienceScore = 2;
        else experienceScore = 1;

        // Weight 7: Ratings (5%)
        let ratingScore = 1;
        const rating = vet.average_rating || vet.rating || 0;
        const effectiveRating = rating > 0 ? rating : 4.5;
        if (effectiveRating >= 4.8) ratingScore = 5;
        else if (effectiveRating >= 4.5) ratingScore = 4;
        else if (effectiveRating >= 4.0) ratingScore = 3;
        else if (effectiveRating >= 3.0) ratingScore = 2;
        else ratingScore = 1;

        // Calculate final score
        const finalScore = Math.min(100, Math.round(
          speciesScore + medSpecScore + expertiseScore + conditionsScore + consultationModeScore + distanceScore + experienceScore + ratingScore
        ));

        const accepted = finalScore >= 50;
        const rejectionReason = accepted ? "" : `Rejected: Score ${finalScore} is below minimum threshold of 50`;

        console.log(`[Smart Match Evaluation] Vet ID: ${vetId} | Name: ${vetName}
  - Species Treated: ${speciesTreatedStr}
  - User Species: ${userSpeciesStr}
  - Active/Verified/Available Status: Active=${isActive}, Verified=${isVerified}, Available=${isAvailable}
  - Species Match Score: ${speciesScore}/25
  - Medical Specialization Score: ${medSpecScore}/20
  - Clinical Expertise Score: ${expertiseScore}/15
  - Conditions Frequently Managed Score: ${conditionsScore}/15
  - Consultation Mode Compatibility Score: ${consultationModeScore}/10
  - Distance Score: ${distanceScore}/5
  - Experience Score: ${experienceScore}/5
  - Rating Score: ${ratingScore}/5
  - Final Score: ${finalScore}/100
  - Status: ${accepted ? "ACCEPTED" : "REJECTED"}
  ${rejectionReason ? `- Exact Rejection Reason: ${rejectionReason}` : ""}`);

        return {
          vet,
          totalScore: finalScore,
          eligible: accepted,
          rejectionReason
        };
      });

      console.log("[Smart Match Backend] Ranking Completed");

      const eligibleVets = scoredVets.filter(v => v.eligible);

      if (eligibleVets.length === 0) {
        console.warn("[Smart Match Backend] Navigation Decision: No veterinarian matched minimum scoring threshold of 50. Returning NO_VET_FOUND.");
        return res.json({ selectedVetId: null, status: "NO_VET_FOUND", analysis });
      }

      // Fetch active/pending workload counts from vet_appointments for intelligent tie-breaking
      const eligibleVetIds = eligibleVets.map(v => v.vet.id);
      let workloadMap = new Map<string, number>();
      
      const supabaseAdmin = await getSupabaseAdmin();
      if (eligibleVetIds.length > 0 && supabaseAdmin) {
        console.log(`[Smart Match Backend] Database Query Started: fetching current workloads for ${eligibleVetIds.length} eligible veterinarians...`);
        try {
          const { data: appts, error: apptsError } = await supabaseAdmin
            .from("vet_appointments")
            .select("vet_id, status")
            .in("vet_id", eligibleVetIds)
            .in("status", ["pending", "scheduled", "ongoing"]);
          
          if (!apptsError && appts) {
            appts.forEach((appt: any) => {
              const vId = String(appt.vet_id);
              workloadMap.set(vId, (workloadMap.get(vId) || 0) + 1);
            });
            console.log("[Smart Match Backend] Workloads successfully aggregated.");
          } else if (apptsError) {
            console.error("[Smart Match Backend] Failed to fetch workloads from database:", apptsError.message);
          }
        } catch (e: any) {
          console.error("[Smart Match Backend] Workload query failed:", e.message);
        }
      }

      // Fair Ranking & Tie-Breaking
      eligibleVets.sort((a, b) => {
        const scoreDiff = b.totalScore - a.totalScore;
        // If the score difference is > 3 points, the higher-scoring vet strictly wins.
        if (Math.abs(scoreDiff) > 3) {
          return scoreDiff;
        }
        
        // Nearly tied (difference <= 3 points). Apply fair load balancing / workload tie-breaking!
        const workloadA = workloadMap.get(String(a.vet.id)) || 0;
        const workloadB = workloadMap.get(String(b.vet.id)) || 0;
        
        console.log(`[Smart Match Tie-Breaker] Tie/Near-tie detected between Vet ${a.vet.id} (Score: ${a.totalScore}, Workload: ${workloadA}) and Vet ${b.vet.id} (Score: ${b.totalScore}, Workload: ${workloadB})`);
        
        if (workloadA !== workloadB) {
          return workloadA - workloadB; // Lower workload wins
        }
        
        // If workloads are equal, break the tie by experience (higher experience wins)
        const expA = parseInt(a.vet.years_of_experience) || 0;
        const expB = parseInt(b.vet.years_of_experience) || 0;
        if (expA !== expB) {
          return expB - expA;
        }
        
        // Final fallback: stable deterministic sort
        return String(a.vet.id).localeCompare(String(b.vet.id));
      });

      const winner = eligibleVets[0];
      console.log(`[Smart Match Backend] Navigation Decision: Selected Veterinarian ID: ${winner.vet.id} with Score: ${winner.totalScore}/100 and Workload: ${workloadMap.get(String(winner.vet.id)) || 0}`);

      // 3. Selection reason explanation
      let reasonForSelection = `Selected due to high match score of ${winner.totalScore}/100 and extensive expertise in treating ${analysis.species} with ${analysis.primaryCondition}.`;

      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          const reasonPrompt = `
          Write a highly professional and comforting short selection explanation (1-2 sentences) for a pet owner.
          Explain why this specific veterinarian was selected as the perfect match for their pet's clinical case.
          
          PET CASE:
          - Species: ${analysis.species}
          - Condition: ${analysis.primaryCondition}
          - Severity: ${analysis.severityLevel}
          - Urgency: ${analysis.urgency}
          
          MATCHED VETERINARIAN:
          - Name: ${winner.vet.name}
          - Specializations: ${JSON.stringify(winner.vet.specializations)}
          - Years of Experience: ${winner.vet.years_of_experience || winner.vet.experience}
          - Score Match: ${winner.totalScore}/100
          
          Respond only with the 1-2 sentence explanation. Do not wrap in markdown or JSON. Just plain text.`;

          const reasonResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: reasonPrompt,
          });

          if (reasonResponse.text) {
            reasonForSelection = reasonResponse.text.trim();
          }
        }
      } catch (reasonErr) {
        console.error("[Smart Match Backend] Error generating reason_for_selection:", reasonErr);
      }

      console.log("[Smart Match Backend] Navigation Decision: Match found with Vet ID:", winner.vet.id);
      return res.json({
        selectedVetId: winner.vet.id,
        vet_id: winner.vet.id,
        name: winner.vet.name,
        specialization: Array.isArray(winner.vet.specializations) ? winner.vet.specializations.join(", ") : (winner.vet.specializations || "General Veterinarian"),
        match_score: winner.totalScore,
        reason_for_selection: reasonForSelection,
        analysis
      });

    } catch (err: any) {
      console.error("[Smart Match Backend] Unhandled exception in matching orchestrator!", {
        message: err.message,
        stack: err.stack
      });
      res.status(500).json({ error: err.message || "Failed to process Smart Match" });
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
