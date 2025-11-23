
import { createClient } from '@supabase/supabase-js';

// Ces variables doivent être définies dans votre fichier .env local ou dans les variables d'environnement Netlify
// VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY

// Use a safe fallback if import.meta.env is undefined
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://votre-projet.supabase.co';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || 'votre-cle-anon-publique';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = 
    supabaseUrl !== 'https://votre-projet.supabase.co' && 
    supabaseAnonKey !== 'votre-cle-anon-publique';
