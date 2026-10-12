import { redirect } from "next/navigation";

export default async function FastCodeRedirect({ params }: { params: Promise<{ fastCode: string }> }) {
  const { fastCode } = await params;
  redirect(`/mapsite/${encodeURIComponent(String(fastCode || "").toLowerCase())}`);
}
