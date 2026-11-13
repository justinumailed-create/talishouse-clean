import MarketsAdminGate from "@/components/talisu/MarketsAdminGate";
import TalisUMarketsMapApp from "@/components/talisu/TalisUMarketsMapApp";
import { getAdminSessionAccount } from "@/lib/admin-auth";
import type { MarketsRegion } from "@/components/talisu/TalisUMarketsMapApp";

/**
 * Signed-in admins (Global Admin, grants, Agent Admins) see the map.
 * Everyone else gets the Global Admin password form. A correct password
 * creates the same admin session as /admin/login, then this page shows the map.
 */
export default async function MarketsMapOrGate({ region }: { region: MarketsRegion }) {
  const account = await getAdminSessionAccount();
  if (!account) return <MarketsAdminGate />;
  return <TalisUMarketsMapApp region={region} />;
}
