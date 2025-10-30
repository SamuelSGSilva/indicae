import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please check your environment variables.');
}

// Adicionado para depuração: Verifique estes valores no console do navegador no ambiente de produção.
console.log('Supabase URL:', supabaseUrl ? 'Configured' : 'NOT CONFIGURED');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Configured' : 'NOT CONFIGURED');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);