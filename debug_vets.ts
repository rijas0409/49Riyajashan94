import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Read from client.ts to get the url and key in case of missing .env
const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);

const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function check() {
  console.log("Executing the exact select statement used in server.ts...");
  const { data, error } = await supabase
    .from("vet_profiles")
    .select("id, user_id, specializations, medical_specializations");
  
  console.log("Query Error:", error);
  console.log("Returned Vets count:", data?.length);
  if (data && data.length > 0) {
    console.log("Successfully fetched vets! First vet id:", data[0].id);
  }
}
check();
