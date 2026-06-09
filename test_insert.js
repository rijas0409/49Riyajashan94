const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";
const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('pet_passports').insert({
    passport_id: 'SRV-TEST',
    pet_name: 'Test',
    species: 'Dog',
    owner_name: 'Test Owner'
  }).select();
  console.log("Error:", error);
  console.log("Data:", data);
}
test();
