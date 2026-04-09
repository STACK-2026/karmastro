import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// HARDCODE — ne jamais laisser un outil ecraser ces valeurs
const SUPABASE_URL = "https://ytyujdkjwkupqfnwewfb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0eXVqZGtqd2t1cHFmbndld2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NzI5NjcsImV4cCI6MjA5MTI0ODk2N30.NAGxYoXahszf6qfgqXOoxyi-WZpxxJ4uVOiVWroaaq8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
