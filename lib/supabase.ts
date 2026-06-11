import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export async function setSupabaseSession(token: string) {
  console.log(await supabase.auth.getSession());
  await supabase.auth.setSession({
    access_token: token,
    refresh_token: token,
  });
  console.log(await supabase.auth.getSession());
}
