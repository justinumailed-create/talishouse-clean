import type { Metadata } from "next";
import TalisBooksLibraryShell from "@/components/talisbooks/library/TalisBooksLibraryShell";
import { getPublicTalisBooksBookshelf } from "@/lib/talisbooks/library";
import { TALISBOOKS_PRODUCT_NAME } from "@/lib/talisbooks/constants";
import { createMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

interface FastCodeBookshelfPageProps {
  params: Promise<{
    fastCode: string;
  }>;
}

export async function generateMetadata({
  params,
}: FastCodeBookshelfPageProps): Promise<Metadata> {
  const { fastCode } = await params;
  const code = fastCode.trim().toUpperCase();
  return createMetadata({
    title: `${TALISBOOKS_PRODUCT_NAME} · ${code}`,
    description: `Talisbooks™ bookshelf for FAST Code ${code}. Open a cover to read books connected to this Mapsite™ only.`,
    path: `/talisbooks/fast/${fastCode.trim().toLowerCase()}`,
    image: false,
  });
}

export default async function FastCodeBookshelfPage({
  params,
}: FastCodeBookshelfPageProps) {
  const { fastCode } = await params;
  const bookshelf = await getPublicTalisBooksBookshelf({
    fastCode: fastCode.trim() || null,
  });
  return <TalisBooksLibraryShell bookshelf={bookshelf} />;
}
