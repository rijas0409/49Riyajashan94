import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

const VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co";
const VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

async function debugVets() {
  const { data: p } = await supabase.from("profiles").select("*").eq("role", "vet");
  console.log("=== PROFILES ===");
  console.log(JSON.stringify(p, null, 2));

  const { data: v } = await supabase.from("vet_profiles").select("*");
  console.log("=== VET_PROFILES ===");
  console.log(JSON.stringify(v, null, 2));
}

debugVets();
