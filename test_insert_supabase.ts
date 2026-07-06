import axios from "axios";
import { getSupabaseAdmin } from "./server";

async function testSupabase() {
  const supabase = await getSupabaseAdmin();
  const dbUserId = "ff9d1e1d-22d8-4774-ad68-e2564da6b7cb";
  const petPassportId = "c12228d5-0440-4fe4-8827-dbfd3fa22324";
  
  let { data: assessmentData, error: assessmentErr } = await supabase
    .from("care_match_assessments")
    .insert({
      user_id: dbUserId,
      pet_passport_id: petPassportId,
      responses: {},
      status: "draft"
    })
    .select();

  console.log("Insert result:", assessmentData, assessmentErr);
}

//testSupabase();
