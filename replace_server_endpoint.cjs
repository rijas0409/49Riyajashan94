const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const startStr = 'app.post("/api/save-smart-match", async (req, res) => {';
const startIndex = content.indexOf(startStr);
if (startIndex === -1) throw new Error("Could not find start");

// Find the matching closing bracket for this block
let endIndex = -1;
let bracketCount = 0;
let i = startIndex + startStr.length;
while(i < content.length) {
    if (content[i] === '{') bracketCount++;
    else if (content[i] === '}') {
        if (bracketCount === 0) {
            // Find the end of the line
            while (i < content.length && content[i] !== '\n') i++;
            endIndex = i;
            break;
        }
        bracketCount--;
    }
    i++;
}

if (endIndex === -1) throw new Error("Could not find end");

const newEndpoint = `app.post("/api/save-smart-match", async (req, res) => {
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

      const finalAssessmentId = crypto.randomUUID();

      // We attempt to save into the requested 'smart_match_consultations' table first.
      const smartMatchRecord = {
          id: finalAssessmentId,
          user_id: dbUserId,
          pet_passport_id: petPassportId,
          step1_pet_details: payload.pet || {},
          step2_concerns: payload.concerns || [],
          step3_health_background: payload.healthBackground || [],
          step4_current_health_status: payload.currentHealthStatus || [],
          step5_photos_videos: payload.mediaFiles || [],
          step6_review_data: payload.reviewData || {},
          status: "submitted"
      };

      let { error: insertErr } = await supabaseAdmin
        .from("smart_match_consultations")
        .insert(smartMatchRecord);

      // Handle user_id FK constraint violation if user_id is passed but doesn't exist in auth.users
      if (insertErr && dbUserId) {
         console.warn("[SmartMatch Save] Insert failed with user_id on smart_match_consultations, retrying with null user_id...", insertErr.message);
         smartMatchRecord.user_id = null;
         const { error: retryErr } = await supabaseAdmin.from("smart_match_consultations").insert(smartMatchRecord);
         insertErr = retryErr;
      }

      // If 'smart_match_consultations' table does not exist yet, fallback to the existing 'care_match_assessments'
      if (insertErr && insertErr.code === '42P01') {
          console.log("[SmartMatch Save] Table smart_match_consultations does not exist. Falling back to care_match_assessments.");
          
          let fallbackResponses = {
              meta: { submitted_at: new Date().toISOString() },
              pet_details: payload.pet || {},
              concerns: payload.concerns || [],
              health_background: payload.healthBackground || [],
              current_health_status: payload.currentHealthStatus || [],
              media_files: payload.mediaFiles || [],
              review_data: payload.reviewData || {}
          };

          const fallbackRecord = {
              id: finalAssessmentId,
              user_id: dbUserId,
              pet_passport_id: petPassportId,
              responses: fallbackResponses,
              status: "submitted",
              current_step: 6
          };

          let { error: fallbackErr } = await supabaseAdmin.from("care_match_assessments").insert(fallbackRecord);
          
          if (fallbackErr && dbUserId) {
              fallbackRecord.user_id = null;
              const { error: retryFallbackErr } = await supabaseAdmin.from("care_match_assessments").insert(fallbackRecord);
              fallbackErr = retryFallbackErr;
          }
          
          if (fallbackErr) {
             console.error("Supabase fallback insert error details:", fallbackErr);
             return res.status(400).json({ success: false, error: "Database error during fallback: " + (fallbackErr.message || JSON.stringify(fallbackErr)) });
          }

          return res.json({ success: true, id: finalAssessmentId, fallback: true });
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
  });`;

content = content.substring(0, startIndex) + newEndpoint + content.substring(endIndex);
fs.writeFileSync('server.ts', content);
console.log("Replaced successfully!");
