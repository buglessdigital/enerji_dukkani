const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://isecoqnmfqhvjnxlbbue.supabase.co', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// I can't do this easily without the key, wait I can get the key from .env.local
