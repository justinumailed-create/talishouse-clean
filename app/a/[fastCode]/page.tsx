import { redirect } from "next/navigation";
import { isAllPinsFastCode } from "@/lib/talispros/allpins-mapsite-constants";
import { personalHomePath } from "@/lib/talispros/personal-home";

/** FAST Code™ short link: the owner's personal home page comes before the Mapsite. */
export default async function FastCodeRedirect({ params }: { params: Promise<{ fastCode: string }> }) {
  const { fastCode } = await params;
  const code = String(fastCode || "").trim().toLowerCase();
  if (!code || isAllPinsFastCode(code)) {
    redirect(`/mapsite/${encodeURIComponent(code)}`);
  }
  redirect(personalHomePath(code));
}
