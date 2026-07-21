import TalisBooksDashboardOverview from "@/components/talisbooks/platform/TalisBooksDashboardOverview";
import { getTalisBooksDashboardData } from "@/lib/talisbooks/book-service";

export const dynamic = "force-dynamic";

export default async function TalisBooksDashboardPage() {
  const data = await getTalisBooksDashboardData();

  return <TalisBooksDashboardOverview data={data} />;
}
