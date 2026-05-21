import { createClient } from "@supabase/supabase-js";

// Load environment variables for tsx
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("Missing supabase env vars");
  process.exit(1);
}

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
