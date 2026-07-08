const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lnxzkusbhidaqhhsxjtk.supabase.co', 'sb_publishable_3RZcGzoDXliNivNsbgGHjw_1rmQgGFf');

async function test() {
  console.log("Checking buyer_smart_match...");
  const { data, error } = await supabase
    .from("buyer_smart_match")
    .select("*")
    .limit(1);

  if (error) {
    console.error("SELECT Error:", error);
  } else {
    console.log("SELECT Success! Data count:", data.length);
  }
}

test();
