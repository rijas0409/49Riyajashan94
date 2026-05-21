import { createClient } from "@supabase/supabase-js";

// We need to pass the supabase url and key via command line
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'dummy';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugVets() {
  console.log("Fetching all vet profiles...");
  
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, role, is_admin_approved, is_onboarding_complete, name, address")
    .eq("role", "vet");
    
  if (pErr) {
    console.error("Profile error:", pErr);
    return;
  }
  
  console.log("Total vet profiles:", profiles?.length);
  console.log(JSON.stringify(profiles, null, 2));

  if (!profiles || profiles.length === 0) return;

  const { data: vetProfiles, error: vErr } = await supabase
    .from("vet_profiles")
    .select("*")
    .in("user_id", profiles.map(p => p.id));
    
  if (vErr) {
    console.error("Vet profile error:", vErr);
    return;
  }
  
  console.log("Total vet_profiles:", vetProfiles?.length);
  console.log(JSON.stringify(vetProfiles, null, 2));
}

debugVets();
