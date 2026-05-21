import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvynslxotglracfgacgn.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const userId = "f9834ef6-778d-4384-8d17-6316fffa03b6";
  
  console.log("Selecting profile for", userId);
  const { data: profile, error: selectErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId);
    
  console.log("Profile select result:", profile);
  console.log("Select error:", selectErr);
  
  if (!profile || profile.length === 0) {
    console.log("Attempting to insert profile...");
    const { data: insertData, error: insertErr } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        name: "Jashan Pabla",
        full_name: "Jashan Pabla",
        role: "vet",
        is_admin_approved: true,
        is_onboarding_complete: true,
        email: "jashanpabla6691@gmail.com"
      });
      
    console.log("Profile insert result:", insertData);
    console.log("Insert error:", insertErr);
  }
}

run();
