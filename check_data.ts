import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);
const supabaseUrl = urlMatch?.[1] || "";
const supabaseKey = keyMatch?.[1] || "";
const supabaseAnon = createClient(supabaseUrl, supabaseKey);

async function check() {
    const { data: vetData, error: vetError } = await supabaseAnon
        .from("vet_profiles")
        .select(`
          id,
          user_id,
          specializations,
          years_of_experience,
          average_rating,
          online_fee,
          offline_fee,
          clinic_address,
          profile_photo,
          verification_status
        `)
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true);
        
    console.log("vetData length:", vetData?.length);
    console.log("vetError:", vetError);
}
check();
