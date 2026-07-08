const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');
async function run() {
  const { data, error } = await supabase.from('care_match_assessments').insert({
      id: require('crypto').randomUUID(),
      user_id: null,
      pet_passport_id: '70c0e8ec-c6c8-413f-bc81-405f679e3480',
      responses: {},
      status: "submitted",
      current_step: 6
  });
  console.log(error);
}
run();
