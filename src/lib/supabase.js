import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ethoqrgqgjpgbwdfwizn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV0aG9xcmdxZ2pwZ2J3ZGZ3aXpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1OTAzNDQsImV4cCI6MjA4OTE2NjM0NH0.s-x-YPq2Se4dYQDT27zcqiJXQZGCrL4lDykOJJY7XHQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
