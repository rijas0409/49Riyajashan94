const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');

async function run() {
  const finalAssessmentId = require('crypto').randomUUID();
  const dbUserId = 'cb5e830c-5d95-4a38-a9e2-c919b120b65a';
  const petPassportId = '70c0e8ec-c6c8-413f-bc81-405f679e3480';

  let { error: insertErr } = await supabase
    .from("care_match_assessments")
    .insert({
      id: finalAssessmentId,
      user_id: dbUserId,
      pet_passport_id: petPassportId,
      responses: {},
      status: "submitted",
      current_step: 6
    });

    console.log("Insert 1 error:", insertErr);

  if (insertErr && dbUserId) {
    console.warn("[SmartMatch Save] Insert failed with user_id, retrying with null user_id...", insertErr.message);
    const { error: retryErr } = await supabase
      .from("care_match_assessments")
      .insert({
        id: finalAssessmentId,
        user_id: null,
        pet_passport_id: petPassportId,
        responses: {},
        status: "submitted",
        current_step: 6
      });
    insertErr = retryErr;
  }
  
  console.log("Final error:", insertErr);
}
run();
