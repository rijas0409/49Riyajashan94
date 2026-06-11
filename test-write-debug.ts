import { createClient } from "@supabase/supabase-js";

// Grab configurations
let supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co").trim();
try {
  const urlObj = new URL(supabaseUrl);
  supabaseUrl = urlObj.origin;
} catch (e) {
  supabaseUrl = supabaseUrl.replace(/\/$/, "");
}
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

console.log("Supabase URL:", supabaseUrl);
console.log("Using Key (truncated):", supabaseKey ? supabaseKey.substring(0, 15) + "..." : "NONE");

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("\n--- Starting Diagnostics Support for Pet Passport Database Write ---");
  
  // 1. Diagnostics write: Insert a temporary pet passport directly
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const testPassportId = `TST-DIAG-${randomSuffix}`;

  console.log(`\nAttempting direct insert into 'pet_passports' with passport_id: ${testPassportId}...`);
  
  const { data, error } = await supabase
    .from("pet_passports")
    .insert({
      passport_id: testPassportId,
      pet_name: "Diagnostic Pup",
      species: "Dog",
      gender: "Male",
      breed: "Diagnostic Retriever",
      owner_name: "Tester",
      primary_phone: "+15550199"
    })
    .select();

  if (error) {
    console.error("❌ Write to 'pet_passports' failed!");
    console.error("Error details:", error);
  } else {
    console.log("✅ Write to 'pet_passports' succeeded!");
    console.log("Inserted row data:", data);

    // Clean up our diagnostic run
    console.log(`Cleaning up test passport: ${testPassportId}...`);
    const { error: deleteError } = await supabase
      .from("pet_passports")
      .delete()
      .eq("passport_id", testPassportId);
      
    if (deleteError) {
      console.warn("⚠️ Cleanup failed, but the insert test was successful.", deleteError);
    } else {
      console.log("✅ Cleanup succeeded. Database is fully responsive and writes are functional!");
    }
  }

  // 2. Diagnostics write: Let's also create/test writing to a standalone 'debug_logs' table if it exists
  console.log("\nAttempting direct insert to 'debug_logs' table to check secondary channels...");
  const { data: logData, error: logError } = await supabase
    .from("debug_logs")
    .insert({
      log_level: "info",
      message: `Diagnostic test write at ${new Date().toISOString()}`,
      context: { source: "diagnostic-script", testPassportId }
    })
    .select();

  if (logError) {
    console.log("ℹ️ No 'debug_logs' table exists or write failed. This is expected if 'debug_logs' is not explicitly created inside Supabase database schema.");
    console.log("Technical details:", logError.message);
  } else {
    console.log("✅ 'debug_logs' table exists and write succeeded!", logData);
  }
}

testConnection();
