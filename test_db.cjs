const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');
async function run() {
  let fallbackResponses = {
      meta: { submitted_at: new Date().toISOString() },
      pet_details: {},
      concerns: [],
      health_background: [],
      current_health_status: [],
      media_files: [],
      review_data: {}
  };
  const fallbackRecord = {
      id: require('crypto').randomUUID(),
      user_id: null,
      pet_passport_id: null,
      responses: fallbackResponses,
      status: "submitted",
      current_step: 6
  };
  let { error: fallbackErr } = await supabase.from("care_match_assessments").insert(fallbackRecord);
  console.log("Error:", fallbackErr);
}
run();
