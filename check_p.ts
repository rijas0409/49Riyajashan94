import fs from "fs";
import { createClient } from "@supabase/supabase-js";

const code = fs.readFileSync("./src/integrations/supabase/client.ts", "utf-8");
const urlMatch = code.match(/rawUrl = VITE_SUPABASE_URL \|\| "(.*?)"/);
const keyMatch = code.match(/rawKey = VITE_SUPABASE_PUBLISHABLE_KEY \|\| "(.*?)"/);
const supabase = createClient(urlMatch?.[1] || "", keyMatch?.[1] || "");

async function check() {
  const { data: vetProfiles, error: vpErr } = await supabase
    .from("vet_profiles")
    .select("id, user_id, verification_status, is_active, clinic_address")
    .eq("verification_status", "verified")
    .eq("is_active", true);

  console.log("Vets fetched:", vetProfiles?.length);

  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, name, is_admin_approved, address")
    .in("id", (vetProfiles || []).map(p => p.user_id));

  console.log("Profiles fetched:", profiles?.length);

  const pMap = new Map((profiles || []).map((p) => [p.id, p]));

  const location = "";
  let vetsArr = (vetProfiles || [])
    .filter(vp => {
      const p = pMap.get(vp.user_id);
      if (p && !p.is_admin_approved) return false;

      const noLocationKnown = !p?.address && !vp?.clinic_address;
      return noLocationKnown || !location || location.toLowerCase() === "all" || location.toLowerCase() === "";
    })
    .map((vp) => {
      const p = pMap.get(vp.user_id);
      return {
        id: vp.id,
        name: `Dr. ${p?.name || "Veterinarian"}`
      };
    });

  console.log("vetsArr:", vetsArr);
}
check();
