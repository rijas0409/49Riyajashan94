import { createClient } from '@supabase/supabase-js';

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
      console.error("[Save SmartMatch Response] Upsert error:", upsertErr.message);
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
}
