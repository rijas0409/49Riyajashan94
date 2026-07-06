async function run() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } = process.env;
  const res = await fetch(`${VITE_SUPABASE_URL}/rest/v1/pet_passports?select=*`, {
    headers: {
      "apikey": VITE_SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${VITE_SUPABASE_ANON_KEY}`
    }
  });
  console.log(await res.json());
}
run();
