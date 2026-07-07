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
  const record1 = {
    session_id: "test_session_upsert",
    user_id: null,
    pet_id: null,
    step: 1,
    question_id: "q1",
    question_text: "What is your pet's name?",
    question_type: "text",
    raw_answer: "Fido",
    normalized_answer: "Fido",
    status: "saved"
  };

  const record2 = {
    session_id: "test_session_upsert",
    user_id: null,
    pet_id: null,
    step: 1,
    question_id: "q1",
    question_text: "What is your pet's name?",
    question_type: "text",
    raw_answer: "Rex",
    normalized_answer: "Rex",
    status: "saved"
  };

  console.log("Upserting record 1...");
  const { data: d1, error: e1 } = await supabase.from("smart_match_responses").upsert(record1, { onConflict: "session_id,question_id" }).select();
  console.log("Record 1 result:", d1);
  console.log("Record 1 error:", e1);

  console.log("Upserting record 2 (conflict on session_id,question_id)...");
  const { data: d2, error: e2 } = await supabase.from("smart_match_responses").upsert(record2, { onConflict: "session_id,question_id" }).select();
  console.log("Record 2 result:", d2);
  console.log("Record 2 error:", e2);

  // Clean up
  await supabase.from("smart_match_responses").delete().eq("session_id", "test_session_upsert");
}

test();
