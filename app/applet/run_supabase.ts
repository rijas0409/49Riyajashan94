import fs from 'fs';
import { createClient } from "@supabase/supabase-js";

// Read from /app/applet/supabase/config.toml or .env.example?
const envStr = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envStr.match(/VITE_SUPABASE_URL=(.*)/)?.[1] || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || envStr.match(/VITE_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const { data: p } = await supabase.from("profiles").select("*").eq("role", "vet");
  console.log("=== PROFILES ===");
  p?.forEach(profile => {
    console.log(`ID: ${profile.id}, Name: ${profile.name}, is_admin_approved: ${profile.is_admin_approved}, approved_at: ${profile.approved_at}, created_at: ${profile.created_at}`);
  });

  const { data: v } = await supabase.from("vet_profiles").select("*");
  console.log("=== VET_PROFILES ===");
  v?.forEach(vp => {
    console.log(`User ID: ${vp.user_id}, Active: ${vp.is_active}, Verified: ${vp.verification_status}`);
  });
}

run();
