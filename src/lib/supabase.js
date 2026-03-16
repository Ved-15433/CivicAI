import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ethoqrgqgjpgbwdfwizn.supabase.co';
const supabaseAnonKey = 'sb_publishable_a_tW6zyqdcj9iU9CluACsQ_FZJCTatQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
