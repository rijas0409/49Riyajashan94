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
  const testId = "e5554444-3333-2222-1111-999988887777";
  const { data, error } = await supabase.from("care_match_assessments").insert({
    id: testId,
    user_id: null,
    pet_passport_id: "c12228d5-0440-4fe4-8827-dbfd3fa22324", // valid pet_passport_id from earlier fetch success!
    responses: { test_save: true },
    status: "submitted",
    current_step: 6
  });
  console.log("Insert with current_step error:", error);
}

test();
