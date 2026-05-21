import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

const envStr = fs.readFileSync('.env', 'utf-8');
const VITE_SUPABASE_URL = envStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '';
const VITE_SUPABASE_ANON_KEY = envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';

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
