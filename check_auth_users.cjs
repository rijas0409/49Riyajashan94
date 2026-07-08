const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');
async function run() {
    // we can't query auth.users from anon key, but we can query pet_passports to see what users exist.
}
run();
