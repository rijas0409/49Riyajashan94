const { createClient } = require('@supabase/supabase-js');
const supabase = createClient("https://kvynslxotglracfgacgn.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
supabase.rpc("exec_sql", { sql: "SELECT 1;" }).then(res => console.log("exec_sql:", res));
