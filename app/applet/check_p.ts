import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);
const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function check() {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", "f9834ef6-778d-4384-8d17-6316fffa03b6");
  console.log("Profile Data:", data);
  console.log("Error:", error);
}
check();
