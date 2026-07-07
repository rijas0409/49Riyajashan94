console.log("Keys in process.env:", Object.keys(process.env).filter(k => k.includes("SUPABASE") || k.includes("KEY") || k.includes("URL")));
console.log("SUPABASE_URL:", process.env.VITE_SUPABASE_URL);
console.log("SUPABASE_SERVICE_ROLE_KEY has value:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("VITE_SUPABASE_ANON_KEY has value:", !!process.env.VITE_SUPABASE_ANON_KEY);
