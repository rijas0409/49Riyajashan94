import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://kvynslxotglracfgacgn.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2eW5zbHhvdGdscmFjZmdhY2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1NDMwNjUsImV4cCI6MjA4MDExOTA2NX0.i9-bXgL2891ji3AK-mS4wLp6HDl4DIStrcJeONNEKP0";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkRLS() {
  const { data, error } = await supabase.from('vet_appointments').insert({
    vet_id: 'f9834ef6-778d-4384-8d17-6316fffa03b6',
    user_id: 'f9834ef6-778d-4384-8d17-6316fffa03b6',
    appointment_date: '2026-06-04',
    appointment_time: '11:00 AM',
    status: 'pending',
    amount: 100,
    appointment_type: 'clinic'
  }).select();
  
  console.log("Insert Error:", error);
  console.log("Insert Data:", data);
}

checkRLS();
