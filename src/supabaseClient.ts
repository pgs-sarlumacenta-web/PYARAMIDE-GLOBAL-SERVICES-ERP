
import { createClient } from '@supabase/supabase-js';

// Use a safe fallback if import.meta.env is undefined
const env = (import.meta as any).env || {};

// URL de votre projet Supabase
const supabaseUrl = env.VITE_SUPABASE_URL;

// Clé API publique (anon key)
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase URL or Anon Key is missing. The app will run in Demo Mode.");
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder-key'
);

export const isSupabaseConfigured = 
    !!supabaseUrl && 
    !!supabaseAnonKey &&
    supabaseUrl !== 'https://placeholder.supabase.co';
