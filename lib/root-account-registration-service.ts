import { createRootAccount } from "./account-service";
import { createMapSiteFromAccount } from "./mapsite-service";
import { getSupabaseAdmin } from "./supabaseAdmin";
import { createUser, updateUserFastCode } from "./user-service";

export interface CompleteRootAccountRegistrationInput {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  email: string;
  phone?: string | null;
}

export interface CompleteRootAccountRegistrationResult {
  userId: string;
  accountId: string;
  fastCode: string;
  mapsiteId: string;
  redirectUrl: string;
}

export async function completeRootAccountRegistration(
  input: CompleteRootAccountRegistrationInput
): Promise<CompleteRootAccountRegistrationResult> {
  const user = await createUser({
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
    role: "root",
  });

  const account = await createRootAccount({
    firstName: input.firstName,
    middleName: input.middleName,
    lastName: input.lastName,
    email: input.email,
    userId: user.id,
  });

  await updateUserFastCode(user.id, account.fastCode);

  const mapsite = await createMapSiteFromAccount(account, {
    phone: input.phone,
    accountType: "root",
  });

  const supabase = getSupabaseAdmin();
  await supabase
    .from("mapsites")
    .update({ status: "active" })
    .eq("id", mapsite.id);

  return {
    userId: user.id,
    accountId: account.id,
    fastCode: account.fastCode,
    mapsiteId: mapsite.id,
        redirectUrl: `/talispros/mapsites/${account.fastCode}`,
  };
}
