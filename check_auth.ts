import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);
const supabaseUrl = urlMatch?.[1] || "";
const supabaseKey = keyMatch?.[1] || "";

const supabaseAnon = createClient(supabaseUrl, supabaseKey);

async function check() {
    // 1. Authenticate as the user we see in the logs: jashanpabla6691@gmail.com
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
        email: "jashanpabla6691@gmail.com",
        password: "password123" // assuming standard default password used in dev
    });
    
    if (authError) {
        console.log("Failed to login as buyer. Let's create a test buyer.");
        await supabaseAnon.auth.signUp({
            email: "testbuyer12345@test.com",
            password: "password123"
        });
        await supabaseAnon.auth.signInWithPassword({
            email: "testbuyer12345@test.com",
            password: "password123"
        });
    }

    console.log("Logged in!");

    const { data: vetProfiles, error: vpErr } = await supabaseAnon
        .from("vet_profiles")
        .select("id, user_id, verification_status, is_active, clinic_address")
        .in("verification_status", ["verified", "approved"])
        .eq("is_active", true);

    console.log("Vets fetched as auth:", vetProfiles?.length, vpErr);

    const { data: profiles, error: profileErr } = await supabaseAnon
        .from("profiles")
        .select("id, name, is_admin_approved, address")
        .in("id", (vetProfiles || []).map(p => p.user_id));

    console.log("Profiles fetched as auth:", profiles?.length, profileErr);
}
check();
