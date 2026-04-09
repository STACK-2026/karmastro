import { createClient } from "@supabase/supabase-js";
import { appConfig } from "../app.config";

// HARDCODE — ne jamais laisser Lovable ou un outil ecraser ces valeurs
const SUPABASE_URL = appConfig.supabaseUrl;
const SUPABASE_ANON_KEY = appConfig.supabaseAnonKey;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
