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

async function inspect() {
  const { data, error } = await supabase.rpc("get_columns", { table_name: "care_match_assessments" });
  if (error) {
    // If RPC doesn't exist, try a simple query to information_schema if allowed, or just log the error
    console.log("RPC get_columns failed/not found:", error.message);
    
    // We can also query using standard sql if possible, or just look at a table row if any.
    // Let's try to query information_schema via a post request or custom way.
  } else {
    console.log("Columns of care_match_assessments:", data);
  }
}

inspect();
