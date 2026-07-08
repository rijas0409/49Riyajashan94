import { createClient } from '@supabase/supabase-js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  try {
    const sessionId = req.query.sessionId;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }

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

    // Try selecting from buyer_smart_match
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
}
