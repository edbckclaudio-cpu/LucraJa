import { createClient } from "@supabase/supabase-js";
import { FLAGS } from "./featureFlags";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    flowType: FLAGS.authFlow,
    detectSessionInUrl: FLAGS.detectSessionInUrl,
  },
});
