import { createClient } from "@supabase/supabase-js";

async function checkConstraints() {
  let supabaseUrl = (process.env.VITE_SUPABASE_URL || "https://kvynslxotglracfgacgn.supabase.co").trim();
  try {
    const urlObj = new URL(supabaseUrl);
    supabaseUrl = urlObj.origin;
  } catch (e) {
    supabaseUrl = supabaseUrl.replace(/\/$/, "");
  }
  
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "").trim();
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Query information_schema for constraints on the table
  const { data, error } = await supabase.rpc("execute_sql", {
    query: `
      SELECT 
        tc.constraint_name, 
        tc.constraint_type,
        cc.check_clause
      FROM 
        information_schema.table_constraints tc
      LEFT JOIN 
        information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE 
        tc.table_name = 'care_match_assessments';
    `
  });
  
  console.log("CONSTRAINTS:", JSON.stringify(data || error || "No RPC execute_sql or no data", null, 2));
}

checkConstraints();
