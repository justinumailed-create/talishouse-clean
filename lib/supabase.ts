import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  });
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      'Content-Type': 'application/json',
    },
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

export function isSupabaseConfigured(): boolean {
  return !!supabaseUrl && !!supabaseAnonKey;
}

export interface Project {
  id: string;
  name: string;
  location: string;
  phone: string;
  fast_code: string | null;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

export interface FastCode {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  associate_id: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  location: string;
  fast_code: string | null;
  source: string;
  status: "new" | "contacted" | "converted";
  created_at: string;
  project_value?: number;
  commission_rate?: number;
  split_percentage?: number;
  deal_status?: "none" | "pending" | "active" | "completed" | "cancelled";
  interest?: string | null;
  price_range?: string | null;
}

export interface Associate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  commission_rate: number;
  active: boolean;
}

export interface ContactLog {
  id: string;
  message: string;
  phone: string;
  timestamp: string;
}

export interface Payment {
  id: string;
  product_name: string;
  amount: number;
  user_name: string;
  status: string;
  created_at: string;
}

export interface Deal {
  id: string;
  lead_id: string;
  client_name: string;
  project_type: string | null;
  project_value: number;
  commission_percent: number;
  split_percent: number;
  earnings: number;
  status: "open" | "won" | "lost";
  created_at: string;
}

export interface DealV2 {
  id: string;
  user_id: string | null;
  client_name: string | null;
  phone: string | null;
  project_type: string | null;
  status: string;
  value: number | null;
  fast_code: string | null;
  project_details: string | null;
  base_price: number | null;
  addons_value: number | null;
  source: string | null;
  created_at: string;
}

export interface User {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  fast_code: string | null;
  role: string;
  role_type: string | null;
  location: string | null;
  intro_message: string | null;
  images: string[];
  created_at: string;
  is_page_enabled?: boolean;
  page_headline?: string | null;
  page_subtext?: string | null;
  page_contact_cta?: string | null;
  page_footer_note?: string | null;
  page_custom_message?: string | null;
}

export interface AssociateApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  preferred_fast_code: string | null;
  role_type: string;
  status: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  deal_id: string | null;
  fast_code: string;
  amount: number;
  payment_type: string;
  created_at: string;
}

export interface Earning {
  id: string;
  user_id: string | null;
  deal_id: string | null;
  fast_code: string;
  amount: number;
  type: string;
  created_at: string;
}

export interface ContactLog {
  id: string;
  fast_code: string | null;
  message: string;
  timestamp: string;
}
