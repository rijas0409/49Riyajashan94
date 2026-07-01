import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from client.ts to get the url and key in case of missing .env
const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);

const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function check() {
  console.log("Fetching ALL Vets...");
  
  const { data, error } = await supabase
    .from("vet_profiles")
    .select("id, user_id, is_active, verification_status, specializations, available_days, morning_slots, evening_slots, average_rating, years_of_experience");
    
  console.log("Error:", error);
  console.log("Total vets:", data?.length);
  console.log("Vets list:", JSON.stringify(data, null, 2));
}
check();
