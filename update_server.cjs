const fs = require('fs');
const codeLines = fs.readFileSync('server.ts', 'utf8').split('\n');
const start = 423; // line 424
const end = 645; // before line 646

const newEndpoint = `  app.post("/api/save-smart-match", async (req, res) => {
    try {
      const payload = req.body;
      const supabaseAdmin = await getSupabaseAdmin();
      if (!supabaseAdmin) {
        throw new Error("Failed to connect to database (Supabase client not initialized)");
      }

      const petId = payload.pet?.id;
      const petName = payload.pet?.name;
      const userId = payload.userId;

      if (!userId) {
        return res.status(400).json({ success: false, error: "Smart Match is a login-only feature. Please sign in or register to continue." });
      }

      if (!petId || String(petId).startsWith("srv_pet_")) {
        return res.status(400).json({ success: false, error: "A valid, registered Pet Passport is mandatory." });
      }

      let petPassportId = null;
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(petId)) {
        const { data: pet } = await supabaseAdmin.from("pet_passports").select("id").eq("id", petId).maybeSingle();
        if (pet) petPassportId = pet.id;
      }
      
      if (!petPassportId && petId) {
        const { data: pet } = await supabaseAdmin.from("pet_passports").select("id").eq("passport_id", petId).maybeSingle();
        if (pet) petPassportId = pet.id;
      }

      if (!petPassportId && petName) {
        let query = supabaseAdmin.from("pet_passports").select("id").eq("pet_name", petName);
        if (userId && uuidRegex.test(userId)) query = query.eq("user_id", userId);
        const { data: pet } = await query.limit(1).maybeSingle();
        if (pet) petPassportId = pet.id;
      }

      if (!petPassportId) {
        return res.status(400).json({ success: false, error: "Pet Passport ID is missing or invalid." });
      }

      const dbUserId = (userId && uuidRegex.test(userId)) ? userId : null;

      const structuredResponses = {
        pet_details: {
           id: payload.pet?.id,
           name: payload.pet?.name,
           species: payload.pet?.species
        },
        step2_concerns: payload.concerns || [],
        step3_health_background: payload.healthBackground || [],
        step4_current_health_status: payload.currentHealthStatus || [],
        step5_media_files: payload.mediaFiles || [],
        meta: { submitted_at: new Date().toISOString() }
      };

      let { data: assessmentData, error: assessmentErr } = await supabaseAdmin
        .from("care_match_assessments")
        .insert({
          user_id: dbUserId,
          pet_passport_id: petPassportId,
          responses: structuredResponses,
          status: "draft",
          current_step: 6
        })
        .select()
        .single();

      if (assessmentErr && dbUserId) {
         console.warn("Insert failed with user_id, retrying with null...", assessmentErr.message);
         const retry = await supabaseAdmin
          .from("care_match_assessments")
          .insert({
            user_id: null,
            pet_passport_id: petPassportId,
            responses: structuredResponses,
            status: "draft",
            current_step: 6
          })
          .select()
          .single();
          
          assessmentData = retry.data;
          assessmentErr = retry.error;
      }

      if (assessmentErr) {
        return res.status(400).json({ success: false, error: "Database error: " + assessmentErr.message });
      }

      return res.json({ success: true, data: assessmentData });
    } catch (err: any) {
      console.error("[SmartMatch Save] Route error:", err);
      return res.status(500).json({ success: false, error: err.message || String(err) });
    }
  });
`;

codeLines.splice(start, end - start, newEndpoint);
fs.writeFileSync('server.ts', codeLines.join('\n'));
