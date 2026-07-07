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
  // 1. Fetch a valid pet passport
  const { data: pets, error: petErr } = await supabase.from("pet_passports").select("id, passport_id, user_id").limit(1);
  if (petErr) {
    console.error("Error fetching pet passport:", petErr);
    return;
  }
  if (!pets || pets.length === 0) {
    console.log("No pet passports found in database! Let's insert a mock pet passport first to test constraints.");
    
    // Insert a mock passport
    const mockPassport = {
      passport_id: "PAS-TEST-UUID",
      pet_name: "Test Pet",
      species: "Dog",
      gender: "Male",
      owner_name: "Test Owner",
      primary_phone: "1234567890"
    };
    const { data: newPets, error: createErr } = await supabase.from("pet_passports").insert(mockPassport).select();
    if (createErr) {
      console.error("Error creating mock pet passport:", createErr);
      return;
    }
    pets.push(newPets[0]);
  }

  const pet = pets[0];
  console.log("Using pet passport:", pet);

  // 2. Attempt to insert care_match_assessments
  const record = {
    id: "00000000-0000-0000-0000-000000000001",
    user_id: pet.user_id,
    pet_passport_id: pet.id,
    responses: { test: "data", step: 6 },
    status: "submitted",
    current_step: 6
  };

  const { data: assessment, error: insertErr } = await supabase.from("care_match_assessments").insert(record).select();
  console.log("Insert assessment result:", assessment);
  console.log("Insert assessment error:", insertErr);

  // Clean up
  if (assessment) {
    await supabase.from("care_match_assessments").delete().eq("id", record.id);
  }
}

test();
