import TalisMapsDashboardOverview from "@/components/talismaps/platform/TalisMapsDashboardOverview";
import { getTalisMapsDashboardData } from "@/lib/talismaps/map-service";

export const dynamic = "force-dynamic";

export default async function TalisMapsDashboardPage() {
  const data = await getTalisMapsDashboardData();

  return <TalisMapsDashboardOverview data={data} />;
}
