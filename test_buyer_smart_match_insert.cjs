const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');

async function testInsert() {
  const finalAssessmentId = "sms_test_session_" + Date.now();
  const smartMatchRecord = {
      id: finalAssessmentId,
      user_id: null,
      pet_passport_id: null,
      pet_name: "Test Puppy",
      step1_pet_details: { species: "dog", breed: "Golden Retriever" },
      step2_concerns: [{ question: "A", answer: "B" }],
      step3_health_background: [],
      step4_current_health_status: [],
      step5_photos_videos: [],
      step6_review_data: { test: true },
      status: "submitted",
      updated_at: new Date().toISOString()
  };

  console.log("Upserting payload...");
  const { error } = await supabase
    .from("buyer_smart_match")
    .upsert(smartMatchRecord, { onConflict: "id" });

  if (error) {
    console.error("UPSERT Error detail:", error);
  } else {
    console.log("UPSERT Success for ID:", finalAssessmentId);
  }
}

testInsert();
