import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// HARDCODE — ne jamais laisser un outil écraser ces valeurs
// Nouveau projet Supabase (org KARMASTRO, propre)
const SUPABASE_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ramJtYmRydmVqZW16cmdneHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzE1MjUsImV4cCI6MjA5MTM0NzUyNX0.KYc8rXIC0RPMskW6eJIE_EranUcLK6nckCAWEph-340";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
