import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zwtpllgtzbotkdjyeiqi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dHBsbGd0emJvdGtkanllaXFpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MjExNjYsImV4cCI6MjA4OTE5NzE2Nn0.Y0iD9uZdWkrfuJYTWcUewIhsa4GLcYvCKQ8bMMdnXHg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);