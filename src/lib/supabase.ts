import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set in environment variables");
}

if (!supabaseKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set in environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
