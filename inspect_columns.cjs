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
  // Let's inspect columns by querying RPC or selecting a non-existent column to see the schema error with column list
  const { data, error } = await supabase.from("care_match_assessments").select("non_existent_column").limit(1);
  console.log("Error:", error);
}

test();
