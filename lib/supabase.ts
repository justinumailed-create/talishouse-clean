import { supabase, isSupabaseConfigured } from "./supabaseClient";
export { supabase, isSupabaseConfigured };

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
  phone: string;
  location: string;
  fast_code: string | null;
  source: string;
  status: "new" | "contacted" | "converted";
  created_at: string;
  project_value?: number | null;
  commission_rate?: number | null;
  split_percentage?: number | null;
  deal_status?: "none" | "pending" | "active" | "completed" | "cancelled";
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

export interface LeadPayload {
  name: string;
  phone: string;
  location: string;
  source: string;
  status: string;
  deal_status: string;
  created_at?: string;
  fast_code?: string | null;
  project_value?: number | null;
  commission_rate?: number | null;
  split_percentage?: number | null;
}

export async function safeInsertLead(payload: LeadPayload) {
  try {
    console.log("RAW PAYLOAD:", payload);

    const allowedFields = [
      "name",
      "phone",
      "location",
      "source",
      "status",
      "deal_status",
      "created_at",
      "fast_code",
      "project_value",
      "commission_rate",
      "split_percentage"
    ];

    const cleanedPayload = Object.fromEntries(
      Object.entries(payload)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key, value]) => [key, value ?? null])
    );

    console.log("CLEANED PAYLOAD:", cleanedPayload);

    const { data, error } = await supabase
      .from("leads")
      .insert([cleanedPayload])
      .select();

    if (error) {
      console.error("SUPABASE ERROR FULL:", JSON.stringify(error, null, 2));
      throw new Error(JSON.stringify(error));
    }

    console.log("INSERT SUCCESS:", data);
    return data;

  } catch (err: any) {
    console.error("FINAL INSERT ERROR:", err?.message || err);
    throw err;
  }
}
