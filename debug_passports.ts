import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://kvynslxotglracfgacgn.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0");

async function run() {
  const { data, error } = await supabase.from('pet_passports').select('id, user_id, pet_name').limit(10);
  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}
run();
