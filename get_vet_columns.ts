import { createClient } from "@supabase/supabase-js";

async function run() {
  let supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co").trim();
  try {
    const urlObj = new URL(supabaseUrl);
    supabaseUrl = urlObj.origin;
  } catch (err) {
    supabaseUrl = supabaseUrl.replace(/\/$/, "");
  }

  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  console.log("Supabase URL:", supabaseUrl);
  console.log("Supabase Key length:", supabaseKey.length);

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.from('vet_profiles').select('*').limit(1);
  if (error) {
    console.error("Error:", error);
  } else if (data && data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data found or empty array");
  }
}

run();
