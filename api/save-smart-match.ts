import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const payload = req.body;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://lnxzkusbhidaqhhsxjtk.supabase.co";
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf";

    let supabaseUrlClean = supabaseUrl.trim();
    try {
      const urlObj = new URL(supabaseUrlClean);
      supabaseUrlClean = urlObj.origin;
    } catch (e) {
      supabaseUrlClean = supabaseUrlClean.replace(/\/$/, "");
    }

    const supabaseAdmin = createClient(supabaseUrlClean, supabaseKey.trim());

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

    const generateFallbackUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    // Safe fallback using standard UUID
    const finalAssessmentId = payload.sessionId || generateFallbackUUID();

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
}
