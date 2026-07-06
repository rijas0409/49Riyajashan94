import { createClient } from '@supabase/supabase-js';
const supabase = createClient("https://pndkddfssqbsowmmslye.supabase.co", process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...");
// Actually, I can just use curl on the running server!
