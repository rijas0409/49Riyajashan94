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
  const record = {
    session_id: "test_session_456",
    user_id: null,
    pet_id: "PAS-1234-XYZ", // Let's test a passport string
    step: 1,
    question_id: "test_q_2",
    question_text: "What is your pet's breed?",
    question_type: "text",
    raw_answer: "Goldendoodle",
    normalized_answer: "Goldendoodle",
    status: "saved"
  };

  const { data, error } = await supabase.from("smart_match_responses").insert(record).select();
  console.log("Insert with string pet_id result:", data);
  console.log("Insert error:", error);
}

inspect();
