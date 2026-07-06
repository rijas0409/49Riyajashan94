async function run() {
  const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = process.env;
  const url = VITE_SUPABASE_URL.endsWith('/') ? VITE_SUPABASE_URL : VITE_SUPABASE_URL + '/';
  const res = await fetch(`${url}smart_match_questions?select=id&limit=1`, {
    headers: {
      "apikey": VITE_SUPABASE_PUBLISHABLE_KEY,
      "Authorization": `Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}`
    }
  });
  console.log(await res.text());
}
run();
