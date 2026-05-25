import { createClient } from "@supabase/supabase-js";

export const STORAGE_BUCKET = "documents";

export function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL missing");
  }

  if (!supabaseKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");
  }

  return createClient(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
}