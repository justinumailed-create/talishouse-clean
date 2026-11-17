import { aishaMapsiteDynamicVariables } from "@/lib/talispros/aisha-mapsite-agent";
import { getMapSiteByFastCode } from "@/lib/mapsite-service";

/**
 * Optional FAST Code on a guide page. No code means no variables, so the
 * agent keeps its own defaults. A code that does not match a Mapsite does
 * the same.
 */
export async function guideDynamicVariables(
  code: string | undefined,
): Promise<string | undefined> {
  const fast = code?.trim() ?? "";
  if (!fast) return undefined;
  try {
    const mapsite = await getMapSiteByFastCode(fast);
    if (!mapsite) return undefined;
    return aishaMapsiteDynamicVariables({
      ownerFirstName: mapsite.ownerFirstName,
      agentName: mapsite.agentName,
      fastCode: mapsite.fastCode,
      mapsiteTitle: mapsite.propertyTitle,
    });
  } catch {
    return undefined;
  }
}
