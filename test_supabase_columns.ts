import { supabase } from "./src/integrations/supabase/client";

async function run() {
  const { data, error } = await supabase.from('pet_passports').select('*').limit(1);
  console.log(error);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  }
}

run();
