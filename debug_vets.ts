import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from client.ts to get the url and key in case of missing .env
const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);

const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function check() {
  console.log("Fetching Vets (Anon)...");
  
  // Try without the hint
  const { data, error } = await supabase
    .from("vet_profiles")
    .select(`
      id,
      user_id,
      profiles (
        id,
        name
      )
    `)
    .limit(1);
    
  console.log("Error (No hint):", error);
  console.log("Data snippet:", JSON.stringify(data?.slice(0, 2), null, 2));

  // Also describe the columns of vet_profiles to see if user_id is a foreign key
  // No easy way to query pg_class through rest, maybe we can run SQL? We don't have sql.
}
check();
