import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase Client Init: VITE_SUPABASE_URL =', supabaseUrl ? 'Loaded' : 'Undefined');
console.log('Supabase Client Init: VITE_SUPABASE_ANON_KEY =', supabaseAnonKey ? 'Loaded' : 'Undefined');

if (!supabaseUrl) {
  throw new Error('VITE_SUPABASE_URL is required. Please set it in your .env.local file in the project root.');
}
if (!supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_ANON_KEY is required. Please set it in your .env.local file in the project root.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);