import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

console.log("To debug fetch the data, we use curl in bash:");
console.log(`curl "\${SUPABASE_URL}/rest/v1/profiles?role=eq.vet&select=*" -H "apikey: \${SUPABASE_ANON_KEY}" -H "Authorization: Bearer \${SUPABASE_ANON_KEY}"`);
