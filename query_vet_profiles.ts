import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co";
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase.from("vet_profiles").select("id, name, city, is_verified, specialization");
  console.log("Error:", error);
  console.log("Data:", data);
}
run();
