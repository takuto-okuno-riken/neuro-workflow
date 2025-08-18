import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 型定義
export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
  };
}

export interface AuthError {
  message: string;
  status?: number;
}
