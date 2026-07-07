const { createClient } = require("@supabase/supabase-js");

let url = (process.env.VITE_SUPABASE_URL || "").trim();
try {
  const urlObj = new URL(url);
  url = urlObj.origin;
} catch (e) {
  url = url.replace(/\/$/, "");
}
const key = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

const supabase = createClient(url, key);

async function test() {
  const { data: responses, error: err1 } = await supabase.from("smart_match_responses").select("*").limit(5);
  console.log("smart_match_responses error:", err1);
  console.log("smart_match_responses count/data:", responses);

  const { data: assessments, error: err2 } = await supabase.from("care_match_assessments").select("*").order("created_at", { ascending: false }).limit(5);
  console.log("care_match_assessments error:", err2);
  console.log("care_match_assessments count/data:", assessments);
}

test();
