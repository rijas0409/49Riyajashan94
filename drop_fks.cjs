const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');
async function run() {
  const { data, error } = await supabase.rpc('execute_sql', { query: `
    ALTER TABLE public.care_match_assessments DROP CONSTRAINT IF EXISTS care_match_assessments_user_id_fkey;
    ALTER TABLE public.care_match_assessments DROP CONSTRAINT IF EXISTS care_match_assessments_pet_passport_id_fkey;
  `});
  console.log("FK Drop Result:", data, error);
}
run();
