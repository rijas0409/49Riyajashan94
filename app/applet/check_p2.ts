import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);
const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function getPolicies() {
    // We cannot query pg_policies via standard rest interface because of role anon.
    // Is there a public profiles edge case? Let's verify by just creating a dummy profile and reading it back.
    const {data} = await supabase.from('profiles').select('id, name, is_admin_approved').eq('role', 'seller');
    console.log("Seller rows:", data?.length);
    const {data: allData} = await supabase.from('profiles').select('id, role');
    console.log("Total visible rows:", allData?.length);
    console.log("Roles visible:", [...new Set((allData||[]).map(x=>x.role))]);
}
getPolicies();
