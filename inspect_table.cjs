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
  // Try inserting a test row
  const record = {
    session_id: "test_session_123",
    user_id: null,
    pet_id: null,
    step: 1,
    question_id: "test_q",
    question_text: "What is your pet's name?",
    question_type: "text",
    raw_answer: "test_answer",
    normalized_answer: "test_answer",
    status: "saved"
  };

  const { data, error } = await supabase.from("smart_match_responses").insert(record).select();
  console.log("Insert result:", data);
  console.log("Insert error:", error);
}

inspect();
