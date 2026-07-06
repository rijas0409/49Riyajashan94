async function run() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env;
  const url = VITE_SUPABASE_URL.endsWith('/') ? VITE_SUPABASE_URL : VITE_SUPABASE_URL + '/';
  const res = await fetch(`${url}pet_passports?select=id,passport_id,pet_name&limit=2`, {
    headers: {
      "apikey": VITE_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  console.log(await res.text());
}
run();
