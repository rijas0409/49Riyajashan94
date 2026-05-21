import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvynslxotglracfgacgn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const profileId = "f9834ef6-778d-4384-8d17-6316fffa03b6";
  
  // Try to insert the profile
  const { data, error } = await supabase.from("profiles").insert({
    id: profileId,
    name: "Dr. Jashan Pabla",
    email: "vet_jashan@gmail.com",
    role: "vet",
    is_admin_approved: true,
    is_onboarding_complete: true,
    address: "Noida, Sector 62",
    profile_photo: ""
  }).select();

  console.log("Insert result:", { data, error });
}

run();
