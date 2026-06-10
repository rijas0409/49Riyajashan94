import { createClient } from "@supabase/supabase-js";
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co";
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  if (!supabaseKey) { console.error("No key"); return; }
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase.from('pet_passports').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data columns:", data && data[0] ? Object.keys(data[0]) : "No data");
  
  // Try to create the user_id column just in case through REST or check if it exists:
  // Supabase postgrest doesn't allow DDL.
}
run();
