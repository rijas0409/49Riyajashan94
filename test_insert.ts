import { supabase } from "./src/integrations/supabase/client";

async function test() {
  const { data, error } = await supabase.from("vet_appointments").insert({
    booking_id: "test",
    payment_details: { test: true }
  });
  console.log("Error:", error);
}

test();
