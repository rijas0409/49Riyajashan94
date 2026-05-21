import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvynslxotglracfgacgn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: p, error: pe } = await supabase.from("profiles").select("id, name, is_admin_approved, role, address, approved_at, created_at").eq("role", "vet");
  console.log("=== PROFILES ===");
  if (pe) console.error(pe);
  p?.forEach(profile => {
    console.log(`ID: ${profile.id}, Name: ${profile.name}, approved: ${profile.is_admin_approved}, aproved_at: ${profile.approved_at}, created: ${profile.created_at}`);
  });

  const { data: v, error: ve } = await supabase.from("vet_profiles").select("user_id, is_active, verification_status");
  console.log("=== VET_PROFILES ===");
  if (ve) console.error(ve);
  v?.forEach(vp => {
    console.log(`User ID: ${vp.user_id}, Active: ${vp.is_active}, Verified: ${vp.verification_status}`);
  });
}

run();
