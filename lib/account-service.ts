import type { Database } from "./database.types";
import { generateFastCode } from "@/services/fast-code.service";
import { getSupabaseAdmin } from "./supabaseAdmin";

export interface CreateAccountInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email?: string | null;
  userId?: string | null;
  accountType?: string;
  fastCode?: string;
}

export interface CreateAccountResult {
  id: string;
  userId: string | null;
  accountType: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fastCode: string;
  email: string | null;
  createdAt: string;
}

export async function createAccount(
  input: CreateAccountInput
): Promise<CreateAccountResult> {
  const firstName = input.firstName.trim();
  const middleName = input.middleName?.trim() || null;
  const lastName = input.lastName.trim();
  const email = input.email?.trim().toLowerCase() || null;

  if (!firstName) {
    throw new Error("First name is required");
  }
  if (!lastName) {
    throw new Error("Last name is required");
  }

  const fastCode =
    input.fastCode ??
    (await generateFastCode({
      firstName,
      middleName,
      lastName,
    }));

  const record: Database["public"]["Tables"]["accounts"]["Insert"] = {
    first_name: firstName,
    middle_name: middleName,
    last_name: lastName,
    fast_code: fastCode,
    email,
    user_id: input.userId || null,
    account_type: input.accountType || "standard",
  };

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("accounts")
    .insert(record)
    .select()
    .single();

  if (error || !data) {
    throw new Error(
      `Failed to create account: ${error?.message || "Unknown error"}`
    );
  }

  return {
    id: data.id,
    userId: data.user_id,
    accountType: data.account_type,
    firstName: data.first_name,
    middleName: data.middle_name,
    lastName: data.last_name,
    fastCode: data.fast_code,
    email: data.email,
    createdAt: data.created_at,
  };
}

export async function createRootAccount(
  input: Omit<CreateAccountInput, "accountType">
): Promise<CreateAccountResult> {
  return createAccount({
    ...input,
    accountType: "root",
  });
}
