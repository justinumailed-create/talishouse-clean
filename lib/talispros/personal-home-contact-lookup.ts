/**
 * Server-only lookup for a single public phone or email. Do not import this
 * from Client Components or from unit tests that run in a plain Node graph.
 */

import { loadPublishedMapSiteView } from "@/components/mapsite/PublishedMapSiteView";
import { coalescePersonalHomeContact } from "@/lib/talispros/personal-home";
import type { ContactRevealInput } from "@/lib/talispros/personal-home-contact";
import { loadPersonalHomeContent } from "@/lib/talispros/personal-home-service";

export async function lookupPublicContactValue(
  input: ContactRevealInput,
): Promise<string | null> {
  if (input.surface === "mapsite") {
    const view = await loadPublishedMapSiteView(input.code).catch(() => null);
    if (!view) return null;
    const value =
      input.field === "phone"
        ? view.phone?.trim() || ""
        : view.email?.trim() || "";
    return value || null;
  }

  const content = await loadPersonalHomeContent(input.code);
  const contact = coalescePersonalHomeContact({
    contactName: content.contactName,
    contactPhone: content.contactPhone,
    contactEmail: content.contactEmail,
  });
  const value =
    input.field === "phone"
      ? contact.contactPhone?.trim() || ""
      : contact.contactEmail?.trim() || "";
  return value || null;
}
