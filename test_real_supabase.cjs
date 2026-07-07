const { createClient } = require("@supabase/supabase-js");

let url = (process.env.VITE_SUPABASE_URL || "").trim();
try {
  const urlObj = new URL(url);
  url = urlObj.origin;
} catch (e) {
  url = url.replace(/\/$/, "");
}
const key = (process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();

console.log("Using cleaned URL:", url);
console.log("Using Key exists:", !!key);

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from("care_match_assessments").select("*").limit(1);
  if (error) {
    console.error("Error from care_match_assessments:", error);
  } else {
    console.log("Success from care_match_assessments:", data);
  }
}

test();
