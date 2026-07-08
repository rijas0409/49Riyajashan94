const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');
async function run() {
    const { data, error } = await supabase.rpc("get_schema", { table_name: "care_match_assessments" }).catch(() => ({}));
    console.log("Schema:", data, error);
}
run();
