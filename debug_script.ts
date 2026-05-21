import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvynslxotglracfgacgn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: p, error: pe, count: pc } = await supabase.from("profiles").select("*", { count: 'exact' });
  console.log("=== PROFILES ===");
  if (pe) console.error("Profiles Error:", pe);
  console.log("Count:", pc);
  console.log("Data:", JSON.stringify(p, null, 2));

  const { data: v, error: ve, count: vc } = await supabase.from("vet_profiles").select("*", { count: 'exact' });
  console.log("=== VET_PROFILES ===");
  if (ve) console.error("Vet Profiles Error:", ve);
  console.log("Count:", vc);
  console.log("Data:", JSON.stringify(v, null, 2));
}

run();
