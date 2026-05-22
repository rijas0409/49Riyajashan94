import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from client.ts to get the url and key in case of missing .env
const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);

const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function check() {
  console.log("Fetching Vets (Anon)...");
  
  const { data, error } = await supabase
    .from("vet_profiles")
    .select("*")
    .in("verification_status", ["verified", "approved"])
    .eq("is_active", true)
    .limit(1);
    
  console.log("Error (No hint):", error);
  console.log("Data snippet:", JSON.stringify(data?.[0], null, 2));

  console.log("Fetching profiles for Vets (Anon)...");
  
  const userIds = data?.map(v => v.user_id) || [];
  if (userIds.length > 0) {
    const { data: profiles, error: pError } = await supabase
      .from("profiles")
      .select("id, name, email")
      .in("id", userIds);
      
    console.log("Profiles Error:", pError);
    console.log("Profiles Data length:", profiles?.length);
    console.log("Profiles Data:", profiles);
  }
}
check();
