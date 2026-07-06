import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lnxzkusbhidaqhhsxjtk.supabase.co";
const SUPABASE_KEY = "sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf";

async function check() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data: user } = await supabase.auth.getUser(); // This needs service role key though... wait, let's just query profiles directly
  
  // The user said the userId is: ff9d1e1d-22d8-4774-ad68-e2564da6b7cb
  const { data: profile, error } = await supabase.from("profiles").select("*").eq("id", "ff9d1e1d-22d8-4774-ad68-e2564da6b7cb");
  console.log("Profile:", profile);
  console.log("Error:", error);
}

check();
