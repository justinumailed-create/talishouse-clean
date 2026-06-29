import type { Database } from "./database.types";
import { getSupabaseAdmin } from "./supabaseAdmin";

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  fastCode?: string | null;
  role?: string;
}

export interface CreateUserResult {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  fastCode: string | null;
  role: string;
  createdAt: string;
}

export async function createUser(
  input: CreateUserInput
): Promise<CreateUserResult> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone?.trim() || null;
  const fastCode = input.fastCode?.trim().toLowerCase() || null;

  if (!firstName) {
    throw new Error("First name is required");
  }
  if (!lastName) {
    throw new Error("Last name is required");
  }
  if (!email) {
    throw new Error("Email is required");
  }

  const record: Database["public"]["Tables"]["users"]["Insert"] = {
    name: `${firstName} ${lastName}`,
    email,
    phone,
    fast_code: fastCode,
    role: input.role || "associate",
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("users")
    .insert(record)
    .select()
    .single();

  if (error || !data) {
    throw new Error(`Failed to create user: ${error?.message || "Unknown error"}`);
  }

  return {
    id: data.id,
    name: data.name || `${firstName} ${lastName}`,
    email: data.email || email,
    phone: data.phone,
    fastCode: data.fast_code,
    role: data.role,
    createdAt: data.created_at,
  };
}

export async function updateUserFastCode(
  userId: string,
  fastCode: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("users")
    .update({ fast_code: fastCode.trim().toLowerCase() })
    .eq("id", userId);

  if (error) {
    throw new Error(`Failed to update user FAST Code: ${error.message}`);
  }
}
