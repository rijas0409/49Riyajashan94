const { createClient } = require("@supabase/supabase-js");

let url = (process.env.VITE_SUPABASE_URL || "").trim();
try {
  const urlObj = new URL(url);
  url = urlObj.origin;
} catch (e) {
  url = url.replace(/\/$/, "");
}
const key = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from("pet_passports").select("id, passport_id, pet_name, user_id").limit(10);
  console.log("Error:", error);
  console.log("Pet passports:", data);
}

test();
