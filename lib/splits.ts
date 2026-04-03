import { supabase } from "./supabase";

export interface SplitsResult {
  msrpReward: number;
  addonsReward: number;
  totalReward: number;
}

export function calculateSplits(
  basePrice: number,
  addonsValue: number
): SplitsResult {
  const msrpReward = basePrice * 0.20;
  const addonsReward = addonsValue * 0.80;
  const totalReward = msrpReward + addonsReward;

  return {
    msrpReward: Math.round(msrpReward * 100) / 100,
    addonsReward: Math.round(addonsReward * 100) / 100,
    totalReward: Math.round(totalReward * 100) / 100,
  };
}

export async function validateFastCode(fastCode: string): Promise<boolean> {
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("fast_code", fastCode.toUpperCase())
    .eq("role", "associate")
    .maybeSingle();
  
  return !!data;
}

export async function getUserByFastCode(fastCode: string) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("fast_code", fastCode.toUpperCase())
    .eq("role", "associate")
    .maybeSingle();
  
  return data;
}

export async function syncTransactionToSplits(
  dealId: string,
  fastCode: string,
  amount: number,
  paymentType: string
): Promise<void> {
  const user = await getUserByFastCode(fastCode);
  if (!user) {
    console.error("Invalid FAST Code - cannot sync earnings");
    return;
  }

  const { data: deal } = await supabase
    .from("deals_v2")
    .select("*")
    .eq("id", dealId)
    .maybeSingle();

  if (!deal) {
    console.error("Deal not found");
    return;
  }

  const basePrice = deal.base_price || deal.value || 0;
  const addonsValue = deal.addons_value || 0;

  const splits = calculateSplits(basePrice, addonsValue);

  if (splits.msrpReward > 0) {
    const msrpPayload = {
      user_id: user.id,
      deal_id: dealId,
      fast_code: fastCode.toUpperCase(),
      amount: splits.msrpReward,
      type: "msrp",
    };
    console.log("EARNINGS MSRP INSERT - Payload:", JSON.stringify(msrpPayload, null, 2));

    const { error: msrpError } = await supabase.from("earnings").insert([msrpPayload]);
    if (msrpError) {
      console.error("EARNINGS MSRP INSERT ERROR:", JSON.stringify(msrpError, null, 2));
    } else {
      console.log("EARNINGS MSRP INSERT SUCCESS");
    }
  }

  if (splits.addonsReward > 0) {
    const addonsPayload = {
      user_id: user.id,
      deal_id: dealId,
      fast_code: fastCode.toUpperCase(),
      amount: splits.addonsReward,
      type: "addons",
    };
    console.log("EARNINGS ADDONS INSERT - Payload:", JSON.stringify(addonsPayload, null, 2));

    const { error: addonsError } = await supabase.from("earnings").insert([addonsPayload]);
    if (addonsError) {
      console.error("EARNINGS ADDONS INSERT ERROR:", JSON.stringify(addonsError, null, 2));
    } else {
      console.log("EARNINGS ADDONS INSERT SUCCESS");
    }
  }
}

export async function getAssociateEarnings(userId: string) {
  const { data } = await supabase
    .from("earnings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getTotalEarnings(userId: string): Promise<number> {
  const { data } = await supabase
    .from("earnings")
    .select("amount")
    .eq("user_id", userId);

  if (!data) return 0;
  return data.reduce((sum, e) => sum + (e.amount || 0), 0);
}

export interface NormalizedLead {
  name: string;
  phone: string;
  projectType: string;
  source: string;
  fastCode: string;
}

export function normalizeLead(
  input: Record<string, unknown>,
  defaultSource: string = "website"
): NormalizedLead {
  return {
    name: String(input.name || input.client_name || "").trim(),
    phone: String(input.phone || "").trim(),
    projectType: String(input.project_type || input.project_details || "").trim(),
    source: String(input.source || defaultSource).trim(),
    fastCode: String(input.fast_code || input.fastCode || "unassigned").toUpperCase().trim(),
  };
}

export function validateLead(lead: NormalizedLead): {
  valid: boolean;
  error?: string;
} {
  if (!lead.name) {
    return { valid: false, error: "Name is required" };
  }
  if (!lead.phone) {
    return { valid: false, error: "Phone is required" };
  }
  return { valid: true };
}

export function getLeadFastCode(lead: NormalizedLead): string {
  if (!lead.fastCode || lead.fastCode === "unassigned" || lead.fastCode === "") {
    return "DIRECT";
  }
  return lead.fastCode;
}
